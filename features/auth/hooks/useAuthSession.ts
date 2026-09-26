"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthSession } from "@/lib/api/endpoints/auth";
import type { User } from "@/types/domain";

export interface AuthSessionState {
  user: User | null;
  loading: boolean;
  judgeContests: number[];
  refetchUser: () => Promise<void>;
}

export function useAuthSession(): AuthSessionState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [judgeContests, setJudgeContests] = useState<number[]>([]);

  const refetchUser = useCallback(async () => {
    setLoading(true);

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
  }, []);

  useEffect(() => {
    void refetchUser();
  }, [refetchUser]);

  return { user, loading, judgeContests, refetchUser };
}
