import {
  mapContest,
  mapContestPosts,
  mapContestResults,
  mapContestsResponse,
} from "@/lib/mappers/api";
import type { Contest, ContestPosts, ContestResults, ContestsByStatus } from "@/types/domain";
import { browserRequest } from "../browser";
import { asRecord, validateContestDto, validateContestPostsResponse, validateContestResultsResponse, validateContestsResponse } from "../validation";

export const contestKeys = {
  all: "/api/contests",
  detail: (contestId: number) => `/api/contests/${contestId}`,
  posts: (contestId: number) => `/api/contests/${contestId}/posts`,
  results: (contestId: number) => `/api/contests/${contestId}/results`,
} as const;

export const getContests = async (): Promise<ContestsByStatus> =>
  mapContestsResponse(
    await browserRequest(contestKeys.all, { validate: validateContestsResponse }),
  );

export const getContest = async (contestId: number): Promise<Contest> =>
  mapContest(
    await browserRequest(contestKeys.detail(contestId), { validate: validateContestDto }),
  );

export const getContestPosts = async (contestId: number): Promise<ContestPosts> =>
  mapContestPosts(
    await browserRequest(contestKeys.posts(contestId), {
      validate: validateContestPostsResponse,
    }),
  );

export const getContestResults = async (contestId: number): Promise<ContestResults> =>
  mapContestResults(
    await browserRequest(contestKeys.results(contestId), {
      validate: validateContestResultsResponse,
    }),
  );

export const loginAsJudge = async (contestId: number, password: string): Promise<void> => {
  const response = await browserRequest<unknown>(`/api/contests/${contestId}/judge/login`, {
    method: "POST",
    json: { password },
  });
  asRecord(response, "judge login response");
};
