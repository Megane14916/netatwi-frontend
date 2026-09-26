"use client";

import { getLoginAuthorizationUrl, logout as logoutRequest } from "@/lib/api/endpoints/auth";

export function useAuthActions() {
  const login = async () => {
    try {
      window.location.href = await getLoginAuthorizationUrl();
    } catch (error) {
      console.error("ログインプロセスを開始できませんでした:", error);
    }
  };
  const logout = async () => {
    await logoutRequest();
    window.location.href = "/";
  };
  return { login, logout };
}
