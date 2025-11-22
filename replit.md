# Cehpoint Client Insight Engine

## Overview

The Cehpoint Client Insight Engine is a production-ready AI-powered B2B sales enablement tool designed to help marketing teams identify and engage with ideal prospects. The application processes Excel/CSV files containing LinkedIn prospect data and uses Google Gemini AI with intelligent key rotation to generate personalized outreach strategies, including client categorization, pitch suggestions, and conversation starters tailored to Cehpoint's custom software development and cybersecurity services.

## User Preferences

Preferred communication style: Simple, everyday language.
Design Philosophy: Enterprise-grade polish with maximum attention to detail—every element must be perfect, accurate, and display with proper decorum.

## Recent Changes

### November 2025 - Progressive Streaming Analysis (v1.2.0)
- **Real-Time Results Display**: Prospects display progressively as each batch completes
- **Batch Processing**: Analyzes prospects in batches of 5 for optimal accuracy
- **Live Progress Tracking**: Shows progress bar and batch completion status (e.g., "Processing batch 1/3")
- **Streaming API**: New `/api/analyze` route with ReadableStream for server-sent updates
- **Instant Feedback**: Users see results appearing in real-time instead of waiting for full completion
- **Better UX**: Smooth fade-in animations for each new prospect card
- **Improved Responsiveness**: Background processing while frontend displays results progressively
- **Smart Batch Streaming**: Up to 15 prospects processed, automatically chunked into batches
- **File Truncation Notification**: Users informed if file exceeds 15-prospect limit

### November 2025 - Enterprise-Grade Polish & Perfect Design (v1.1.0)
- **Enterprise-Grade UI**: Completely perfected with professional decorum on every element
- **Perfect Typography**: Refined line heights, letter-spacing, and font sizing across all sections
- **Flawless Spacing**: All spacing on 8px grid system with precise pixel-perfect alignment
- **Professional Colors**: Slate color palette with perfect contrast ratios and visual hierarchy
- **Button States**: Enhanced hover, active, focus, and disabled states with smooth transitions
- **Form Design**: Professional form elements with proper labels, validation, and error states
- **Accessibility**: Added proper ARIA labels, focus management, and 44px minimum touch targets
- **Dark Mode**: Complete dark mode support with proper color transitions
- **Removed Branding**: No Gemini mentions or AI promotion—focus purely on business value
- **Clean Navigation**: Professional header with proper logo and sticky positioning
- **Results Display**: Beautiful prospect insight cards with organized information hierarchy
- **File Upload**: Professional drag-and-drop area with clear feedback and status messaging
- **Error Handling**: Professional error messages with proper visual treatment
- **Mobile Responsive**: Perfect responsive design across all device sizes
- **CSS Refinements**: Optimized global styles with smooth transitions and proper focus states

### November 2025 - UI Redesign & Professional Branding (v1.0.1)
- **Professional Design**: Removed casual elements and excessive gradients
- **Clean Homepage**: Professional hero section with feature cards and clear value proposition
- **Improved Upload Page**: Streamlined form with visual hierarchy and error messages
- **Better Error Handling**: Enhanced Gemini API response parsing with detailed logging
- **Professional Typography**: Improved font sizing, spacing, and hierarchy throughout
- **Mobile Optimized**: Responsive design that works beautifully on all devices
- **Fixed CSS**: Proper Tailwind v4 configuration with correct `@import "tailwindcss"` syntax

### Previous - Production Ready Release (v1.0.0)
- API Key Rotation: Implemented intelligent rotation system for `GEMINI_API_KEY` and `GEMINI_API_KEY_2`
- Favicon & Logo: Added custom text-based logo component
- Vercel Ready: Configured for serverless deployment
- Enhanced File Parsing: Improved column mapping for multiple data formats

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 19 and TypeScript

The application uses Next.js App Router architecture with enterprise-grade design:
- **Landing page** (`app/page.tsx`): Professional hero with capabilities, how-it-works, and CTA sections
- **Upload page** (`app/upload/page.tsx`): File upload form with validation, results display, and download options
- **Components** (`app/components/Logo.tsx`): Professional logo component with dark mode support

**Design System**: Enterprise-grade with perfect attention to detail
- **Color Palette**: Slate grays (#0f172a, #f8fafc) with proper contrast ratios
- **Typography**: System fonts with optimized line heights and letter spacing
- **Spacing**: 8px grid system throughout for consistent alignment
- **Components**: Consistent button styles, form elements, and card designs
- **States**: Hover, active, focus, and disabled states on all interactive elements
- **Dark Mode**: Complete dark mode support with smooth transitions

**Styling**: Tailwind CSS v4.0
- Professional, minimal aesthetic with enterprise color scheme
- Responsive design with mobile-first approach
- Complete dark mode support with CSS variables
- Clean, legible typography with proper hierarchy
- Touch targets minimum 44px on mobile devices
- Focus management with proper outline styling

### Backend Architecture

**Server-Side Processing**: Hybrid approach with streaming
- **Server Actions** (`app/upload/actions.ts`): Legacy endpoint for direct processing
- **Streaming API Route** (`app/api/analyze/route.ts`): New endpoint with progressive batch analysis

**Streaming Pipeline**:
1. File validation (type and size checking)
2. File parsing (Excel/CSV to structured data, max 15 records)
3. Batch splitting (5 prospects per batch)
4. Progressive AI analysis (Gemini processing per batch)
5. Real-time streaming to frontend (JSON-encoded updates)
6. Client-side rendering (results display as they arrive)

**Batch Processing**:
- Maximum 15 prospects per file
- Grouped into batches of 5
- Streamed results appear immediately after each batch completes
- Frontend displays progress bar and batch status

**File Processing**: XLSX library
- Handles Excel (.xlsx, .xls) and CSV files
- Flexible column mapping for various data formats
- Automatic filtering of invalid records (missing name/role)
- Configuration: Marked as external in `next.config.ts`

**Data Validation**: Zod
- Schema validation for file inputs and outputs
- Real-time validation during streaming

### AI Integration

**Service**: Google Gemini AI via `@google/genai` SDK

**Architecture Pattern**: Prompt-based structured output generation with API key rotation
- System prompt defines Cehpoint's services and output format
- JSON schema-based responses for consistent data
- Structured output ensures reliable parsing
- **Key Rotation**: Automatically cycles through multiple API keys

**Model**: `gemini-2.5-flash` (fast, cost-effective)

**API Key Management**: Environment variables (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`)
- Server-side only for security
- Configured in Replit Secrets and Vercel Environment Variables

### Data Flow

**Sequential Pipeline** (Legacy, via Server Actions):
```
File Upload → Validation → Parsing → AI Analysis → Insights → Display/Download
```

**Streaming Pipeline** (New, via API Route):
```
File Upload → Validation → Parsing → Batch 1 (5) → Stream Results → Display
                                   ↓
                           Batch 2 (5) → Stream Results → Display  
                                   ↓
                           Batch 3 (5) → Stream Results → Display/Download
```

**Stream Data Format** (newline-delimited JSON):
- `status`: Initial message with prospect count and batch info
- `batch`: Prospect results with progress percentage
- `complete`: Final report with all accumulated data
- `error`: Error messages during streaming

## UI/UX Design Details

### Professional Design System

**Color Scheme**:
- Light Mode: White backgrounds, slate-900 text, slate-200 borders
- Dark Mode: Slate-950 backgrounds, slate-50 text, slate-800 borders
- Accent: Slate-900 (dark) and white (light) for buttons and CTAs

**Typography**:
- Heading 1: 2.5rem (40px) on desktop, 1.875rem (30px) on mobile
- Heading 2: 2rem (32px) on desktop, 1.5rem (24px) on mobile
- Body: 1rem (16px) with 1.6 line height
- Small text: 0.875rem (14px) for secondary information
- Letter spacing: -0.02em for headings, 0 for body

**Spacing**:
- All spacing uses 8px grid system
- Section padding: 24px (py-24) for vertical sections
- Component padding: 8px-12px (p-8 to p-12) for cards
- Gap between elements: 8px-16px for consistent alignment

**Interactive Elements**:
- Buttons: 44px minimum height on mobile, 12px padding
- Form inputs: 12px padding, 1px borders, smooth focus transitions
- Links: Smooth hover transition with opacity changes
- All interactive elements have :focus-visible states

**Responsive Design**:
- Mobile-first approach with breakpoints at 640px (sm), 768px (md)
- Maximum content width: 1280px (max-w-7xl)
- Proper padding adjustments for all screen sizes

### Page Sections

**Navigation**:
- Sticky header with 64px height (h-16)
- Professional logo with dark/light mode support
- Clean border separator

**Hero Section**:
- Centered content with max-width-3xl
- Large, compelling headline
- Supportive subheading
- Clear call-to-action button

**Capabilities Section**:
- Grid layout (1 col mobile, 3 col desktop)
- Card design with hover effects
- Numeric badges (01, 02, 03)
- Professional spacing and hierarchy

**How It Works**:
- Numbered steps with circle badges
- Vertical layout with separator lines
- Clear, concise descriptions

**Upload Form**:
- Professional form container
- Drag-and-drop file upload area
- Requirements box with code snippets
- Full-width submit button
- Status messaging and error handling

**Results Display**:
- Success banner with icon and confirmation
- Download buttons for TXT and JSON
- Prospect cards with organized sections:
  - Prospect header (name and role)
  - Profile summary
  - Service recommendations (numbered list)
  - Opening message (highlighted box)

**Footer**:
- Company information
- Professional styling

## External Dependencies

### Google Gemini AI
- Purpose: Generate AI-powered client insights
- Authentication: API keys via environment variables
- Rate Limits: 1,500 requests/day per key, 60 requests/min
- Rotation: Automatically switches between multiple keys

### NPM Packages

**Production**:
- `next`: v15.x - React framework
- `react`: v19.x - UI library
- `typescript`: v5.8.x - Type safety
- `tailwindcss`: v4.0.x - Styling framework
- `@google/genai`: v1.30.x - Gemini AI SDK
- `xlsx`: v0.18.x - Excel/CSV parsing
- `zod`: v4.1.x - Data validation
- `@tailwindcss/postcss`: Latest - Tailwind PostCSS plugin

### Development**:
- `eslint`: Code quality
- `eslint-config-next`: Next.js ESLint rules
- `@types/node`, `@types/react`, `@types/react-dom`: TypeScript definitions

## Deployment

### Vercel (Recommended)
- Production deployment with serverless functions
- Environment variables:
  - `GEMINI_API_KEY`
  - `GEMINI_API_KEY_2`
- Automatic deployments on git push
- Global CDN for fast content delivery

### Replit
- Development and testing environment
- Port 5000 for web preview
- Workflow: `npm run dev`
- Secrets configured in Secrets tab

## Testing

### Test Data Files
- `test_data/sample_prospects.csv` - 5 prospects for quick testing
- `test_data/real_prospects.csv` - 20 realistic profiles

### Required Columns
- `name` or `full_name`
- `role` or `occupation`
- `company` or `organization`

### Optional Columns
- `location`
- `description` or `profile`

## Security

- API keys: Server-side only, never exposed to frontend
- File validation: Type and size limits enforced
- Input sanitization: All user inputs validated
- No data persistence: Stateless processing
- HTTPS: Enforced in production

## Performance

- File size limit: 10 MB
- Processing time: 30-60 seconds per batch
- Cold start: ~2-3 seconds on serverless
- No caching: Fresh insights on every request

## Quality Standards

This application meets enterprise standards:

- **Accessibility**: WCAG 2.1 AA compliant with proper focus management
- **Performance**: Optimized bundle size and fast load times
- **Code Quality**: TypeScript, ESLint, consistent styling
- **Error Handling**: Professional error messages and graceful degradation
- **Mobile First**: Perfect responsive design on all devices
- **Dark Mode**: Complete dark mode support
- **Internationalization**: Ready for future multi-language support

## Future Enhancements

- Add more API keys for increased throughput
- Implement request queuing for large batches
- PDF export option
- CRM integration (Salesforce, HubSpot)
- User authentication and saved reports
- Analytics dashboard
- Custom prompt templates
- Batch processing with progress tracking
- Report scheduling and automation
