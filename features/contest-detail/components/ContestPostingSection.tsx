"use client";

import PostForm from "@/components/venue/PostForm";
import type { Contest, ContestStatus } from "@/types/domain";

interface ContestPostingSectionProps {
  contest: Contest;
  status: ContestStatus;
  onPostSuccess: () => void;
}

export function ContestPostingSection({
  contest,
  status,
  onPostSuccess,
}: ContestPostingSectionProps) {
  if (status === "upcoming") {
    return (
      <div className="pb-[450px]">
        <div className="text-center py-20 text-black/80 dark:text-white/80 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          投稿開始までしばらくお待ちください。
        </div>
      </div>
    );
  }

  if (status !== "ongoing") return null;
  return (
    <div className="pb-[450px]">
      <PostForm
        contestId={contest.id}
        isFinalRound={Boolean(contest.parentContestId)}
        onPostSuccess={onPostSuccess}
      />
    </div>
  );
}
