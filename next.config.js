/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
    domains: [
      "ipfs.moralis.io",
      'images.unsplash.com',
      'swap.yourlifegames.com'
    ],
  },
   
};

module.exports = {
  ...nextConfig,
  compiler: { 
    styledComponents: true
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: {
        and: [/\.(js|ts)x?$/]
      },
      use: ['@svgr/webpack']
    })

    config.resolve.alias['@'] = path.join(__dirname, '/');

    return config;
  }
}
