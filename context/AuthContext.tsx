"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Next.jsのプロキシを経由するため、URLを空の文字列（相対パス）に変更
const API_URL = '';

interface User {
  id: number;
  screen_name: string;
  profile_image_url: string;
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  judgeContests: number[];
  login: () => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [judgeContests, setJudgeContests] = useState<number[]>([]);

  const refetchUser = async () => {
    setLoading(true); // 再取得中はローディング表示
    try {
      const res = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
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
      console.error("ユーザー情報の再取得に失敗:", error);
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
      const res = await fetch(`${API_URL}/api/login/twitter`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      }
    } catch (error) {
      console.error("ログインプロセスを開始できませんでした:", error);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, { credentials: 'include' });
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("ログアウトに失敗しました:", error);
    }
  };

  return (
    // Contextのvalueに judgeContests と refetchUser を追加
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

