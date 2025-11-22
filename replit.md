# Cehpoint Client Insight Engine

## Overview

The Cehpoint Client Insight Engine is a production-ready AI-powered B2B sales enablement tool designed to help marketing teams identify and engage with ideal prospects. The application processes Excel/CSV files containing LinkedIn prospect data and uses Google Gemini AI with intelligent key rotation to generate personalized outreach strategies, including client categorization, pitch suggestions, and conversation starters tailored to Cehpoint's custom software development and cybersecurity services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 2025 - UI Redesign & Bug Fixes (v1.0.1)
- **Complete UI Redesign**: Simplified, modern, professional design replacing overly complex gradients
- **Clean Homepage**: Professional layout with hero section, feature cards, and clear value proposition
- **Improved Upload Page**: Streamlined form with better visual hierarchy and error messages
- **Better Error Handling**: Enhanced Gemini API response parsing with detailed logging for debugging
- **Color Scheme**: Updated to light blue/purple gradients with clean, readable text
- **Professional Typography**: Improved font sizing, spacing, and hierarchy throughout
- **Mobile Optimized**: Responsive design that works beautifully on all devices
- **Fixed CSS**: Proper Tailwind v4 configuration with correct `@import "tailwindcss"` syntax
- **Improved Logging**: Added detailed console logging for API responses to aid debugging

### Previous - Production Ready Release (v1.0.0)
- API Key Rotation: Implemented intelligent rotation system for `GEMINI_API_KEY` and `GEMINI_API_KEY_2`
- Modern UI/UX: Completely redesigned interface with gradient backgrounds and dark mode support
- Favicon & Logo: Added custom SVG favicon and text-based logo component
- Vercel Ready: Configured for serverless deployment
- Enhanced File Parsing: Improved column mapping for multiple data formats
- Comprehensive Documentation: Added detailed developer documentation

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 19 and TypeScript

The application uses Next.js App Router architecture with a clean, professional design:
- **Landing page** (`app/page.tsx`): Professional hero section with feature cards and clear CTA
- **Upload page** (`app/upload/page.tsx`): Simple file upload form with status displays
- **Components** (`app/components/`): Reusable Logo component

**Design Pattern**: Server Actions pattern for form processing

**Styling**: Tailwind CSS v4.0
- Clean, minimal aesthetic with professional color scheme
- Responsive design with mobile-first approach
- Dark mode support via CSS
- Simple, legible typography

### Backend Architecture

**Server-Side Processing**: Next.js Server Actions (`app/upload/actions.ts`)

The backend follows a pipeline pattern:
1. File validation (type and size checking)
2. File parsing (Excel/CSV to structured data)
3. AI processing (generating insights via Google Gemini with key rotation)
4. Response formatting

**File Processing**: XLSX library
- Handles Excel (.xlsx, .xls) and CSV files
- Flexible column mapping for various data formats
- Configuration: Marked as external in `next.config.ts`

**Data Validation**: Zod (v4.1.12)
- Installed for future runtime type validation

### AI Integration

**Service**: Google Gemini AI via `@google/genai` SDK

**Architecture Pattern**: Prompt-based structured output generation with API key rotation
- System prompt defines Cehpoint's services and output format
- JSON schema-based responses for consistent data
- Structured output ensures reliable parsing
- **Key Rotation Logic**: Cycles through multiple API keys automatically on each request

**API Key Rotation System**:
```typescript
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
].filter(key => key.length > 0);

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}
```

**Error Handling Improvements**:
- Enhanced response parsing with multiple fallback methods
- Detailed logging of API responses for debugging
- Better error messages returned to frontend
- Proper handling of empty or malformed responses

**Model**: `gemini-2.5-flash` (faster, cheaper than Pro)

**API Key Management**: Environment variables (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`)
- Server-side only access for security
- Configured in Replit Secrets and Vercel Environment Variables

### Data Flow

**Lead Processing Pipeline**:
```
File Upload → Validation → Parsing → AI Analysis (with key rotation) → Structured Insights → Client Display/Download
```

**Type System**: Comprehensive TypeScript interfaces in `lib/types/index.ts`

### Output Generation

**Multiple Export Formats**:
- Plain text report (formatted for human reading, email templates)
- JSON export (structured data for CRM integration)

**Client-Side Download**: Blob URLs with dynamic filename generation

## External Dependencies

### Third-Party Services

**Google Gemini AI** (via `@google/genai` v1.30.0)
- Purpose: Generate AI-powered client insights
- Authentication: API key via environment variable (with rotation)
- Rate Limits: 1,500 requests/day per free key, 60 requests/min

### Key NPM Packages

**XLSX** (v0.18.5)
- Purpose: Parse Excel and CSV files
- Configuration: Externalized in Next.js config

**Tailwind CSS** (v4.0.15)
- Purpose: Utility-first styling framework
- Features: Clean, professional design, dark mode, responsive

### Development Dependencies

- **TypeScript** (v5.8.2): Type safety
- **ESLint** (v9.23.0): Code quality
- **Next.js type definitions**: Auto-generated type support

### Runtime Environment

**Node.js Configuration**:
- Target: ES2017 for broader compatibility
- Module system: ESNext with bundler resolution

**Server Configuration**:
- Development: Port 5000, hostname 0.0.0.0
- Production: Next.js start server on same port
- Serverless optimized for Vercel

### Database

**Current State**: No database integration
- All processing is stateless and ephemeral
- Results are generated on-demand
- No data persistence between sessions

## Deployment

### Vercel (Recommended)
- Configured with `vercel.json`
- Add environment variables in Vercel dashboard:
  - `GEMINI_API_KEY`
  - `GEMINI_API_KEY_2`
- Automatic deployments on git push
- Serverless architecture with global CDN

### Replit
- Development and testing environment
- Secrets configured in Secrets tab
- Workflow runs on port 5000

## Testing

### Test Files
- `test_data/sample_prospects.csv` - 5 sample prospects for quick testing
- `test_data/real_prospects.csv` - 20 real LinkedIn profiles

### Column Requirements
**Required**:
- `name` or `full_name`
- `role` or `occupation`
- `company` or `organization`

**Optional**:
- `location`
- `description` or `profile`

## Security

- API keys stored server-side only
- File validation (type, size limits)
- Input sanitization and filtering
- No data persistence (stateless processing)
- HTTPS enforced in production

## Performance

- File size limit: 10MB
- Processing time: 30-60 seconds per batch
- Serverless cold start: ~2-3 seconds
- No API response caching (stateless)

## Future Enhancements

- Add more API keys for higher throughput
- Implement request queuing for large batches
- Add PDF export option
- Integrate with CRM systems (Salesforce, HubSpot)
- User authentication and saved reports
- Analytics dashboard for team insights
- Custom prompt templates
- Batch processing with progress tracking
