# Cehpoint Client Insight Engine

## Overview

The Cehpoint Client Insight Engine is a premium, production-ready B2B sales enablement platform for marketing and sales teams. It transforms raw LinkedIn prospect data from Excel/CSV files into personalized, actionable outreach strategies. The platform generates client categorization, three tailored pitch suggestions per prospect, and conversation starters optimized for B2B sales conversations. Key capabilities include real-time batch processing, progressive streaming results with time-based pagination, mid-process export, and comprehensive data export options. It also features a complete learning hub, outreach templates library, campaign management, and robust error handling with multi-key API rotation.

## User Preferences

**Communication Style**: Simple, everyday language without technical jargon.
**Design Philosophy**: Enterprise-grade polish with meticulous attention to detail—every element must be perfect, accurate, and display with professional decorum. Comparable to Stripe, Linear, Notion, HubSpot.
**Theme**: Modern light theme with deep sapphire accents, clean whitespace, and premium typography.
**Feature Priority**: Support unlimited prospect files with time-based pagination and mid-process export.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 19 and TypeScript (App Router).
**Styling**: Tailwind CSS v4.0 with a custom color system and spacing scales.
**Animations**: Framer Motion for smooth micro-interactions.
**Design System**: Enterprise-grade light theme featuring a split hero layout, soft shadows, 20px rounded corners, 8px-based spacing, and premium Inter typography with a sophisticated color palette.
**Key UI/UX Components**: Campaign management module, outreach templates library, learning hub (10 Cehpoint service areas), settings, and help center. Mobile-responsive design with a hamburger menu and slide-in sidebar.

### Backend Architecture

**Server-Side Processing**: Streaming API route (`/api/analyze`) for progressive batch analysis.
**Pagination Strategy**:
  - Initial load: 15 prospects immediately in 5-prospect sub-batches.
  - Subsequent batches: 15 prospects every 1 minute, split into 5-prospect sub-batches.
  - Supports unlimited prospects through automatic batching.
**File Processing**: `xlsx` library for Excel/CSV with flexible column mapping.
**Data Validation**: Zod schema validation for input and output.
**Error Handling**: Comprehensive error classification (RateLimitError, AuthError, ValidationError, TransientAPIError, FatalAPIError) with exponential backoff and configurable jitter for retries.

### AI Integration

**Service**: Google Gemini 2.5 Flash via a custom `GeminiClient` wrapper.
**Intelligence**: Utilizes an Ideal Client Framework (4 buyer personas) to generate category classifications, prospect-level insights, three tailored, business-outcome-focused pitch suggestions, and personalized conversation starters.
**Prompt Structure**: System context for expert B2B sales strategist, user-provided prospect data with critical requirements, and strict JSON output.
**API Key Management**: Multi-key rotation (PRIMARY, SECONDARY, EXTRA_1-5) with automatic failover on authentication errors, per-key cooldown, and failure tracking.

## External Dependencies

-   **Google Gemini AI**: Used for AI-powered client insights and recommendations, employing the `gemini-2.5-flash` model.
-   **NPM Packages**:
    -   `next`, `react`, `typescript`: Core development frameworks.
    -   `tailwindcss`: CSS framework for styling.
    -   `framer-motion`: For animations.
    -   `@google/genai`: Google Gemini AI SDK.
    -   `xlsx`: For Excel/CSV file parsing.
    -   `zod`: For data validation.