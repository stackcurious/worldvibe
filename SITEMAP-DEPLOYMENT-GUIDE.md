# Sitemap Deployment Fix

## Problem
Google Search Console shows "Couldn't fetch" for `https://worldvibe.app/sitemap.xml`

## Root Cause
The sitemap code exists but hasn't been deployed to Vercel yet, or the environment variables need updating.

## Solution

### Step 1: Update Vercel Environment Variables

Go to your Vercel project settings:
1. Visit: https://vercel.com/dashboard
2. Select your WorldVibe project
3. Go to **Settings** → **Environment Variables**
4. Add/update these variables for **Production**:

```
NEXT_PUBLIC_SITE_URL=https://www.worldvibe.app
NEXT_PUBLIC_APP_URL=https://www.worldvibe.app
```

5. Click **Save**

### Step 2: Redeploy to Production

**Option A: Push to GitHub** (Recommended)
```bash
git add .
git commit -m "Add sitemap and SEO configuration"
git push origin main
```

Vercel will automatically deploy.

**Option B: Manual Redeploy in Vercel**
1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" (faster)
5. Click "Redeploy"

### Step 3: Verify Sitemap Works

After deployment completes (2-3 minutes):

```bash
curl https://www.worldvibe.app/sitemap.xml
```

You should see XML output like:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.worldvibe.app</loc>
    <lastmod>2025-10-04</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ...
</urlset>
```

### Step 4: Resubmit to Google Search Console

1. Go to: https://search.google.com/search-console
2. Select your property
3. Navigate to **Sitemaps** in left sidebar
4. Remove old sitemap (if exists)
5. Add new sitemap: `https://www.worldvibe.app/sitemap.xml`
6. Click **Submit**

Google will crawl it within a few hours and status will change from "Couldn't fetch" to "Success".

## Alternative: Check Both URLs

Google may have cached the wrong URL. Try both:
- ✅ `https://www.worldvibe.app/sitemap.xml` (with www)
- `https://worldvibe.app/sitemap.xml` (without www)

Submit whichever one works.

## Vercel Configuration

Ensure your `vercel.json` (if exists) doesn't block the sitemap:

```json
{
  "headers": [
    {
      "source": "/sitemap.xml",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/xml"
        }
      ]
    }
  ]
}
```

## Testing Checklist

After redeployment:

- [ ] Visit `https://www.worldvibe.app/sitemap.xml` - Should return XML
- [ ] Visit `https://www.worldvibe.app/robots.txt` - Should return robots.txt
- [ ] Check page source for meta tags (view source on homepage)
- [ ] Verify structured data at: https://search.google.com/test/rich-results
- [ ] Test social preview at: https://www.opengraph.xyz/

## Common Issues

### Issue: "robots.txt file is blocking Google"
**Solution**: Check `/robots.txt` doesn't block `/sitemap.xml`

Our robots.txt already allows it:
```
User-agent: *
Allow: /
Sitemap: https://www.worldvibe.app/sitemap.xml
```

### Issue: "Wrong sitemap URL in Google"
**Solution**:
- Remove old sitemap in Search Console
- Wait 24 hours
- Resubmit with correct URL

### Issue: "Sitemap shows 0 pages"
**Solution**: Rebuild and redeploy. The sitemap is dynamically generated at build time.

## Timeline

- **Deploy**: 2-3 minutes
- **Google crawls sitemap**: 2-24 hours
- **Pages indexed**: 1-7 days
- **Appear in search**: 1-4 weeks

## Expected Result

After successful deployment and crawl:

```
Sitemap: https://www.worldvibe.app/sitemap.xml
Type: Web
Submitted: Oct 4, 2025
Last read: Oct 4, 2025
Status: Success
Discovered pages: 6
```

## Need Help?

If issues persist:
1. Check Vercel deployment logs for errors
2. Verify environment variables are set
3. Clear Vercel cache and redeploy
4. Contact Vercel support if needed

---

**Next**: Once sitemap is verified, update `/SEO-SETUP-COMPLETE.md` checklist!
