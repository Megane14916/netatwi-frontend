'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Crown, Twitter, LogOut, User as UserIcon, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import logoImg from '../assets/logo.jpg';

export default function Header() {
  const { user, loading, login, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch('/api/notifications');
          if (res.ok) {
            const data = await res.json();
            const unread = data.filter((n: any) => !n.is_read).length;
            setUnreadCount(unread);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 text-black">
      
      {/* モバイル版 左側: 通知アイコン (ログイン時のみスペース確保) */}
      {(user || loading) && (
        <div className="flex md:hidden items-center basis-1/3 justify-start">
          {!loading && user && (
            <Link href="/notifications" className="relative p-2 text-black hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      )}

      {/* ロゴ: PC版は左寄せ、モバイル版はログイン時中央寄せ・未ログイン時左寄せ */}
      <div className={`flex items-center md:justify-start md:basis-auto ${(user || loading) ? 'justify-center basis-1/3' : 'justify-start flex-1'}`}>
        <Link href="/" className="flex items-center justify-center">
          <img src={logoImg.src} alt="ロゴ" className="h-10 w-10 object-cover rounded-md" />
          <span className="ml-2 font-semibold whitespace-nowrap">ネタツイグランプリ</span>
        </Link>
      </div>

      {/* 右側: ナビゲーション & ログイン/ユーザーメニュー */}
      <div className={`flex items-center justify-end md:basis-auto gap-4 sm:gap-6 ${(user || loading) ? 'basis-1/3' : ''}`}>
        {/* ナビゲーションリンク (中画面以上) */}
        <nav className="hidden md:flex gap-4 sm:gap-6 items-center">
          <Link href="/venue" className={`text-sm font-medium hover:text-gray-700 transition-colors ${pathname === '/venue' ? 'text-black underline underline-offset-4' : 'text-black'}`}>会場</Link>
          <Link href="/history" className={`text-sm font-medium hover:text-gray-700 transition-colors ${pathname === '/history' ? 'text-black underline underline-offset-4' : 'text-black'}`}>過去ログ</Link>
          <Link href="/users" className={`text-sm font-medium hover:text-gray-700 transition-colors ${pathname === '/users' ? 'text-black underline underline-offset-4' : 'text-black'}`}>ユーザー一覧</Link>
          <Link href="/rules" className={`text-sm font-medium hover:text-gray-700 transition-colors ${pathname === '/rules' ? 'text-black underline underline-offset-4' : 'text-black'}`}>ルール</Link>
        </nav>

        {/* ログイン状態に応じた表示 */}
        {loading ? (
          <div className="h-8 w-24 rounded-md bg-gray-200 animate-pulse"></div>
        ) : user ? (
          <> 
            {/* PC版 通知アイコンと「通知」テキスト */}
            <div className="hidden md:block">
              <Link href="/notifications" className="relative flex items-center p-2 text-black hover:text-gray-700 transition-colors">
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="ml-1 text-sm font-medium">通知</span>
              </Link>
            </div>

            {/* PC用ドロップダウン */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center text-sm font-medium text-black hover:text-gray-700 focus:outline-none"
              >
                <img
                    src={user.profile_image_url || `https://via.placeholder.com/24`}
                    alt={user.name}
                    className="h-6 w-6 rounded-full mr-2 border border-gray-300"
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/24')}
                 />
                {user.name}さん
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-100 rounded-md shadow-lg py-1 border border-gray-200 z-50">
                  <Link
                    href={`/profile/${encodeURIComponent(user.screen_name)}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-black w-full text-left"
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={async () => {
                        setIsDropdownOpen(false);
                        await logout();
                    }}
                    className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-200 hover:text-red-600 w-full text-left"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
            {/* モバイル用ドロップダウン */}
            <div className="md:hidden relative flex items-center h-full" ref={mobileDropdownRef}>
              <button className="flex items-center" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                   <img
                       src={user.profile_image_url || `https://via.placeholder.com/32`}
                       alt="メニュー"
                       className="h-8 w-8 rounded-full border border-gray-300"
                       onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32')}
                   />
              </button>
               {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-100 rounded-md shadow-lg py-1 border border-gray-200 z-50">
                  <Link href="/venue" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-black">会場</Link>
                  <Link href="/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-black">過去ログ</Link>
                  <Link href="/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-black">ユーザー一覧</Link>
                  <Link href="/rules" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-black">ルール</Link>
                  <Link href={`/profile/${encodeURIComponent(user.screen_name)}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-black">マイページ</Link>
                  <button onClick={async () => { setIsDropdownOpen(false); await logout(); }} className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-200 hover:text-red-600 w-full text-left">ログアウト</button>
                </div>
              )}
          </div>
          </>
        ) : (
          // 未ログイン時のログインボタン
          <button
            onClick={login}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white"
          >
            <Twitter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Xでログイン</span>
            <span className="sm:hidden">ログイン</span>
          </button>
        )}
      </div>
    </header>
  );
}