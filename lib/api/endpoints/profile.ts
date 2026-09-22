import { mapProfile } from "@/lib/mappers/api";
import type { UserProfile } from "@/types/domain";
import { browserRequest } from "../browser";
import { validateProfileResponse } from "../validation";

export const getProfile = async (screenName: string): Promise<UserProfile> =>
  mapProfile(
    await browserRequest(`/api/profile/${encodeURIComponent(screenName)}`, {
      cache: "no-store",
      validate: validateProfileResponse,
    }),
  );

export const withdrawCurrentUser = (): Promise<unknown> =>
  browserRequest("/api/users/me", { method: "DELETE" });
