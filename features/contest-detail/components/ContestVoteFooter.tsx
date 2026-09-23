"use client";

import { CheckCircle, Loader2, X } from "lucide-react";
import type { ContestDetailController } from "../hooks/useContestDetailController";

export function ContestVoteFooter({ controller }: { controller: ContestDetailController }) {
  const {
    showVoteUI,
    isJudgeMode,
    posts,
    user,
    votes,
    sessionCommentedPosts,
    judgeAwardSelection,
    handleVoteClick,
    isSubmittingVotes,
    userHasVoted,
  } = controller;

  return (
    <>
      {/* 投票確定ボタン (固定) */}
      {showVoteUI && (
        <div className="sticky bottom-0 w-full z-50 bg-white dark:bg-black/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col items-center mt-auto">
          {isJudgeMode && (() => {
            const votablePosts = posts.filter((post) => !user || String(post.userId) !== String(user.id));
            const totalVotable = votablePosts.length;
            const votedCount = votablePosts.filter((p) => votes[p.id] !== undefined).length;
            const commentedCount = votablePosts.filter((p) => p.hasCommented || sessionCommentedPosts[p.id]).length;
            
            const isVoteComplete = totalVotable > 0 && votedCount === totalVotable;
            const isJudgeAwardComplete = !!(judgeAwardSelection.postId && judgeAwardSelection.comment?.trim());
            const isCommentComplete = totalVotable > 0 && commentedCount === totalVotable;

            return (
              <div className="w-full max-w-md mb-1.5 flex items-center justify-between text-[11px] md:text-xs font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800 pb-1.5 px-1">
                <span className={`transition-colors ${isVoteComplete ? "text-[#84cc16]" : ""}`}>
                  投票: {votedCount}/{totalVotable}
                </span>
                <span className={`transition-colors ${isJudgeAwardComplete ? "text-[#84cc16]" : ""}`}>
                  審査員賞: {isJudgeAwardComplete ? <CheckCircle className="w-3.5 h-3.5 inline-block ml-0.5 mb-0.5" /> : <X className="w-3.5 h-3.5 inline-block ml-0.5 mb-0.5" />}
                </span>
                <span className={`transition-colors ${isCommentComplete ? "text-[#84cc16]" : ""}`}>
                  コメント: {commentedCount}/{totalVotable}
                </span>
              </div>
            );
          })()}
          <button
            onClick={handleVoteClick}
            disabled={isSubmittingVotes}
            className="w-full max-w-md mx-auto py-3.5 px-6 rounded-full font-bold bg-[#1DA1F2] hover:bg-[#1788cc] text-white shadow-md flex items-center justify-center transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed text-[15px]"
          >
            {isSubmittingVotes ? (
              <Loader2 className="animate-spin mr-2 w-5 h-5" />
            ) : null}
            {isSubmittingVotes
              ? "送信中..."
              : userHasVoted
                ? "投票を更新する"
                : "投票する"}
          </button>
        </div>
      )}
    </>
  );
}
