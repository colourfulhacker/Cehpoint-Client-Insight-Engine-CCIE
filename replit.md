# Cehpoint Client Insight Engine

## Overview

The Cehpoint Client Insight Engine is a production-ready AI-powered B2B sales enablement tool designed to help marketing teams identify and engage with ideal prospects. The application processes Excel/CSV files containing LinkedIn prospect data and uses Google Gemini AI with intelligent key rotation to generate personalized outreach strategies, including client categorization, pitch suggestions, and conversation starters tailored to Cehpoint's custom software development and cybersecurity services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 2025 - Production Ready Release (v1.0.0)
- **API Key Rotation**: Implemented intelligent rotation system for `GEMINI_API_KEY` and `GEMINI_API_KEY_2` to bypass free tier rate limits
- **Modern UI/UX**: Completely redesigned interface with gradient backgrounds, dark mode support, and professional branding
- **Favicon & Logo**: Added custom SVG favicon and text-based logo component
- **Vercel Ready**: Configured for serverless deployment with `vercel.json` and proper serverless optimizations
- **Enhanced File Parsing**: Improved column mapping to support `full_name`, `occupation`, and other common variants
- **Comprehensive Documentation**: Added `DEVELOPER_DOCUMENTATION.md` and updated `README.md` for developers
- **Better Error Handling**: Enhanced Gemini API error handling with retry logic and clear user-facing messages
- **Download Options**: Implemented formatted TXT and structured JSON export functionality
- **Mobile Responsive**: Full mobile optimization with responsive design
- **Testing Data**: Included real LinkedIn prospect CSV file for comprehensive testing

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 19 and TypeScript

The application uses Next.js App Router architecture with a modern, professional design:
- **Landing page** (`app/page.tsx`): Feature-rich marketing page with gradient hero, feature cards, and responsive layout
- **Upload page** (`app/upload/page.tsx`): Enhanced file upload interface with drag-and-drop, loading states, and results display
- **Components** (`app/components/`): Reusable Logo component with gradient styling

**Design Pattern**: Server Actions pattern for form processing
- Rationale: Next.js Server Actions provide a type-safe way to handle file uploads and server-side processing without creating explicit API routes
- Alternative considered: Traditional API routes in `pages/api`
- Pros: Simplified data flow, automatic request/response handling, better TypeScript integration
- Cons: Less flexibility for complex API scenarios

**Styling**: Tailwind CSS 4.0
- Rationale: Utility-first CSS with dark mode support and minimal configuration
- Features: Gradient backgrounds, glass morphism effects, responsive grid layouts
- The application supports system-based dark/light mode theming via CSS variables

### Backend Architecture

**Server-Side Processing**: Next.js Server Actions (`app/upload/actions.ts`)

The backend logic follows a pipeline pattern:
1. File validation (type and size checking)
2. File parsing (Excel/CSV to structured data with flexible column mapping)
3. AI processing (generating insights via Google Gemini with key rotation)
4. Response formatting

**File Processing**: XLSX library
- Handles both Excel (`.xlsx`, `.xls`) and CSV files
- Flexible column mapping to handle various data formats (case-insensitive matching for: name/full_name, role/title/occupation, company/organization, work_positions, education)
- Rationale: XLSX provides universal spreadsheet parsing without requiring different parsers for different formats
- Configuration: Marked as external package in `next.config.ts` to prevent serverless bundling issues

**Data Validation**: Zod (v4.1.12)
- Installed for future runtime type validation
- Could be integrated for stronger input validation

### AI Integration

**Service**: Google Gemini AI via `@google/genai` SDK

**Architecture Pattern**: Prompt-based structured output generation with API key rotation
- System prompt defines Cehpoint's services and desired output format
- JSON schema-based responses for consistent data structure (responseSchema)
- Structured output ensures reliable parsing and UI rendering
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

**Benefits of Key Rotation**:
- Bypass free tier rate limits (1,500 requests/day → 3,000+ with 2 keys)
- Automatic failover if one key hits limits
- Zero downtime for users
- Scalable: add more keys (`GEMINI_API_KEY_3`, etc.) as needed

**Problem Addressed**: Converting raw prospect data into actionable sales intelligence
- Solution: Template-based prompting with domain-specific context about Cehpoint's services
- The AI analyzes prospect roles, companies, and descriptions to categorize clients and generate tailored outreach strategies
- Model: `gemini-2.5-flash` (faster, cheaper than Pro)

**API Key Management**: Environment variables (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`)
- Server-side only access for security
- Configured in Replit Secrets and Vercel Environment Variables

### Data Flow

**Lead Processing Pipeline**:
```
File Upload → Validation → Parsing → AI Analysis (with key rotation) → Structured Insights → Client Display/Download
```

**Type System**: Comprehensive TypeScript interfaces in `lib/types/index.ts`
- `LeadRecord`: Input data structure from uploaded files
- `ProspectInsight`: Individual prospect analysis with pitch suggestions
- `ClientInsightReport`: Complete output structure with framework categorization

### Output Generation

**Multiple Export Formats**:
- Plain text report (formatted for human reading, email templates)
- JSON export (structured data for CRM integration, further processing)

**Client-Side Download**: Blob URLs with dynamic filename generation
- Rationale: No server storage required, instant download experience
- Files generated on-demand in browser memory
- Filenames include date: `client-insights-2025-11-22.txt`

## External Dependencies

### Third-Party Services

**Google Gemini AI** (via `@google/genai` v1.30.0)
- Purpose: Generate AI-powered client insights and personalized outreach recommendations
- Authentication: API key via environment variable (with rotation)
- Critical dependency: Application cannot function without valid API key(s)
- Rate Limits: 1,500 requests/day per free key, 60 requests/min

### Key NPM Packages

**XLSX** (v0.18.5)
- Purpose: Parse Excel and CSV files
- Configuration: Externalized in Next.js config (`serverExternalPackages: ["xlsx"]`) to prevent serverless bundling issues
- Handles multiple spreadsheet formats with unified API

**Zod** (v4.1.12)
- Purpose: Runtime type validation
- Status: Installed but not actively used
- Future use: Input validation, API response validation

**Tailwind CSS** (v4.0.15)
- Purpose: Utility-first styling framework
- Configuration: Minimal setup with CSS imports in `app/globals.css`
- Features: Dark mode, responsive design, gradient utilities

### Development Dependencies

- **TypeScript** (v5.8.2): Type safety and developer experience
- **ESLint** (v9.23.0): Code quality with Next.js configuration
- **Next.js type definitions**: Auto-generated type support

### Runtime Environment

**Node.js Configuration**:
- Target: ES2017 for broader compatibility
- Module system: ESNext with bundler resolution
- Path aliases: `@/*` maps to project root for clean imports

**Server Configuration**:
- Development: Port 5000, hostname 0.0.0.0 (for Replit compatibility)
- Production: Next.js start server on same port
- Serverless optimized for Vercel deployment

### Database

**Current State**: No database integration
- All processing is stateless and ephemeral
- Results are generated on-demand and downloaded by users
- No data persistence between sessions
- Rationale: Simplifies deployment, reduces costs, ensures privacy

**Future Consideration**: Could add database for:
- Storing historical analyses
- User authentication and saved reports
- Analytics on prospect categorization patterns

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
- `test_data/real_prospects.csv` - 20 real LinkedIn profiles for comprehensive testing

### Testing Checklist
- [x] File upload (CSV, Excel)
- [x] API key rotation functionality
- [x] AI insight generation
- [x] TXT download export
- [x] JSON download export
- [x] Error handling (invalid files, API errors)
- [x] Dark mode toggle
- [x] Mobile responsiveness

## Security

- API keys stored server-side only (never exposed to client)
- File validation (type, size limits)
- Input sanitization and filtering
- No data persistence (stateless processing)
- HTTPS enforced in production

## Performance

- File size limit: 10MB
- Processing time: 30-60 seconds per batch
- Serverless cold start: ~2-3 seconds
- API response caching: Not implemented (stateless)

## Future Enhancements

- Add more API keys for higher throughput
- Implement request queuing for large batches
- Add PDF export option
- Integrate with CRM systems (Salesforce, HubSpot)
- User authentication and saved reports
- Analytics dashboard for team insights
