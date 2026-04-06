/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com', // X(Twitter)のプロフィール画像
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com', // Xのデフォルト画像
      },
      {
        protocol: 'https',
        hostname: 'pub-70c516fa8306469f97a4539d0ed665d8.r2.dev', // R2公開URL（本番）
      },
    ],
  },
  // APIリクエストをバックエンドに転送する設定 (BFFパターン)
  async rewrites() {
    // 環境変数からバックエンドのURLを取得
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
