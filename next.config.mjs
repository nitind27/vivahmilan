/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses at Next.js level too
  compress: true,

  // Aggressive static asset caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|gif|svg|ico|woff2|woff)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'staticmap.openstreetmap.de' },
      { protocol: 'https', hostname: 'vivahmilan.codeatinfotech.com' },
    ],
    localPatterns: [{ pathname: '/uploads/**' }],
    unoptimized: true,
  },
   // ✅ THIS IS THE MAIN FIX
  allowedDevOrigins: [
    'http://vivahmilan.codeatinfotech.com',
    'https://vivahmilan.codeatinfotech.com',
  ],

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '192.168.29.125:3000',
        'vivahmilan.codeatinfotech.com',
      ],
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
