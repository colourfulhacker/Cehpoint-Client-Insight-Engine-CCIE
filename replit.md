# Cehpoint Client Insight Engine

## Overview

The Cehpoint Client Insight Engine is a premium, production-ready B2B sales enablement platform designed for marketing and sales teams. It transforms raw LinkedIn prospect data from Excel/CSV files into personalized, actionable outreach strategies. The platform generates client categorization, three tailored pitch suggestions per prospect, and conversation starters optimized for B2B sales conversations. Features include real-time batch processing, progressive streaming results, and comprehensive export options.

## Latest Improvements (v2.0 - Modern Enterprise Design Overhaul)

### Design System Transformation
- ✅ **Complete theme redesign**: Migrated from dark slate theme to modern light off-white (#F7F8FA) background
- ✅ **Premium color palette**: Deep Sapphire (#0C1A3D) primary, Royal Blue (#2D65FF) secondary, Bright Azure (#4D9BFF) accents
- ✅ **Professional typography**: Implemented Inter font family with enterprise-grade hierarchy (48-56px H1, 32-36px H2, 24-28px H3, 16-18px body)
- ✅ **12-column grid layout**: Proper spacing and vertical rhythm with 80-100px section spacing, 24-32px internal padding
- ✅ **Reduced visual clutter**: Minimalist design with fewer boxes, more whitespace, clean dividers instead of excessive cards

### Homepage Redesign
- ✅ **Clean hero section**: Large bold headline (3.5rem), 2-line subheading, single prominent CTA button
- ✅ **Horizontal KPI strip**: Modern glassmorphism-style cards showing 15 max prospects, 5 per batch, 3 pitches each
- ✅ **Minimalist feature cards**: Three capability cards (Smart Classification, Targeted Recommendations, Personalized Outreach) with soft shadows and hover elevation
- ✅ **3-step timeline workflow**: Upload & Validate, Smart Processing, Export Results with visual timeline connector
- ✅ **Modern button styles**: Pill-shaped rounded buttons with subtle hover effects and smooth interactions
- ✅ **Premium footer**: 3-column layout with company, product, legal sections

### Upload Page Redesign
- ✅ **Light theme consistency**: Matching off-white background with charcoal text
- ✅ **Simplified form layout**: Clean upload zone with prominent drag & drop area
- ✅ **Required columns section**: Minimal styling with clear column specifications (NAME/ROLE/COMPANY options)
- ✅ **Progress visualization**: Real-time analysis progress with modern progress bar
- ✅ **Results display**: Prospect cards with profile notes, pitch suggestions, and personalized opening messages
- ✅ **Export options**: Download as text or JSON with modern button styling

### Micro-Interactions & Animation
- ✅ **Framer Motion integration**: Added smooth fade-in, slide-up animations on page load
- ✅ **Hover effects**: Cards elevate on hover, buttons scale on interaction
- ✅ **Staggered animations**: Cascading reveal effect for multiple elements
- ✅ **Smooth transitions**: All state changes have subtle motion feedback

## User Preferences

**Communication Style**: Simple, everyday language without technical jargon.
**Design Philosophy**: Enterprise-grade polish with meticulous attention to detail—every element must be perfect, accurate, and display with professional decorum.
**Theme**: Modern light theme with deep sapphire accents, clean whitespace, and premium typography.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with React 19 and TypeScript, using the App Router for modern server/client patterns.
**Design System**: Modern enterprise-grade design with light theme, 12-column grid layout, generous whitespace, premium Inter typography, and sophisticated color palette (Deep Sapphire primary, Royal Blue secondary).
**Styling**: Tailwind CSS v4.0 for responsive, accessible, and consistent styling across all components.
**Animations**: Framer Motion for smooth micro-interactions, fade-in/slide-up effects, and hover states with SSR-safe dynamic imports.

### Backend Architecture

**Server-Side Processing**: Streaming API route (`/api/analyze`) for progressive batch analysis with real-time progress updates.
**Streaming Pipeline**: Processes up to 15 prospects maximum, batched in groups of 5, with live progress tracking streamed to frontend.
**File Processing**: Uses `xlsx` library for Excel/CSV parsing with flexible column mapping (supports "name"/"full_name", "role"/"title", "company"/"org").
**Data Validation**: Zod schema validation for input files and output insights.

### AI Integration

**Service**: Google Gemini 2.5 Flash via `@google/genai` SDK for fast, cost-effective analysis.
**Approach**: Structured output generation with system prompts defining Cehpoint's service offerings (custom software development, cybersecurity).
**Intelligence**: Generates ideal client profiles, three customized pitch suggestions, and personalized conversation starters based on prospect data.
**API Key Management**: Server-side environment variables only, with intelligent key rotation support.

### Data Flow

**Process**: Upload → Validation → Parsing → Batched AI Analysis (5 prospects/batch) → Stream Results to Frontend → Progressive Display → Export Options.

## External Dependencies

### Google Gemini AI
- **Purpose**: Generates personalized AI-powered client insights and recommendations.
- **Authentication**: `GEMINI_API_KEY` environment variable.
- **Model**: `gemini-2.5-flash` for optimal speed and cost.
- **Features**: Structured output, custom prompting, batch processing support.

### NPM Packages

**Production**:
- `next`: React framework with App Router
- `react`: UI library
- `typescript`: Type safety
- `tailwindcss`: Styling framework
- `framer-motion`: Animation and micro-interactions
- `@google/genai`: Gemini AI SDK
- `xlsx`: Excel/CSV file parsing
- `zod`: Data validation

**Development**: ESLint for code quality

## Deployment & Publishing

**Production**: Vercel (recommended) for serverless deployment with built-in environment variable management.
**Development**: Replit for testing and iteration with local `npm run dev` server on port 5000.
