"use client";

import useSWR from "swr";
import {
  contestKeys,
  getContest,
  getContestPosts,
  getContestResults,
  getContests,
} from "@/lib/api/endpoints/contests";
import type { ContestResults } from "@/types/domain";

export const useContests = () => useSWR(contestKeys.all, getContests);

export const useContest = (contestId: number | null) =>
  useSWR(
    contestId ? contestKeys.detail(contestId) : null,
    () => getContest(contestId as number),
  );

export const useContestPosts = (contestId: number, enabled: boolean) =>
  useSWR(
    enabled ? contestKeys.posts(contestId) : null,
    () => getContestPosts(contestId),
  );

export const useContestResults = (contestId: number, enabled: boolean) =>
  useSWR(
    enabled ? contestKeys.results(contestId) : null,
    () => getContestResults(contestId),
    {
      refreshInterval: (data?: ContestResults) => {
        if (!data?.results) return 0;
        return data.results.some((result) => result.rank === null) ? 10_000 : 0;
      },
    },
  );
