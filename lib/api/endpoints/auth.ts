import { mapUser } from "@/lib/mappers/api";
import type { User } from "@/types/domain";
import { browserRequest } from "../browser";
import { asRecord, validateCurrentUserResponse } from "../validation";

export interface AuthSession {
  user: User | null;
  judgeContests: number[];
}

export const getAuthSession = async (): Promise<AuthSession> => {
  const response = await browserRequest("/api/me", {
    validate: validateCurrentUserResponse,
  });
  return {
    user: response.logged_in && response.user ? mapUser(response.user) : null,
    judgeContests: response.judge_contests ?? [],
  };
};

export const getLoginAuthorizationUrl = async (): Promise<string> => {
  const response = await browserRequest<unknown>("/api/login/twitter");
  const record = asRecord(response, "login response");
  if (typeof record.authorization_url !== "string") {
    throw new Error("authorization_url must be a string");
  }
  return record.authorization_url;
};

export const logout = (): Promise<void> => browserRequest<void>("/api/logout");
