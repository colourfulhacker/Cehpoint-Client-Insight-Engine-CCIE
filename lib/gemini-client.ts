import { GoogleGenAI } from "@google/genai";
import {
  RateLimitError,
  AuthError,
  TransientAPIError,
  FatalAPIError,
  isRetryableError,
  shouldSwitchKey,
  getRetryDelay,
} from "./errors";
import { calculateBackoff, sleep, RetryConfig, DEFAULT_RETRY_CONFIG } from "./retry";

interface APIKey {
  key: string;
  name: string;
  failureCount: number;
  lastFailure?: number;
  cooldownUntil?: number;
}

interface GeminiCallOptions {
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  responseMimeType?: string;
}

interface RetryTelemetry {
  attempt: number;
  maxAttempts: number;
  error: Error;
  delay: number;
  keyUsed: string;
}

export class GeminiClient {
  private keys: APIKey[] = [];
  private currentKeyIndex: number = 0;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.loadAPIKeys();
    if (retryConfig) {
      this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    }
  }

  private loadAPIKeys(): void {
    // Load GOOGLE_API_KEY first (primary)
    const googleKey = process.env.GOOGLE_API_KEY;
    if (googleKey) {
      this.keys.push({
        key: googleKey,
        name: "google",
        failureCount: 0,
      });
    }

    // Load EXTRA keys
    for (let i = 1; i <= 5; i++) {
      const extraKey = process.env[`GEMINI_API_KEY_EXTRA_${i}`];
      if (extraKey) {
        this.keys.push({
          key: extraKey,
          name: `extra_${i}`,
          failureCount: 0,
        });
      }
    }

    // Fallback to PRIMARY and SECONDARY
    const primaryKey = process.env.GEMINI_API_KEY_PRIMARY;
    const secondaryKey = process.env.GEMINI_API_KEY_SECONDARY;

    if (primaryKey) {
      this.keys.push({
        key: primaryKey,
        name: "primary",
        failureCount: 0,
      });
    }

    if (secondaryKey) {
      this.keys.push({
        key: secondaryKey,
        name: "secondary",
        failureCount: 0,
      });
    }

    if (this.keys.length === 0) {
      throw new Error("No Gemini API keys configured");
    }
  }

  private getNextAvailableKey(): APIKey | null {
    const now = Date.now();
    const startIndex = this.currentKeyIndex;

    for (let i = 0; i < this.keys.length; i++) {
      const index = (startIndex + i) % this.keys.length;
      const key = this.keys[index];

      if (key.cooldownUntil && key.cooldownUntil > now) {
        continue;
      }

      this.currentKeyIndex = index;
      return key;
    }

    return null;
  }

  private markKeyFailed(key: APIKey, cooldownMs: number = 60000): void {
    key.failureCount++;
    key.lastFailure = Date.now();
    key.cooldownUntil = Date.now() + cooldownMs;
  }

  private markKeySuccess(key: APIKey): void {
    key.failureCount = 0;
    key.cooldownUntil = undefined;
  }

  private classifyError(error: any): Error {
    const errorMessage = error?.message || String(error);
    const statusCode = error?.status || error?.statusCode;

    if (statusCode === 429 || errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
      const retryAfter = error?.retryAfter || 60;
      return new RateLimitError(errorMessage, retryAfter);
    }

    if (
      statusCode === 401 ||
      statusCode === 403 ||
      errorMessage.includes("API key") ||
      errorMessage.includes("authentication")
    ) {
      return new AuthError(errorMessage);
    }

    if (statusCode === 400 || errorMessage.includes("validation")) {
      return new FatalAPIError(errorMessage);
    }

    if (
      statusCode === 500 ||
      statusCode === 502 ||
      statusCode === 503 ||
      statusCode === 504 ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("network")
    ) {
      return new TransientAPIError(errorMessage);
    }

    return new FatalAPIError(errorMessage);
  }

  async callWithRetry(
    options: GeminiCallOptions,
    onRetry?: (telemetry: RetryTelemetry) => void
  ): Promise<string> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      const key = this.getNextAvailableKey();

      if (!key) {
        const minCooldown = Math.min(
          ...this.keys
            .filter((k) => k.cooldownUntil)
            .map((k) => (k.cooldownUntil! - Date.now()) / 1000)
        );
        throw new RateLimitError(
          `All API keys are on cooldown. Minimum wait: ${minCooldown.toFixed(0)}s`,
          Math.ceil(minCooldown)
        );
      }

      try {
        const ai = new GoogleGenAI({ apiKey: key.key });
        const response = await ai.models.generateContent({
          model: options.model,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: options.responseMimeType || "application/json",
            temperature: options.temperature ?? 0.7,
          },
          contents: [{ role: "user", parts: [{ text: options.userPrompt }] }],
        });

        let rawJson: string | null = null;

        if ((response as any)?.text) {
          rawJson = (response as any).text;
        } else if ((response as any)?.response?.text) {
          rawJson = (response as any).response.text;
        } else if ((response as any)?.candidates?.[0]?.content?.parts?.[0]?.text) {
          rawJson = (response as any).candidates[0].content.parts[0].text;
        }

        if (!rawJson) {
          throw new Error("Failed to extract response from Gemini API");
        }

        this.markKeySuccess(key);
        return rawJson.trim();
      } catch (error) {
        const classifiedError = this.classifyError(error);
        lastError = classifiedError;

        if (shouldSwitchKey(classifiedError)) {
          this.markKeyFailed(key, 300000);
          continue;
        }

        if (!isRetryableError(classifiedError)) {
          throw classifiedError;
        }

        if (attempt < this.retryConfig.maxAttempts - 1) {
          const customDelay = getRetryDelay(classifiedError);
          const delay = customDelay !== undefined
            ? customDelay
            : calculateBackoff(attempt, this.retryConfig);

          if (classifiedError instanceof RateLimitError) {
            this.markKeyFailed(key, delay);
          }

          onRetry?.({
            attempt: attempt + 1,
            maxAttempts: this.retryConfig.maxAttempts,
            error: classifiedError,
            delay,
            keyUsed: key.name,
          });

          await sleep(delay);
        }
      }
    }

    throw lastError!;
  }
}

export const geminiClient = new GeminiClient();
