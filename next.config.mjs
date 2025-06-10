/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker
    output: 'standalone',

    // Image optimization
    images: {
        domains: [
            'localhost',
            'lh3.googleusercontent.com', // Google profile images
            'avatars.githubusercontent.com', // GitHub profile images
            'media.licdn.com', // LinkedIn profile images
        ],
        unoptimized: process.env.NODE_ENV === 'development',
    },
    
    // Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ];
    },

    // Environment variables
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },

    // Webpack configuration
    webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
        // Custom webpack config if needed
        return config;
    },
};

export default nextConfig;