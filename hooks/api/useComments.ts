"use client";

import useSWR from "swr";
import { commentKeys, getPostComments } from "@/lib/api/endpoints/comments";
import type { Comment } from "@/types/domain";

interface UsePostCommentsOptions {
  postId: number;
  enabled: boolean;
  initialComments?: Comment[];
}

export const usePostComments = ({
  postId,
  enabled,
  initialComments = [],
}: UsePostCommentsOptions) =>
  useSWR(
    enabled ? commentKeys.forPost(postId) : null,
    () => getPostComments(postId),
    { fallbackData: initialComments },
  );
