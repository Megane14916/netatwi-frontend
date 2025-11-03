/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // /api/ で始まるすべてのリクエストを...
        source: '/api/:path*',
        // ...バックエンドサーバー(http://127.0.0.1:5001)に転送する
        destination: 'http://127.0.0.1:5001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
