/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'ggpht.com' },
      { protocol: 'https', hostname: 'chromewebstore.google.com' }
    ]
  }
};

export default nextConfig;
