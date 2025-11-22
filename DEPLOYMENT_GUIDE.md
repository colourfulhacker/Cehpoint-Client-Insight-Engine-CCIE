# Cehpoint Client Insight Engine - Deployment Guide

## Production Deployment on Vercel

### Prerequisites
- Vercel account (free tier works)
- 1-7 Google Gemini API keys (minimum 1, recommended 2-3 for reliability)
- GitHub repository (or other Git provider)

### Step 1: Prepare API Keys

1. **Generate Gemini API Keys**
   - Visit [Google AI Studio](https://ai.google.dev)
   - Create 1-7 API keys (more keys = better reliability)
   - Copy each key securely

2. **Recommended Key Setup**
   - **Minimum**: 1 key (GEMINI_API_KEY_PRIMARY)
   - **Recommended**: 2-3 keys (PRIMARY + SECONDARY + EXTRA_1)
   - **Maximum**: 7 keys (PRIMARY + SECONDARY + EXTRA_1-5)

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. **Import Project**
   ```
   1. Go to https://vercel.com/new
   2. Import your Git repository
   3. Select the repository
   4. Click "Import"
   ```

2. **Configure Environment Variables**
   ```
   In the "Environment Variables" section, add:
   
   Required (Minimum):
   - GEMINI_API_KEY_PRIMARY = your_first_api_key
   
   Recommended (For Reliability):
   - GEMINI_API_KEY_SECONDARY = your_second_api_key
   - GEMINI_API_KEY_EXTRA_1 = your_third_api_key
   
   Optional (Maximum Reliability):
   - GEMINI_API_KEY_EXTRA_2 = your_fourth_api_key
   - GEMINI_API_KEY_EXTRA_3 = your_fifth_api_key
   - GEMINI_API_KEY_EXTRA_4 = your_sixth_api_key
   - GEMINI_API_KEY_EXTRA_5 = your_seventh_api_key
   ```

3. **Deploy**
   ```
   Click "Deploy" and wait 2-3 minutes
   ```

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add GEMINI_API_KEY_PRIMARY
   vercel env add GEMINI_API_KEY_SECONDARY
   vercel env add GEMINI_API_KEY_EXTRA_1
   # Add more as needed
   ```

### Step 3: Verify Deployment

1. **Test File Upload**
   - Upload a small CSV/Excel file with 5-10 prospects
   - Verify analysis completes successfully

2. **Test Error Handling**
   - Upload larger file (50+ prospects)
   - Verify processing continues even with rate limits
   - Check that batch processing completes

3. **Test Features**
   - ✅ Pitch regeneration works
   - ✅ Pitch expansion works
   - ✅ Export (Text/JSON) works
   - ✅ Mid-process export works

## Production Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY_PRIMARY` | Primary Gemini API key | `AIzaSy...` |

### Optional Variables (Recommended)

| Variable | Description | Fallback Behavior |
|----------|-------------|-------------------|
| `GEMINI_API_KEY_SECONDARY` | Secondary API key for failover | Uses PRIMARY only if not set |
| `GEMINI_API_KEY_EXTRA_1` | Third API key | Uses PRIMARY + SECONDARY |
| `GEMINI_API_KEY_EXTRA_2` | Fourth API key | Uses previous keys |
| `GEMINI_API_KEY_EXTRA_3` | Fifth API key | Uses previous keys |
| `GEMINI_API_KEY_EXTRA_4` | Sixth API key | Uses previous keys |
| `GEMINI_API_KEY_EXTRA_5` | Seventh API key | Uses previous keys |

### Backward Compatibility

The system also supports legacy environment variables:
- `GEMINI_API_KEY` (treated as PRIMARY if PRIMARY not set)
- `GEMINI_API_KEY_2` (treated as SECONDARY if SECONDARY not set)

## Error Handling System

### Production-Grade Features

1. **Multi-Key Rotation**
   - Automatic failover between API keys
   - Per-key failure tracking and cooldown
   - No single point of failure

2. **Exponential Backoff Retry**
   - 1s → 2s → 4s → 8s → 16s delays (max 60s)
   - Maximum 5 retry attempts per request
   - Jitter to prevent thundering herd

3. **Error Classification**
   - **RateLimitError**: API quota exceeded → Wait and retry
   - **AuthError**: Invalid API key → Switch to next key
   - **TransientAPIError**: Temporary failures → Retry with backoff
   - **FatalAPIError**: Non-retryable errors → Stop immediately

4. **Cooldown Management**
   - Failed keys enter 60s cooldown (auth errors: 5min)
   - Prevents cascading failures
   - Automatic recovery when cooldown expires

### Monitoring Logs

The application logs detailed telemetry for debugging:

```
[Gemini API] Analyzing 5 prospect(s)...
[Gemini API] Retry attempt 2/5 after 2.0s (key: primary, error: Rate limit exceeded)
[Gemini API] All keys on cooldown. Waiting 60s before retry (attempt 1/10)...
[Gemini API] ✓ Successfully generated insights for 5 prospect(s)
```

## Performance Optimization

### Batch Processing
- Files processed in batches of 5 prospects
- Initial batch: 15 prospects immediately
- Subsequent batches: 15 prospects every 60 seconds
- Unlimited file size support

### Vercel Limits
- **Function Timeout**: 60s (Hobby) / 900s (Pro)
- **Response Size**: 4.5MB max
- **Memory**: 1024MB default
- Streaming responses prevent timeout issues

### Recommended Settings

For large files (500+ prospects), consider Vercel Pro:
- Longer function timeout (15 min vs 60s)
- Higher concurrent function limit
- Priority support

## Troubleshooting

### Issue: Rate Limit Errors

**Symptoms**: "Rate limit exceeded" errors during processing

**Solution**:
1. Add more API keys (SECONDARY, EXTRA_1, EXTRA_2)
2. System will automatically rotate through keys
3. Processing continues after cooldown period

### Issue: Build Fails

**Symptoms**: Deployment fails during build

**Solution**:
```bash
# Check TypeScript errors locally
npm run build

# Fix any reported errors
# Re-deploy
vercel --prod
```

### Issue: Missing Environment Variables

**Symptoms**: "No Gemini API keys configured" error

**Solution**:
1. Go to Vercel dashboard → Settings → Environment Variables
2. Add `GEMINI_API_KEY_PRIMARY` with your API key
3. Redeploy: Deployments → Latest → Redeploy

### Issue: Processing Stops Mid-File

**Symptoms**: Large files stop processing after initial batch

**Solution**:
- Expected behavior: System waits 60s between batches
- Check logs for rate limit messages
- Add more API keys for faster processing
- System will complete all prospects eventually

## Security Best Practices

### API Key Management
1. ✅ Never commit API keys to Git
2. ✅ Use Vercel environment variables
3. ✅ Rotate keys regularly
4. ✅ Monitor usage in Google AI Studio
5. ✅ Set usage alerts in Google Cloud

### Production Checklist
- [ ] All API keys configured in Vercel
- [ ] Test deployment with sample file
- [ ] Verify error handling works
- [ ] Check logs for issues
- [ ] Enable error monitoring (Sentry/etc)
- [ ] Set up uptime monitoring

## Support & Maintenance

### Updating the Application

1. **Push to Git**
   ```bash
   git push origin main
   ```

2. **Auto-Deploy**
   - Vercel automatically deploys on push
   - Check deployment status in dashboard

3. **Manual Redeploy**
   ```bash
   vercel --prod
   ```

### Monitoring

1. **Vercel Analytics**
   - View in dashboard → Analytics
   - Track page views, errors, performance

2. **Function Logs**
   - View in dashboard → Functions → Logs
   - Search for errors or specific requests

3. **API Usage**
   - Monitor in Google AI Studio
   - Track quota usage per key

## Cost Estimation

### Vercel
- **Hobby Plan**: Free
  - 100GB bandwidth/month
  - 100 hours serverless function execution
  - Perfect for small-medium usage

- **Pro Plan**: $20/month
  - 1TB bandwidth/month
  - 1000 hours function execution
  - Recommended for heavy usage

### Google Gemini API
- **Free Tier**: 15 requests/minute per key
  - With 3 keys: ~45 requests/minute
  - ~2700 prospects/hour theoretical max
  - Sufficient for most use cases

- **Paid Tier**: Unlimited (pay-per-request)
  - ~$0.000125 per prospect (gemini-2.5-flash)
  - 1000 prospects ≈ $0.125
  - 10,000 prospects ≈ $1.25

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Project GitHub Repository](your-repo-url)

---

**Last Updated**: November 2025
**Version**: 5.2 (Production-Grade Error Handling)
