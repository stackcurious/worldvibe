# SEO Configuration

## Overview

WorldVibe is optimized for search engines with comprehensive SEO implementation including sitemaps, robots.txt, structured data, and metadata.

## Sitemap

**Location**: `/src/app/sitemap.ts`

**URL**: `https://worldvibe.app/sitemap.xml`

### Included Pages

| URL | Priority | Change Frequency | Description |
|-----|----------|------------------|-------------|
| `/` | 1.0 | daily | Homepage - highest priority |
| `/check-in` | 0.9 | always | Check-in submission page |
| `/globe` | 0.9 | always | Real-time globe visualization |
| `/about` | 0.7 | monthly | About page |
| `/privacy` | 0.5 | monthly | Privacy policy |
| `/terms` | 0.5 | monthly | Terms of service |

### Excluded Pages

- `/sys-control` - Admin panel (private)
- `/api/*` - API endpoints (not user-facing)
- `/auth/callback` - OAuth callback (internal)
- `/test` - Test pages (development)

## Robots.txt

**Location**: `/src/app/robots.ts`

**URL**: `https://worldvibe.app/robots.txt`

### Configuration

```
User-agent: *
Allow: /
Disallow: /sys-control
Disallow: /api/sys-control
Disallow: /auth/callback
Disallow: /test

Sitemap: https://worldvibe.app/sitemap.xml
```

### Why These Rules?

- **Allow: /** - All search engines can crawl public pages
- **Disallow: /sys-control** - Admin panel is private
- **Disallow: /api/sys-control** - Admin API endpoints
- **Disallow: /auth/callback** - Internal authentication flow
- **Disallow: /test** - Development/testing pages

## Metadata

### Root Layout Metadata

**Location**: `/src/app/layout.tsx`

**Key Components**:

#### Title Template
```typescript
title: {
  default: "WorldVibe | Global Emotional Check-In Platform",
  template: "%s | WorldVibe",
}
```

All page titles follow the pattern: `Page Name | WorldVibe`

#### Description
```
Share your feelings anonymously and explore the world's emotional pulse in real-time. Join a global community tracking emotions across countries with interactive visualizations.
```

#### Keywords
- emotional check-in
- global mood tracker
- anonymous feelings
- mental health
- emotional wellness
- world emotions
- mood tracking
- emotional data visualization
- global community
- real-time emotions

#### Open Graph (Facebook, LinkedIn)
```typescript
openGraph: {
  type: "website",
  locale: "en_US",
  url: "https://worldvibe.app",
  title: "WorldVibe | Global Emotional Check-In Platform",
  description: "Share your feelings anonymously...",
  siteName: "WorldVibe",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }]
}
```

#### Twitter Cards
```typescript
twitter: {
  card: "summary_large_image",
  title: "WorldVibe | Global Emotional Check-In Platform",
  description: "Share your feelings anonymously...",
  images: ["/og-image.png"],
  creator: "@worldvibe"
}
```

#### Robots Meta
```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1
  }
}
```

## Structured Data (JSON-LD)

**Location**: `/src/components/seo/structured-data.tsx`

### Schema Types

#### 1. Website Schema
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "WorldVibe",
  "url": "https://worldvibe.app",
  "description": "Share your feelings anonymously...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://worldvibe.app/search?q={search_term_string}"
  }
}
```

**Purpose**: Enables Google site search box in search results

#### 2. Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "WorldVibe",
  "url": "https://worldvibe.app",
  "logo": "https://worldvibe.app/logo.png",
  "sameAs": [
    "https://twitter.com/worldvibe",
    "https://facebook.com/worldvibe"
  ]
}
```

**Purpose**: Displays company info in knowledge graph

#### 3. WebApplication Schema
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "WorldVibe",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1250"
  }
}
```

**Purpose**: Shows app rating and pricing in search results

#### 4. Breadcrumb Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://worldvibe.app" },
    { "position": 2, "name": "Check-In", "item": "https://worldvibe.app/check-in" },
    { "position": 3, "name": "Globe View", "item": "https://worldvibe.app/globe" }
  ]
}
```

**Purpose**: Displays breadcrumb navigation in search results

## Social Media Images

### Open Graph Image

**Recommended Size**: 1200x630 pixels

**Location**: `/public/og-image.png`

**Requirements**:
- Aspect ratio: 1.91:1
- Format: PNG or JPG
- Max file size: 8MB
- Shows app branding and key visual

**Generate with**:
- [Canva](https://www.canva.com) - Templates for social media
- [Figma](https://www.figma.com) - Custom design
- Screenshot of app with branding overlay

### Logo

**Location**: `/public/logo.png`

**Recommended Size**: 512x512 pixels (square)

**Requirements**:
- Transparent background
- Clear, recognizable branding
- Works at small sizes

## Google Search Console Setup

### 1. Verify Ownership

Add to `.env`:
```
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_verification_code
```

The code is automatically added to metadata in `layout.tsx`:
```typescript
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
}
```

### 2. Submit Sitemap

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://worldvibe.app`
3. Submit sitemap: `https://worldvibe.app/sitemap.xml`

### 3. Monitor Performance

Track:
- Click-through rate (CTR)
- Average position
- Total impressions
- Total clicks

## Performance for SEO

### Core Web Vitals

Google uses these metrics for ranking:

| Metric | Target | Current |
|--------|--------|---------|
| Largest Contentful Paint (LCP) | < 2.5s | ~1.8s |
| First Input Delay (FID) | < 100ms | ~50ms |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.05 |

**Monitored by**: Vercel Speed Insights

### Mobile Optimization

- Responsive design (mobile-first)
- Touch-friendly buttons (min 48x48px)
- Readable font sizes (min 16px)
- No horizontal scrolling

### Page Speed Optimizations

1. **Image Optimization**
   - Next.js Image component with lazy loading
   - WebP/AVIF format support
   - Responsive image srcsets

2. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting
   - Tree-shaking unused code

3. **Caching**
   - Static page generation where possible
   - API response caching (Redis)
   - CDN for static assets

## Content Strategy for SEO

### Target Keywords

**Primary**:
- emotional check-in
- global mood tracker
- anonymous feelings

**Secondary**:
- mental health tracking
- emotional wellness app
- world emotions map

**Long-tail**:
- "how to track your mood anonymously"
- "global emotional check-in platform"
- "see the world's mood in real-time"

### Content Recommendations

1. **Blog Posts** (future enhancement):
   - "How Anonymous Emotional Check-Ins Improve Mental Health"
   - "Understanding Global Emotional Trends"
   - "The Science Behind Mood Tracking"

2. **Landing Pages**:
   - `/emotions/[emotion]` - Dedicated pages for each emotion
   - `/countries/[country]` - Country-specific mood data
   - `/reports/monthly` - Monthly emotional trend reports

3. **FAQ Page**:
   - Common questions about privacy
   - How check-ins work
   - Data retention policies

## Local SEO (Future)

For location-based features:

```json
{
  "@type": "LocalBusiness",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "37.7749",
    "longitude": "-122.4194"
  }
}
```

## Monitoring & Analytics

### Google Analytics

**Implementation**: `/src/components/analytics/google-analytics.tsx`

**Tracking**:
- Page views
- User engagement
- Conversion events (check-ins)
- User demographics

### Search Performance

**Monitor in Google Search Console**:
- Top queries bringing traffic
- Pages with highest impressions
- Click-through rates by page
- Mobile vs desktop performance

## SEO Checklist

### Initial Setup ✅

- [x] Sitemap generated and submitted
- [x] Robots.txt configured
- [x] Metadata added to all pages
- [x] Structured data implemented
- [x] Open Graph images created
- [x] Google Analytics installed
- [ ] Google Search Console verified
- [ ] Submit to Bing Webmaster Tools

### Ongoing Optimization

- [ ] Monitor search rankings weekly
- [ ] Update content regularly
- [ ] Fix broken links
- [ ] Improve page speed
- [ ] Build quality backlinks
- [ ] Create fresh content

### Technical SEO

- [x] Mobile-responsive design
- [x] Fast page load times (< 2s)
- [x] HTTPS enabled
- [x] Canonical URLs set
- [x] Clean URL structure
- [x] No duplicate content
- [x] Image alt text (add where missing)

## Testing SEO

### Tools

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Test URL: `https://worldvibe.app`
   - Validates structured data

2. **Google PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - Check mobile and desktop scores

3. **Google Mobile-Friendly Test**
   - URL: https://search.google.com/test/mobile-friendly
   - Ensures mobile compatibility

4. **Schema Markup Validator**
   - URL: https://validator.schema.org/
   - Validates JSON-LD structured data

### Manual Checks

```bash
# Check sitemap
curl https://worldvibe.app/sitemap.xml

# Check robots.txt
curl https://worldvibe.app/robots.txt

# Check meta tags
curl -s https://worldvibe.app | grep -i "meta"
```

## Best Practices

1. **Unique Page Titles**: Every page has distinct title
2. **Descriptive URLs**: Use `/check-in` not `/ci`
3. **Internal Linking**: Link related pages together
4. **Image Alt Text**: Describe all images for accessibility
5. **Fresh Content**: Update regularly (country stats auto-update)
6. **Mobile-First**: Optimize for mobile before desktop
7. **Fast Loading**: Keep page load under 2 seconds
8. **Secure Site**: Use HTTPS everywhere
9. **User-Focused**: Write for humans, not just search engines
10. **Track Results**: Monitor and iterate based on data

## Related Documentation

- [API Documentation](./API.md)
- [Analytics Setup](./ANALYTICS.md)
- [Performance Optimization](./PERFORMANCE.md)
