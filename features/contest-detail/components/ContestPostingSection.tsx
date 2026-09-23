"use client";

import PostForm from "@/components/venue/PostForm";
import type { ContestDetailController } from "../hooks/useContestDetailController";

export function ContestPostingSection({ controller }: { controller: ContestDetailController }) {
  const { contestStatus, contestId, contest, mutatePosts } = controller;
  if (!contest) return null;
  return (
    <>
        {/* 投稿期間・準備中 */}
        {contestStatus === "upcoming" && (
          <div className="pb-[450px]">
            <div className="text-center py-20 text-black/80 dark:text-white/80 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              投稿開始までしばらくお待ちください。
            </div>
          </div>
        )}
        {contestStatus === "ongoing" && (
          <div className="pb-[450px]">
            <PostForm
              contestId={contestId}
              isFinalRound={!!contest.parentContestId}
              onPostSuccess={() => mutatePosts()}
            />
          </div>
        )}
    </>
  );
}
