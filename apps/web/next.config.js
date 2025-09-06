/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const experimentalConfig = {
  // keep minimal experimental flags for stability in dev/test
  optimizePackageImports: [
    '@tensorflow/tfjs',
    '@mediapipe/pose',
    'three',
    'lodash',
    '@material-ui/core',
    '@material-ui/icons'
  ],
  // modularizeImports not supported in this Next version when using Babel; remove for stability
  // http2 not required in dev
};

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@velox/obs'],
  
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable module/chunk optimization
  experimental: experimentalConfig,

  // Configure webpack for optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable scope hoisting
      config.optimization.concatenateModules = true;

      // CSS minimization is handled by Next/SWC; no extra plugin needed

      // Tree shake moment.js locales
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );

      // Compress images
      config.module.rules.push({
        test: /\.(png|jpg|jpeg|gif|webp)$/i,
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: true,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75,
              },
            },
          },
        ],
      });
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // experimental config already includes http2

  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 