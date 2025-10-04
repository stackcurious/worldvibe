import Script from 'next/script';

interface StructuredDataProps {
  type?: 'website' | 'organization' | 'webapp';
}

export function StructuredData({ type = 'website' }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worldvibe.com';

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WorldVibe',
    alternateName: 'WorldVibe - Global Emotional Check-In',
    url: baseUrl,
    description: 'Share your feelings anonymously and explore the world\'s emotional pulse in real-time.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WorldVibe',
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    description: 'Global emotional check-in platform for tracking the world\'s mood in real-time.',
    sameAs: [
      'https://twitter.com/worldvibe',
      'https://facebook.com/worldvibe',
      'https://instagram.com/worldvibe',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@worldvibe.com',
    },
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'WorldVibe',
    url: baseUrl,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250',
    },
    description: 'Anonymous emotional check-in platform with real-time global mood visualization.',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Check-In',
        item: `${baseUrl}/check-in`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Globe View',
        item: `${baseUrl}/globe`,
      },
    ],
  };

  const schemas = [websiteSchema, organizationSchema, breadcrumbSchema];

  if (type === 'webapp') {
    schemas.push(webAppSchema);
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}
