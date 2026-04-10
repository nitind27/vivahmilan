/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'staticmap.openstreetmap.de' },
    ],
    // Allow local uploaded images
    localPatterns: [{ pathname: '/uploads/**' }],
  },
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
