"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/core";
import { useContest, useContestPosts, useContestResults } from "@/hooks/api/useContests";
import type { Post } from "@/types/domain";
import { getContestTiming } from "../model/contestStatus";

const EMPTY_POSTS: Post[] = [];

export type ContestPageState = "loading" | "not-found" | "error" | "ready";
export type ContestResultsState = "idle" | "loading" | "empty" | "aggregating" | "ready";

export const useContestDetail = (contestId: number | null) => {
  const [now, setNow] = useState(() => new Date());
  const contestQuery = useContest(contestId);
  const timing = useMemo(
    () => (contestQuery.data ? getContestTiming(contestQuery.data, now) : null),
    [contestQuery.data, now],
  );
  const status = timing?.status ?? null;

  useEffect(() => {
    if (!contestQuery.data || status === "closed") return;
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, [contestQuery.data, status]);

  const postsQuery = useContestPosts(
    contestId ?? 0,
    contestId !== null && (status === "ongoing" || status === "voting"),
  );
  const resultsQuery = useContestResults(
    contestId ?? 0,
    contestId !== null && status === "closed",
  );

  let pageState: ContestPageState = "ready";
  if (contestId === null || (!contestQuery.data && !contestQuery.error)) pageState = "loading";
  else if (contestQuery.error instanceof ApiError && contestQuery.error.status === 404) {
    pageState = "not-found";
  } else if (contestQuery.error || postsQuery.error || resultsQuery.error) pageState = "error";

  let resultsState: ContestResultsState = "idle";
  if (status === "closed") {
    if (!resultsQuery.data) resultsState = "loading";
    else if (resultsQuery.data.results.length === 0) resultsState = "empty";
    else if (resultsQuery.data.results.some((result) => result.rank === null)) {
      resultsState = "aggregating";
    } else resultsState = "ready";
  }

  return {
    pageState,
    resultsState,
    contest: contestQuery.data ?? null,
    timing,
    posts: postsQuery.data?.posts ?? EMPTY_POSTS,
    postsData: postsQuery.data,
    resultsData: resultsQuery.data,
    mutateContest: contestQuery.mutate,
    mutatePosts: postsQuery.mutate,
  };
};
