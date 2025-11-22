# Cehpoint Client Insight Engine (CCIE) - Developer Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [API Key Rotation System](#api-key-rotation-system)
5. [Deployment](#deployment)
6. [File Structure](#file-structure)
7. [Key Features](#key-features)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The **Cehpoint Client Insight Engine (CCIE)** is a production-ready Next.js 15 application that transforms LinkedIn prospect data into actionable B2B sales insights using Google Gemini AI.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS 4
- **Backend**: Next.js Server Actions
- **AI**: Google Gemini API (2.5-flash) with key rotation
- **File Processing**: XLSX library for Excel/CSV parsing
- **Deployment**: Vercel-ready, serverless architecture

---

## Architecture

### Application Flow
```
User Upload → File Validation → Parse (XLSX/CSV) → 
AI Analysis (Gemini) → Structured Insights → Display/Download
```

### Directory Structure
```
cehpoint-client-insight-engine/
├── app/
│   ├── components/
│   │   └── Logo.tsx              # Brand logo component
│   ├── upload/
│   │   ├── page.tsx              # Upload interface
│   │   └── actions.ts            # Server actions for file processing
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles with Tailwind
├── lib/
│   ├── gemini.ts                 # Gemini AI service with key rotation
│   ├── files.ts                  # File parsing utilities
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── public/
│   └── favicon.svg               # Site favicon
├── test_data/
│   ├── sample_prospects.csv      # Sample data for testing
│   └── real_prospects.csv        # Real LinkedIn data
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
└── README.md                     # User-facing documentation
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key(s)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cehpoint-client-insight-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   GEMINI_API_KEY=your_primary_api_key_here
   GEMINI_API_KEY_2=your_secondary_api_key_here
   ```

   **Get API Keys**: Visit [Google AI Studio](https://ai.google.dev) to generate free API keys.

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5000](http://localhost:5000)

---

## API Key Rotation System

### How It Works

The application implements intelligent API key rotation to bypass free tier rate limits:

```typescript
// lib/gemini.ts
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

### Benefits
1. **Automatic Failover**: If one key hits rate limits, automatically switches to the next
2. **Load Distribution**: Distributes API calls across multiple keys
3. **Zero Downtime**: Continues working even if one key fails
4. **Scalable**: Add more keys by creating `GEMINI_API_KEY_3`, `GEMINI_API_KEY_4`, etc.

### Configuration

**For Replit:**
Use the Secrets tab to add:
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_2`

**For Vercel:**
Add in Project Settings → Environment Variables

**For Local Development:**
Add to `.env.local` (never commit this file!)

---

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `GEMINI_API_KEY`
     - `GEMINI_API_KEY_2`
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` triggers a production deployment
   - Pull requests get preview deployments

### Serverless Configuration

The app is optimized for serverless environments:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx"],  // Prevents bundling issues
};
```

**Why serverless?**
- Zero server management
- Auto-scaling based on traffic
- Pay only for actual usage
- Global CDN distribution

---

## File Structure

### Key Files Explained

#### `lib/gemini.ts` - AI Service Layer
```typescript
export async function generateClientInsights(
  leads: LeadRecord[]
): Promise<ClientInsightReport>
```
- Handles all Gemini API communication
- Implements key rotation logic
- Validates and parses AI responses
- Enforces JSON schema for consistent output

#### `lib/files.ts` - File Processing
```typescript
export async function parseExcelFile(file: File): Promise<LeadRecord[]>
export async function parseCSVFile(file: File): Promise<LeadRecord[]>
```
- Supports Excel (.xlsx, .xls) and CSV formats
- Flexible column mapping (case-insensitive)
- Filters out incomplete records

#### `app/upload/actions.ts` - Server Actions
```typescript
export async function processLeadFile(
  formData: FormData
): Promise<UploadResult>
```
- Validates file type and size
- Orchestrates parsing → AI analysis → response
- Returns structured insights or error messages

#### `lib/types/index.ts` - Type Definitions
```typescript
export interface LeadRecord { ... }
export interface ProspectInsight { ... }
export interface ClientInsightReport { ... }
```
- Ensures type safety across the application
- Matches Gemini API response schema

---

## Key Features

### 1. File Upload & Parsing

**Supported Formats:**
- Excel: `.xlsx`, `.xls`
- CSV: `.csv`

**Required Columns** (case-insensitive):
- `name` or `full_name`
- `role`, `title`, or `occupation`
- `company` or `organization`
- `location` (optional)
- `description`, `profile`, `work_positions` (optional)

**Example CSV:**
```csv
name,role,company,location,description
John Doe,CTO,TechCorp,San Francisco,Building scalable systems
```

### 2. AI-Powered Analysis

The Gemini API analyzes each prospect to generate:

1. **Ideal Client Framework**
   - Categorizes prospects by type (Founders, CTOs, etc.)
   - Identifies common needs per category

2. **Prospect-Level Insights**
   - Profile analysis
   - 3 tailored pitch suggestions
   - Personalized conversation starter

**Example Output:**
```json
{
  "prospectInsights": [
    {
      "name": "Deepak Kumar",
      "role": "Co-founder & CTO",
      "profileNotes": "Building consumer tech with scaling needs",
      "pitchSuggestions": [
        {"pitch": "Security review + vulnerability assessment"},
        {"pitch": "Dedicated feature development pod"},
        {"pitch": "Backend architecture optimization"}
      ],
      "conversationStarter": "Deepak, I reviewed your role at Hood..."
    }
  ]
}
```

### 3. Download Options

**TXT Format:**
Formatted report for human reading, perfect for:
- Email templates
- Internal team sharing
- Quick reference

**JSON Format:**
Structured data for:
- CRM integration
- Further processing
- Automation workflows

### 4. Modern UI/UX

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Automatic theme switching based on system preference
- **Accessibility**: ARIA labels, keyboard navigation
- **Loading States**: Real-time feedback during processing
- **Error Handling**: Clear, actionable error messages

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Primary Google Gemini API key |
| `GEMINI_API_KEY_2` | Recommended | Secondary API key for rotation |
| `NODE_ENV` | Auto-set | `development` or `production` |

---

## Troubleshooting

### Common Issues

**1. "Failed to generate insights" Error**
- **Cause**: Invalid or rate-limited API key
- **Solution**: 
  - Verify API keys in environment variables
  - Check [Google AI Studio](https://ai.google.dev) quota
  - Add a second API key for rotation

**2. "No valid prospect data found"**
- **Cause**: Missing required columns (name, role, company)
- **Solution**: 
  - Ensure CSV/Excel has `name`, `role`, `company` columns
  - Column names are case-insensitive

**3. Workflow fails to start on Replit**
- **Cause**: Port mismatch
- **Solution**: Ensure `package.json` scripts use `--port 5000`

**4. Vercel deployment fails**
- **Cause**: Missing environment variables or build errors
- **Solution**:
  - Add API keys in Vercel dashboard
  - Check build logs for specific errors
  - Ensure `next.config.ts` includes `serverExternalPackages: ["xlsx"]`

**5. File upload returns "Invalid file type"**
- **Cause**: Unsupported file format
- **Solution**: Use `.xlsx`, `.xls`, or `.csv` files only

---

## Performance Optimization

### Serverless Best Practices

1. **Cold Start Mitigation**
   - Keep dependencies minimal
   - Use `serverExternalPackages` for large libraries

2. **Memory Management**
   - Process files in streams for large datasets
   - Current limit: 10MB per file

3. **AI Response Time**
   - Typically 30-60 seconds per batch
   - Use Gemini Flash model (faster than Pro)

### Scaling Considerations

**Current Limits:**
- Free Gemini API: 1,500 requests/day per key
- With 2 keys: ~3,000 requests/day
- File size: 10MB max

**To Scale Further:**
1. Add more API keys (`GEMINI_API_KEY_3`, etc.)
2. Implement request queuing
3. Consider Gemini Pro with higher quotas
4. Add Redis caching for repeated analyses

---

## Security

### Best Practices Implemented

✅ **API Key Protection**
- Never expose keys in client-side code
- Server-side only access
- Use environment variables

✅ **File Validation**
- Type checking (Excel/CSV only)
- Size limits (10MB)
- Sanitized file parsing

✅ **Input Sanitization**
- Validates all prospect data
- Filters incomplete records
- JSON schema validation on AI output

✅ **Error Handling**
- Never expose internal errors to users
- Logs detailed errors server-side
- User-friendly error messages

---

## API Reference

### Server Actions

#### `processLeadFile(formData: FormData)`

**Parameters:**
- `formData`: FormData object containing uploaded file

**Returns:**
```typescript
{
  success: boolean;
  message?: string;
  insights?: ClientInsightReport;
  error?: string;
}
```

**Example Usage:**
```typescript
const formData = new FormData();
formData.append('file', file);
const result = await processLeadFile(formData);
```

---

## Testing

### Test Files Provided

1. **`test_data/sample_prospects.csv`**
   - 5 sample prospects
   - Good for quick testing

2. **`test_data/real_prospects.csv`**
   - 20 real LinkedIn profiles
   - Comprehensive test case

### Manual Testing Checklist

- [ ] Upload sample CSV file
- [ ] Verify AI generates insights
- [ ] Download TXT report
- [ ] Download JSON export
- [ ] Test error handling (invalid file)
- [ ] Test dark mode toggle
- [ ] Test mobile responsiveness

---

## Contributing

### Development Workflow

1. Create feature branch
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and test locally

3. Commit with clear messages
   ```bash
   git commit -m "feat: add prospect filtering"
   ```

4. Push and create PR
   ```bash
   git push origin feature/your-feature
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier
- **Linting**: ESLint with Next.js config
- **Naming**: camelCase for variables, PascalCase for components

---

## License

Proprietary - Cehpoint Internal Tool

---

## Support

For technical issues or questions:
- **Documentation**: This file
- **Issues**: GitHub Issues
- **Email**: dev@cehpoint.com

---

## Changelog

### v1.0.0 (Current)
- ✨ Initial release
- 🔐 API key rotation system
- 📊 Excel/CSV file parsing
- 🤖 Gemini AI integration
- 📱 Responsive UI with dark mode
- ☁️ Vercel deployment ready
- 📄 TXT and JSON export options

---

**Last Updated**: November 2025  
**Maintained by**: Cehpoint Development Team
