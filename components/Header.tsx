'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Twitter, ChevronDown, Bell, Loader2, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import logoImg from '../assets/logo.png';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/useUnreadNotificationCount';
import { useAuthActions } from '@/features/auth/hooks/useAuthActions';
import { useHeaderMenu } from '@/features/shell/hooks/useHeaderMenu';
import { useThemeToggle } from '@/features/shell/hooks/useThemeToggle';
import { HEADER_NAVIGATION } from '@/features/shell/model/navigation';

export default function Header() {
  const { user, loading } = useAuth();
  const { login, logout } = useAuthActions();
  const pathname = usePathname();
  const {
    isOpen: isDropdownOpen,
    setIsOpen: setIsDropdownOpen,
    desktopRef: dropdownRef,
    mobileRef: mobileDropdownRef,
    handleNewsClick,
  } = useHeaderMenu(pathname);
  const { isDark, toggleTheme } = useThemeToggle();
  const unreadCount = useUnreadNotificationCount(Boolean(user));
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
  };


  return (
    <header className="px-4 lg:px-6 h-12 md:h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60 text-black dark:text-white transition-colors duration-300">
      
      {/* モバイル版 左側: 通知アイコン (ログイン時のみスペース確保) */}
      {user && (
        <div className="flex md:hidden items-center basis-1/3 justify-start">
          <Link href="/notifications" className="relative p-1 md:p-2 text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 md:top-1 md:right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 text-white text-[8px] md:text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* ロゴ: PC版は左寄せ、モバイル版はログイン時中央寄せ・未ログイン時左寄せ */}
      <div className={`flex items-center md:justify-start md:basis-auto ${user ? 'justify-center basis-1/3' : 'justify-start flex-1'}`}>
        <Link href="/" className="flex items-center justify-center">
          <img src={logoImg.src} alt="ロゴ" className="h-8 w-8 md:h-10 md:w-10 object-cover rounded-md" />
          <span className="ml-2 font-semibold whitespace-nowrap text-sm md:text-base">ネタツイグランプリ</span>
        </Link>
      </div>

      {/* 右側: ナビゲーション & ログイン/ユーザーメニュー */}
      <div className={`flex items-center justify-end md:basis-auto gap-4 sm:gap-6 ${user ? 'basis-1/3' : ''}`}>
        {/* ナビゲーションリンク (中画面以上) */}
        <nav className="hidden md:flex gap-4 sm:gap-6 items-center">
          {HEADER_NAVIGATION.map((item) => (
            <Link key={item.href} href={item.href} className={`text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${pathname === item.href ? 'text-black dark:text-white underline underline-offset-4' : 'text-black dark:text-white'}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/#news" onClick={handleNewsClick} className="text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-black dark:text-white">ニュース</Link>
        </nav>

        {/* ログイン状態に応じた表示 */}
        {loading ? (
          <div className="h-6 w-16 md:h-8 md:w-24 rounded-md bg-gray-200 animate-pulse"></div>
        ) : user ? (
          <> 
            {/* PC版 通知アイコンと「通知」テキスト */}
            <div className="hidden md:block">
              <Link href="/notifications" className="relative flex items-center p-2 text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
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
                className="flex items-center text-sm font-medium text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors"
              >
                <img
                    src={user.profileImageUrl || `https://via.placeholder.com/24`}
                    alt={user.name}
                    className="h-6 w-6 rounded-full mr-2 border border-gray-300"
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/24')}
                 />
                {user.name}さん
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                  <Link
                    href={`/profile/${encodeURIComponent(user.screenName)}`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white w-full text-left transition-colors"
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white w-full text-left transition-colors"
                  >
                    <span>{isDark ? 'ライトモード' : 'ダークモード'}</span>
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
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
                       src={user.profileImageUrl || `https://via.placeholder.com/32`}
                       alt="メニュー"
                       className="h-6 w-6 md:h-8 md:w-8 rounded-full border border-gray-300"
                       onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32')}
                   />
              </button>
               {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                  {HEADER_NAVIGATION.map((item) => (
                    <Link key={item.href} href={item.href} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-colors">{item.label}</Link>
                  ))}
                  <Link href="/#news" onClick={handleNewsClick} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-colors">ニュース</Link>
                  <Link href={`/profile/${encodeURIComponent(user.screenName)}`} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white transition-colors">マイページ</Link>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white w-full text-left transition-colors"
                  >
                    <span>{isDark ? 'ライトモード' : 'ダークモード'}</span>
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button onClick={async () => { setIsDropdownOpen(false); await logout(); }} className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 w-full text-left transition-colors">ログアウト</button>
                </div>
              )}
          </div>
          </>
        ) : (
          // 未ログイン時のログインボタン
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs md:text-sm font-medium h-8 md:h-10 px-3 md:px-4 py-1.5 md:py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white disabled:opacity-70"
          >
            {isLoggingIn ? (
              <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
            ) : (
              <Twitter className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            )}
            <span className="hidden sm:inline">Xでログイン</span>
            <span className="sm:hidden">ログイン</span>
          </button>
        )}
      </div>
    </header>
  );
}
