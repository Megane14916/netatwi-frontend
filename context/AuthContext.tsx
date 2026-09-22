"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User } from '@/types/domain';
import { getAuthSession, getLoginAuthorizationUrl, logout as logoutRequest } from '@/lib/api/endpoints/auth';

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
      const session = await getAuthSession();
      setUser(session.user);
      setJudgeContests(session.judgeContests);
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
      window.location.href = await getLoginAuthorizationUrl();
    } catch (error) {
      console.error("ログインプロセスを開始できませんでした:", error);
    }
  };

  const logout = async () => {
    await logoutRequest();
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
