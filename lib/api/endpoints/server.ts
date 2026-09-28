import { mapContest, mapContestsResponse, mapProfile } from "@/lib/mappers/api";
import type { Contest, ContestsByStatus, UserProfile } from "@/types/domain";
import { serverRequest } from "../server";
import { validateContestDto, validateContestsResponse, validateProfileResponse } from "../validation";

export const getServerContests = async (): Promise<ContestsByStatus> =>
  mapContestsResponse(
    await serverRequest("/api/contests", {
      next: { revalidate: 60 },
      validate: validateContestsResponse,
    }),
  );

export const getServerContest = async (contestId: number): Promise<Contest> =>
  mapContest(
    await serverRequest(`/api/contests/${contestId}`, {
      cache: "no-store",
      validate: validateContestDto,
    }),
  );

export const getServerProfile = async (screenName: string): Promise<UserProfile> =>
  mapProfile(
    await serverRequest(`/api/profile/${encodeURIComponent(screenName)}`, {
      cache: "no-store",
      validate: validateProfileResponse,
    }),
  );
