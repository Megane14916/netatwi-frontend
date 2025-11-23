/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // 環境変数 BACKEND_URL に本番のバックエンドURLを設定してください
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/api/:path*` 
          : 'http://127.0.0.1:5001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
