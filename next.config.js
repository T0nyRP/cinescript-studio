/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // next.js hydration + Vercel live feedback toolbar
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live",
              // Google Fonts stylesheet + inline next.js styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // next/font/google self-hosts at /_next/static/media/  +  data: URIs
              "font-src 'self' data: https://fonts.gstatic.com",
              // generated images / Galaxy AI CDN / Supabase storage
              "img-src 'self' blob: data: https: http:",
              // video / audio blobs + Galaxy AI CDN
              "media-src 'self' blob: data: https: http:",
              // API calls: Galaxy AI, Supabase, Vercel live socket
              "connect-src 'self' https: wss:",
              // Vercel live feedback iframe
              "frame-src 'self' https://vercel.live https://*.vercel.live",
              "object-src 'none'",
              // required for Vercel live toolbar worker
              "worker-src 'self' blob: https://vercel.live",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
