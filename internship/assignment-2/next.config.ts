import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/api/scrape',
        headers: [
          { 
            key: 'User-Agent',
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
          },
          {
            key: 'Referer',
            value: 'https://www.google.com'
          }
        ],
      },
    ];
  },
};

export default nextConfig;