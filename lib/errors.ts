export class RateLimitError extends Error {
  constructor(
    message: string = "API rate limit exceeded",
    public retryAfter?: number
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class AuthError extends Error {
  constructor(message: string = "API authentication failed") {
    super(message);
    this.name = "AuthError";
  }
}

export class ValidationError extends Error {
  constructor(message: string = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class TransientAPIError extends Error {
  constructor(message: string = "Temporary API error") {
    super(message);
    this.name = "TransientAPIError";
  }
}

export class FatalAPIError extends Error {
  constructor(message: string = "Fatal API error") {
    super(message);
    this.name = "FatalAPIError";
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof TransientAPIError) return true;
  if (error instanceof AuthError) return true;
  return false;
}

export function shouldSwitchKey(error: unknown): boolean {
  return error instanceof AuthError;
}

export function getRetryDelay(error: unknown): number | undefined {
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000;
  }
  return undefined;
}
