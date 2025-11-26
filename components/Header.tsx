'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Crown, Twitter, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { user, loading, login, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 追加: ページ遷移が発生したらメニューを確実に閉じる
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  // ドロップダウンの外側をクリックしたら閉じる処理
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // ボタン自体がクリックされた場合は何もしない（トグル処理に任せる）
      const pcButton = dropdownRef.current?.previousElementSibling;
      const mobileButton = mobileDropdownRef.current?.previousElementSibling;

      const isClickOnButton = 
        (pcButton && pcButton.contains(target)) || 
        (mobileButton && mobileButton.contains(target));

      if (isClickOnButton) {
        return;
      }
      
      // PCメニューまたはモバイルメニューの内側をクリックしたかどうかの判定
      const isClickInsidePC = dropdownRef.current?.contains(target);
      const isClickInsideMobile = mobileDropdownRef.current?.contains(target);

      // どちらか一方でも内側なら閉じない（ここが修正ポイント）
      if (isClickInsidePC || isClickInsideMobile) {
        return;
      }

      // どちらの外側でもある場合のみ閉じる
      setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, mobileDropdownRef]);


  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b border-gray-800 sticky top-0 z-50 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
      {/* 左側: ロゴ */}
      <Link href="/" className="flex items-center justify-center">
        <Crown className="h-6 w-6 text-yellow-400" />
        <span className="ml-2 font-semibold">ネタツイグランプリ</span>
      </Link>

      {/* 右側: ナビゲーション & ログイン/ユーザーメニュー */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* ナビゲーションリンク (中画面以上) */}
        <nav className="hidden md:flex gap-4 sm:gap-6 items-center">
          <Link href="/venue" className={`text-sm font-medium hover:text-gray-50 transition-colors ${pathname === '/venue' ? 'text-white underline underline-offset-4' : 'text-gray-400'}`}>会場</Link>
          <Link href="/history" className={`text-sm font-medium hover:text-gray-50 transition-colors ${pathname === '/history' ? 'text-white underline underline-offset-4' : 'text-gray-400'}`}>過去ログ</Link>
          <Link href="/rules" className={`text-sm font-medium hover:text-gray-50 transition-colors ${pathname === '/rules' ? 'text-white underline underline-offset-4' : 'text-gray-400'}`}>ルール</Link>
        </nav>

        {/* ログイン状態に応じた表示 */}
        {loading ? (
          <div className="h-8 w-24 rounded-md bg-gray-700 animate-pulse"></div>
        ) : user ? (
          <> {/* PC用ドロップダウン */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-400 hover:text-gray-50 focus:outline-none"
              >
                <img
                    src={user.profile_image_url || `https://via.placeholder.com/24`}
                    alt={user.screen_name}
                    className="h-6 w-6 rounded-full mr-2 border border-gray-600"
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/24')}
                 />
                {user.screen_name}さん
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 z-50">
                  <Link
                    href={`/profile/${encodeURIComponent(user.screen_name)}`}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={async () => {
                        setIsDropdownOpen(false);
                        await logout();
                    }}
                    className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 w-full text-left"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
            {/* モバイル用ドロップダウン */}
            <div className="md:hidden relative" ref={mobileDropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                   <img
                       src={user.profile_image_url || `https://via.placeholder.com/32`}
                       alt="メニュー"
                       className="h-8 w-8 rounded-full border border-gray-600"
                       onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32')}
                   />
              </button>
               {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 z-50">
                  <Link href="/venue" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">会場</Link>
                  <Link href="/history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">過去ログ</Link>
                  <Link href="/rules" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">ルール</Link>
                  <Link href={`/profile/${encodeURIComponent(user.screen_name)}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">マイページ</Link>
                  <button onClick={async () => { setIsDropdownOpen(false); await logout(); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 w-full text-left">ログアウト</button>
                </div>
              )}
          </div>
          </>
        ) : (
          // 未ログイン時のログインボタン
          <button
            onClick={login}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Xでログイン
          </button>
        )}
      </div>
    </header>
  );
}