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
            // Allow self-hosted fonts (/_next/static/media/*) from next/font,
            // data: URIs, and Google Fonts CDN as a safety net.
            // This overrides any default Vercel security header for CSP.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' blob: data: https: http:",
              "media-src 'self' blob: data: https: http:",
              "connect-src 'self' https: wss:",
              "frame-src 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
