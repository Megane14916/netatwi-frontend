"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// 【修正】API_URLの定義を削除または空文字にします。
// Next.jsのRewrite機能を使うため、リクエスト先は相対パス ('/api/...') になります。
// これにより、ブラウザは「同じオリジン」への通信とみなし、Cookieが正常に扱われます。
const API_PREFIX = ''; 

interface User {
  id: number;
  screen_name: string;
  profile_image_url: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  judgeContests: number[]; // 審査員としてログイン中の大会IDリスト
  login: () => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>; // ユーザー情報を再取得する関数
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [judgeContests, setJudgeContests] = useState<number[]>([]);

  // ユーザー情報を(再)取得する関数
  const refetchUser = async () => {
    setLoading(true); // 再取得中はローディング表示
    try {
      // 【修正】相対パスを使用 ('/api/me')
      const res = await fetch(`${API_PREFIX}/api/me`, {
        // credentials: 'include' は不要になる場合もありますが、
        // Rewrite経由でもCookieを確実に送るため念のため残すか、ブラウザの挙動に任せます。
        // 同一オリジン扱いになるため、デフォルトでCookieが送られることが多いです。
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logged_in) {
          setUser(data.user);
          setJudgeContests(data.judge_contests || []); // 審査員情報を更新
        } else {
          setUser(null);
          setJudgeContests([]);
        }
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗:", error);
      setUser(null);
      setJudgeContests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初回読み込み時に実行
    refetchUser();
  }, []);

  const login = async () => {
    try {
      // 【修正】相対パスを使用 ('/api/login/twitter')
      // Next.jsがこれをバックエンドへ転送します
      const res = await fetch(`${API_PREFIX}/api/login/twitter`, {
        // Rewrite経由の場合は通常不要ですが、明示しても問題ありません
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authorization_url) {
          // Xの認証ページにリダイレクト
          // ※これは外部URLなのでそのまま
          window.location.href = data.authorization_url;
        }
      }
    } catch (error) {
      console.error("ログインプロセスを開始できませんでした:", error);
    }
  };

  const logout = async () => {
    // 【修正】相対パスを使用 ('/api/logout')
    await fetch(`${API_PREFIX}/api/logout`, {
    });
    setUser(null);
    setJudgeContests([]);
    // ログアウト後にトップページに遷移
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, judgeContests, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};