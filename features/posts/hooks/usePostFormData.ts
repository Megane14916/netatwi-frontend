"use client";

import { useEffect, useState } from "react";
import { getContest, getContestPosts } from "@/lib/api/endpoints/contests";
import type { Contest, Post } from "@/types/domain";

export type ContestInfo = Pick<
  Contest,
  "id" | "imageRule" | "endTime" | "isAdvancedToFinal" | "parentContestId"
>;

interface UsePostFormDataOptions {
  contestId: number;
  userId: number | null;
  providedContest?: Contest;
  providedPosts?: Post[];
  providedDataLoading?: boolean;
}

export const usePostFormData = ({
  contestId,
  userId,
  providedContest,
  providedPosts,
  providedDataLoading = false,
}: UsePostFormDataOptions) => {
  const [contestInfo, setContestInfo] = useState<ContestInfo | null>(providedContest ?? null);
  const [myPost, setMyPost] = useState<Post | null>(
    providedPosts?.find((post) => post.userId === userId) ?? null,
  );
  const [isLoading, setIsLoading] = useState(providedDataLoading || !providedContest);

  useEffect(() => {
    if (providedContest) {
      setContestInfo(providedContest);
      setMyPost(providedPosts?.find((post) => post.userId === userId) ?? null);
      setIsLoading(providedDataLoading);
      return;
    }

    let active = true;
    setIsLoading(true);
    Promise.all([
      getContest(contestId),
      userId === null ? Promise.resolve(null) : getContestPosts(contestId),
    ])
      .then(([contest, postsData]) => {
        if (!active) return;
        setContestInfo(contest);
        setMyPost(postsData?.posts.find((post) => post.userId === userId) ?? null);
      })
      .catch((error) => console.error("PostForm: データ取得エラー", error))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contestId, providedContest, providedDataLoading, providedPosts, userId]);

  return { contestInfo, myPost, setMyPost, isLoading };
};
