'use client'; // This component uses hooks, so it must be a Client Component

import { Book, Crown, History, User, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// メニュー項目の型定義
type MenuItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  requiresAuth?: boolean;
};

// ホーム画面コンポーネント
export default function HomePage() {
  const { user, loading, login } = useAuth(); // login関数も取得

  // メニュー項目のデータ
  const allMenuItems: MenuItem[] = [
    { icon: Book, title: "ルール", description: "大会の基本ルールと注意事項を確認", href: "/rules" },
    { icon: Crown, title: "会場", description: "開催中の大会に参加・投票する", href: "/venue" },
    { icon: History, title: "過去ログ", description: "過去に開催された大会の結果を見る", href: "/history" },
    { icon: User, title: "マイページ", description: "プロフィールや投稿履歴の確認", href: user ? `/profile/${encodeURIComponent(user.screen_name)}` : '#', requiresAuth: true },
  ];

  // 未ログイン時の「マイページ」ボタンのクリック処理
  const handleMyPageClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '#') {
      e.preventDefault();
      // ログイン処理を実行 (ヘッダーのボタンと同じ動作)
      login();
    }
  };


  return (
    // flex-1 を追加して、layout.tsxのflex-grow内で高さいっぱいに広がるようにする
    // justify-center を追加して垂直中央寄せ
    <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-6">
      <div className="container max-w-3xl w-full">
        <div className="flex flex-col items-center space-y-3 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            最強のツイートを決めろ
          </h1>
          <p className="mx-auto max-w-[600px] text-gray-400 md:text-lg">
            お題に沿って面白いツイートを投稿し、頂点を目指すオンラインコンテスト。
          </p>
        </div>
        {/* 常に grid-cols-1 を基本とし、中画面以上(md)で2列にする */}
        <div className={`mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md sm:max-w-lg md:max-w-2xl`}>
          {allMenuItems.map((item) => {
            // ログインが必要な項目で、かつユーザーがログインしていない場合
            if (item.requiresAuth && !user) {
              return (
                <button
                  key="login-button"
                  onClick={login}
                  disabled={loading}
                  className={`group flex flex-col justify-start rounded-lg border border-gray-800 p-5 transition-all hover:bg-gray-800/50 hover:shadow-lg h-full text-left ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center mb-2">
                    <LogIn className="h-5 w-5 mr-2 text-yellow-400" />
                    <h3 className="text-lg font-bold">ログイン</h3>
                  </div>
                  <p className="text-gray-400 text-sm flex-grow">ログインして参加・マイページへ</p>
                </button>
              );
            }

            // 通常のメニュー項目
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex flex-col justify-start rounded-lg border border-gray-800 p-5 transition-all hover:bg-gray-800/50 hover:shadow-lg h-full ${
                  loading && item.requiresAuth ? 'opacity-50 pointer-events-none' : ''
                }`}
                onClick={(e) => handleMyPageClick(e, item.href)} // Linkにもクリック処理を追加
              >
                <div className="flex items-center mb-2">
                  <item.icon className="h-5 w-5 mr-2 text-yellow-400" />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-gray-400 text-sm flex-grow">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

