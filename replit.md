# Cehpoint Client Insight Engine

## Overview

The Cehpoint Client Insight Engine is a production-ready B2B sales enablement tool designed for marketing teams. It processes LinkedIn prospect data from Excel/CSV files to generate personalized outreach strategies. These strategies include client categorization, pitch suggestions, and conversation starters tailored to Cehpoint's custom software development and cybersecurity services. Features real-time batch processing, progressive streaming results, and comprehensive export options.

## Latest Improvements (v1.3.0 - Comprehensive UI/UX Audit & Polish)

**Homepage Enhancements:**
- ✅ Hero headline redesign—split layout ("Transform Prospect" white + "Data Into Intelligence" gradient) for better visual flow
- ✅ CTA button amplified—larger size (min-h-16, text-lg, font-black), stronger gradient, enhanced glow effect with shadow
- ✅ Stats cards styled—added subtle backgrounds, borders, gradient numbers (cyan gradient), hover effects for visual hierarchy
- ✅ Feature cards refined—improved border visibility, gradient backgrounds, larger icons (text-5xl), hover shadows
- ✅ Workflow step numbers enlarged (w-20 h-20)—stronger cyan gradient, enhanced border styling, increased prominence

**Upload Page Polish:**
- ✅ File selection label enhanced—added emoji, increased to text-lg, font-black for better prominence
- ✅ Upload zone border visibility improved—changed from subtle slate-600 to prominent blue-400 with proper contrast
- ✅ Upload zone background enhanced—increased opacity and added shadow for better depth perception
- ✅ Required Columns section redesigned—gradient background, stronger borders, better card organization with individual column cards
- ✅ Column labels improved—larger, bolder typography with better visual separation
- ✅ Optional columns text styled—increased weight and contrast
- ✅ Submit button amplified—larger size (min-h-16, text-lg, font-black), enhanced gradient, stronger shadow (shadow-2xl shadow-blue-600/50)

**Overall Design Consistency:**
- ✅ Enhanced button shadows throughout—consistent shadow-2xl shadow-blue-600/50 for all primary CTAs
- ✅ Improved typography hierarchy—better font weights and sizes across all sections
- ✅ Better visual feedback—stronger hover states and transitions on interactive elements
- ✅ Production-ready styling—all components polished to enterprise standards

## User Preferences

Preferred communication style: Simple, everyday language.
Design Philosophy: Enterprise-grade polish with maximum attention to detail—every element must be perfect, accurate, and display with proper decorum.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 19 and TypeScript, utilizing the App Router architecture.
**Design System**: Enterprise-grade with a focus on perfection. Features include a slate color palette, optimized typography, 8px grid spacing, consistent component design, and comprehensive dark mode support.
**Styling**: Tailwind CSS v4.0 for a professional, minimal aesthetic, responsive design, and accessible components (minimum 44px touch targets).

### Backend Architecture

**Server-Side Processing**: Hybrid approach with both legacy direct processing via Server Actions and a new streaming API route (`/api/analyze`) for progressive batch analysis.
**Streaming Pipeline**: Supports real-time display of results, processing prospects in batches of 5 (max 15 prospects per file) with live progress tracking.
**File Processing**: Uses the `xlsx` library to handle Excel/CSV files, with flexible column mapping and automatic filtering of invalid records. Configured as external in `next.config.ts`.
**Data Validation**: Zod is used for schema validation of file inputs and outputs.

### AI Integration

**Service**: Google Gemini AI via `@google/genai` SDK.
**Architecture Pattern**: Utilizes prompt-based structured output generation with a system prompt defining Cehpoint's services and JSON schema-based responses. Intelligent API key rotation automatically cycles through multiple API keys for security and reliability.
**Model**: `gemini-2.5-flash` is used for fast and cost-effective processing.
**API Key Management**: Environment variables (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`) are managed server-side only for security.

### Data Flow

**Streaming Pipeline**: File Upload → Validation → Parsing → Batched AI Analysis (5 prospects/batch) → Stream Results to Frontend → Progressive Display.

### UI/UX Design Details

The application features a professional design system with a slate color scheme, optimized typography, and an 8px grid system for consistent spacing. Interactive elements include 44px minimum height buttons and smooth focus transitions. The design is fully responsive and supports dark mode. Page sections include a sticky navigation, hero section, capabilities, how-it-works, a professional upload form, and a detailed results display with prospect cards.

## External Dependencies

### Google Gemini AI
- **Purpose**: Generates AI-powered client insights.
- **Authentication**: API keys via environment variables (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`).
- **Features**: Intelligent API key rotation for rate limit management.

### NPM Packages

**Production**:
- `next`: React framework.
- `react`: UI library.
- `typescript`: For type safety.
- `tailwindcss`: Styling framework.
- `@google/genai`: Google Gemini AI SDK.
- `xlsx`: For Excel/CSV file parsing.
- `zod`: For data validation.

**Deployment**:
- **Vercel**: Recommended for production, leveraging serverless functions and environment variables.
- **Replit**: Used for development and testing with local server (`npm run dev`).