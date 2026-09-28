"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "@/types/domain";
import {
  reconcilePostOrder,
  sortPostsByOrder,
  sortPostsByScore,
  type JudgeSortOrder,
} from "../model/judgeOrder";

const readStoredOrder = (storageKey: string): unknown => {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as unknown) : null;
  } catch {
    return null;
  }
};

export const useJudgePostOrder = (
  posts: Post[],
  contestId: number,
  persist: boolean,
) => {
  const [postOrder, setPostOrder] = useState<number[]>([]);
  const postIds = useMemo(() => posts.map(({ id }) => id), [posts]);
  const storageKey = `judge_order_contest_${contestId}`;

  useEffect(() => {
    if (postIds.length === 0) {
      setPostOrder([]);
      return;
    }
    const storedOrder = persist ? readStoredOrder(storageKey) : null;
    setPostOrder((current) => {
      const next = reconcilePostOrder(storedOrder ?? current, postIds);
      if (persist) window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [persist, postIds, storageKey]);

  return useMemo(
    () => (postOrder.length > 0 ? sortPostsByOrder(posts, postOrder) : posts),
    [postOrder, posts],
  );
};

export const useScoreSortedPosts = (
  posts: Post[],
  votes: Record<number, number>,
  order: JudgeSortOrder,
) => {
  const votesRef = useRef(votes);
  votesRef.current = votes;
  const [snapshot, setSnapshot] = useState(() => ({ posts, votes, order }));

  useEffect(() => {
    setSnapshot({ posts, votes: votesRef.current, order });
  }, [order, posts]);

  return useMemo(
    () => sortPostsByScore(snapshot.posts, snapshot.votes, snapshot.order),
    [snapshot],
  );
};
