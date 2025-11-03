"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Vercelの環境変数 NEXT_PUBLIC_API_URL を読み込む
// ローカル開発時は http://localhost:5001 をフォールバックとして使用
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
      const res = await fetch(`${API_URL}/api/me`, {
        credentials: 'include', // セッションクッキーをリクエストに含める
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
      // ログインリクエストをバックエンド(Render)に送る
      const res = await fetch(`${API_URL}/api/login/twitter`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authorization_url) {
          // Xの認証ページにリダイレクト
          window.location.href = data.authorization_url;
        }
      }
    } catch (error) {
      console.error("ログインプロセスを開始できませんでした:", error);
    }
  };

  const logout = async () => {
    await fetch(`${API_URL}/api/logout`, {
      credentials: 'include',
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
