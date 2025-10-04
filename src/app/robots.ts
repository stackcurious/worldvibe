import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worldvibe.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/sys-control',
          '/api/sys-control',
          '/auth/callback',
          '/test',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
