/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for early error detection.
  reactStrictMode: true,

  // Production-ready configuration
  experimental: {
    serverExternalPackages: ["pg", "redis"]
  },

  // Configure image optimization for modern formats.
  images: {
    domains: ["your-cdn.com", "avatars.githubusercontent.com"],
    formats: ["image/avif", "image/webp"],
  },

  // Set robust security headers.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(self), microphone=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; img-src 'self' data: https: https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://ipapi.co wss://* https://*.supabase.com https://unpkg.com https://www.google-analytics.com https://*.vercel-insights.com; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },

  // Remove console statements in production.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Optimize output for serverless deployment.
  output: "standalone",

  // Customize webpack to avoid bundling Node-specific modules in client code.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        http: false,
        https: false,
        cluster: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;


