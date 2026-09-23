"use client";

import { useEffect, useRef, useState } from "react";
import { getCommentsByPostIds } from "@/lib/api/endpoints/comments";
import type { Comment, ContestStatus, Post, ResultPost } from "@/types/domain";

export const usePrefetchedComments = (
  posts: Post[],
  results: ResultPost[],
  contestStatus: ContestStatus,
) => {
  const [commentsByPost, setCommentsByPost] = useState<Record<number, Comment[]>>({});
  const fetchingPostIds = useRef(new Set<number>());

  useEffect(() => {
    const ids = new Set<number>();
    for (const post of posts) {
      if (post.commentCount <= 0) continue;
      if (contestStatus !== "voting" || post.hasCommented) ids.add(post.id);
    }
    for (const result of results) {
      if (result.commentCount > 0) ids.add(result.id);
    }
    const missingIds = Array.from(ids).filter(
      (postId) => !commentsByPost[postId] && !fetchingPostIds.current.has(postId),
    );
    if (missingIds.length === 0) return;

    missingIds.forEach((postId) => fetchingPostIds.current.add(postId));
    getCommentsByPostIds(missingIds)
      .then((comments) => setCommentsByPost((current) => ({ ...current, ...comments })))
      .catch((error) => {
        console.error(error);
        missingIds.forEach((postId) => fetchingPostIds.current.delete(postId));
      });
  }, [commentsByPost, contestStatus, posts, results]);

  return commentsByPost;
};
