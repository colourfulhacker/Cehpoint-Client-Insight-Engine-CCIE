# 🎯 Cehpoint Client Insight Engine (CCIE)

Transform your LinkedIn prospect data into actionable sales intelligence with AI-powered analysis.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-purple)

## ✨ Features

- 🤖 **AI-Powered Analysis**: Google Gemini API generates personalized insights
- 🔄 **Smart Key Rotation**: Automatic API key switching to bypass rate limits
- 📊 **Multi-Format Support**: Upload Excel (.xlsx, .xls) or CSV files
- 🎯 **Client Categorization**: Identifies ideal prospects by role and needs
- 💬 **Conversation Starters**: Ready-to-send personalized messages
- 📥 **Export Options**: Download insights as TXT or JSON
- 🌙 **Dark Mode**: Automatic theme switching
- ⚡ **Serverless**: Optimized for Vercel deployment

## 🚀 Quick Start

### 1. Get API Keys

Visit [Google AI Studio](https://ai.google.dev) and generate 2 free API keys.

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Add environment variables during deployment:
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_2`

### 3. Upload Your Data

Prepare a CSV or Excel file with these columns:
- `name` (required)
- `role` or `occupation` (required)
- `company` (required)
- `location` (optional)
- `description` (optional)

## 📖 How It Works

1. **Upload**: Drop your prospect data file
2. **Analyze**: AI processes each prospect in ~60 seconds
3. **Get Insights**: View categorized prospects with:
   - Profile analysis
   - 3 tailored pitch suggestions
   - Personalized conversation starters
4. **Download**: Export as TXT or JSON

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Add GEMINI_API_KEY and GEMINI_API_KEY_2

# Run development server
npm run dev

# Open http://localhost:5000
```

## 📁 Example Input

```csv
name,role,company,location,description
Deepak Kumar,Co-founder & CTO,Hood,Mumbai,Building consumer tech platform
Sougam Maity,Founder,Punyaha Health,Kolkata,Health-tech with HIPAA focus
```

## 📤 Example Output

```
1. Deepak Kumar
   Role: Co-founder & CTO @Hood

   Profile Notes:
   Building consumer-facing tech with scaling needs. Requires performance
   optimization and rapid development cycles.

   Pitch Suggestions:
   1. Security review + vulnerability assessment
   2. Dedicated feature development pod
   3. Backend architecture optimization

   Conversation Starter:
   "Deepak, I reviewed your role at Hood and noticed how quickly you're
   scaling. We support tech-led teams with secure development..."
```

## 🔑 API Key Rotation

The app automatically rotates between multiple API keys to:
- Bypass free tier rate limits (1,500 requests/day per key)
- Ensure zero downtime
- Distribute load across keys

Add more keys by creating `GEMINI_API_KEY_3`, `GEMINI_API_KEY_4`, etc.

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4
- **AI**: Google Gemini 2.5-flash
- **File Processing**: XLSX library
- **Deployment**: Vercel (serverless)

## 📚 Documentation

- [Developer Documentation](./DEVELOPER_DOCUMENTATION.md) - Complete technical guide
- [Architecture](./DEVELOPER_DOCUMENTATION.md#architecture) - System design details
- [API Reference](./DEVELOPER_DOCUMENTATION.md#api-reference) - Server actions and types

## 🔒 Security

- API keys stored server-side only
- File validation (type, size)
- Input sanitization
- No data persistence (stateless)

## 🤝 Contributing

This is an internal Cehpoint tool. For feature requests or bugs, contact the development team.

## 📄 License

Proprietary - Cehpoint Internal Use Only

## 🆘 Support

- **Documentation**: See [DEVELOPER_DOCUMENTATION.md](./DEVELOPER_DOCUMENTATION.md)
- **Issues**: Contact dev@cehpoint.com

---

**Built with ❤️ by Cehpoint Development Team**
