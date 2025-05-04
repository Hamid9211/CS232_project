/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ui-avatars.com'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use: 'raw-loader',
      });

      config.externals.push(
        'mongoose',
        'kerberos',
        '@mongodb-js/zstd',
        '@aws-sdk/credential-providers',
        'snappy',
        'socks',
        'aws4',
        'mongodb-client-encryption',
        'encoding'
      );
    }
    return config;
  },
};

module.exports = nextConfig;
