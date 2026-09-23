"use client";

import { ArrowUpDown, Loader2, MessageSquare, User } from "lucide-react";
import CommentList from "@/components/CommentList";
import ImageGrid from "@/components/ImageGrid";
import { GeneralVoteButton, JudgeAwardSelector, JudgeVoteSelector } from "./VoteControls";
import type { ContestDetailController } from "../hooks/useContestDetailController";

export function ContestVotingSection({ controller }: { controller: ContestDetailController }) {
  const {
    contestStatus,
    contest,
    isJudgeMode,
    displayPosts,
    sortSentinelRef,
    stickyContainerRef,
    judgeSortOrder,
    setJudgeSortOrder,
    handleVoteClick,
    isSubmittingVotes,
    userHasVoted,
    postsData,
    user,
    showVoteUI,
    openComments,
    sessionCommentedPosts,
    toggleComments,
    votes,
    voteUIDisabled,
    isVoteDeadlineExceeded,
    handleVoteChange,
    prefetchedComments,
    setOpenComments,
    handleCommentAdded,
    handleCommentDeleted,
    judgeAwardSelection,
    handleJudgeAwardSelect,
    handleJudgeCommentChange,
  } = controller;

  if (!contest) return null;

  return (
    <>
        {/* 投票期間 */}
        {contestStatus === "voting" && (
          <div className="mb-24">
            {!contest.isVotingVisible && !isJudgeMode ? (
              <div className="text-center py-20 text-black/50 dark:text-white/50 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                現在投票期間中のため、投稿は非公開です。
              </div>
            ) : (
              <div className="relative">
                {isJudgeMode && displayPosts.length > 0 && (
                  <>
                    <div ref={sortSentinelRef} className="h-0 w-full" aria-hidden="true" />
                    <div 
                      ref={stickyContainerRef}
                      className="sticky top-[48px] md:top-[64px] z-30 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md border-y border-[#d9e1e7] dark:border-gray-800 md:border-x md:rounded-t-2xl py-1 md:py-2 px-2 md:px-5 flex items-center justify-between -mx-4 md:mx-0 shadow-sm transition-all duration-200"
                    >
                      <span className="text-[13px] md:text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5 md:w-4 md:h-4" /> 並び順
                    </span>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <select
                          value={judgeSortOrder}
                          onChange={(e) => setJudgeSortOrder(e.target.value as "original" | "asc" | "desc")}
                          className="text-[13px] md:text-sm bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md py-0.5 md:py-1 px-1.5 md:px-2 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-bold cursor-pointer"
                        >
                          <option value="original">標準 (元の順序)</option>
                          <option value="desc">得点: 高い順</option>
                          <option value="asc">得点: 低い順</option>
                        </select>
                        
                        <button
                          onClick={handleVoteClick}
                          disabled={isSubmittingVotes}
                          className="py-1 px-3 rounded-full font-bold bg-[#1DA1F2] hover:bg-[#1788cc] text-white shadow-sm flex items-center justify-center transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed text-xs whitespace-nowrap"
                        >
                          {isSubmittingVotes ? (
                            <Loader2 className="animate-spin mr-1.5 w-3.5 h-3.5" />
                          ) : null}
                          {isSubmittingVotes
                            ? "送信中..."
                            : userHasVoted
                              ? "更新"
                              : "投票"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                <div className={`-mx-4 md:mx-0 bg-white dark:bg-black border-b border-[#d9e1e7] dark:border-gray-800 md:border-x shadow-sm divide-y divide-gray-100 dark:divide-gray-800 ${isJudgeMode ? 'md:rounded-b-2xl' : 'md:rounded-2xl border-t'}`}>
                  {displayPosts.length > 0 ? (
                    displayPosts.map((post) => {
                      return (
                        <div
                        key={post.id}
                        className="py-4 px-3 sm:p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="flex-none">
                            {user && String(post.userId) === String(user.id) ? (
                                <img 
                                  src={user.profileImageUrl || 'https://via.placeholder.com/40'}
                                  alt={user.name} 
                                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover" 
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                                </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              {user && String(post.userId) === String(user.id) ? (
                                  <span className="font-bold text-black dark:text-white text-sm">
                                    {user.name}
                                  </span>
                              ) : (
                                  <span className="font-bold text-black dark:text-white text-sm hover:underline cursor-pointer">
                                    匿名さん
                                  </span>
                              )}
                            </div>
                            <div className="text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere] mb-2">
                              {post.content}{'\u200B'}
                            </div>
                            {post.images && post.images.length > 0 && (
                              <div className="mt-2">
                                <ImageGrid images={post.images} />
                              </div>
                            )}

                            {/* 投票UIとコメントボタン（横並び） */}
                            <div className={`flex items-end gap-2 w-full mt-2 ${showVoteUI && isJudgeMode ? "justify-between" : "justify-end"}`}>
                              {/* 左側: コメントボタン・一般投票ボタン */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleComments(post.id)}
                                  className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-all group ${
                                    openComments[post.id] ||
                                    post.hasCommented ||
                                    sessionCommentedPosts[post.id]
                                      ? "text-[#1DA1F2] bg-[#1DA1F2]/10 border border-[#1DA1F2]/20"
                                      : "text-gray-500 dark:text-gray-400 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] border border-transparent hover:border-[#1DA1F2]/20"
                                  }`}
                                >
                                  <MessageSquare
                                    className={`w-4 h-4 md:w-5 md:h-5 ${openComments[post.id] || post.hasCommented || sessionCommentedPosts[post.id] ? "fill-current" : ""}`}
                                  />
                                  <span className="text-xs md:text-sm font-bold">
                                    コメント
                                  </span>
                                </button>

                                {showVoteUI && !isJudgeMode && (
                                  <GeneralVoteButton
                                    postId={post.id}
                                    isLiked={votes[post.id] === 1}
                                    onToggle={handleVoteChange}
                                    disabled={
                                      Boolean(voteUIDisabled || isVoteDeadlineExceeded || (user && String(post.userId) === String(user.id)))
                                    }
                                  />
                                )}
                              </div>

                              {/* 右側: 審査員モード評価点 */}
                              {showVoteUI && isJudgeMode && (
                                <div className="flex-grow flex justify-end">
                                  <JudgeVoteSelector
                                    postId={post.id}
                                    currentScore={votes[post.id] !== undefined ? votes[post.id] : null}
                                    onSelect={handleVoteChange}
                                    disabled={Boolean(isVoteDeadlineExceeded || (user && String(post.userId) === String(user.id)))}
                                    maxScore={contest.judgeMaxScore || 10}
                                  />
                                </div>
                              )}
                            </div>

                            {/* コメント機能 (一般) */}
                            <div className={`mt-3 ${!openComments[post.id] ? "hidden" : ""}`}>
                              <CommentList
                                postId={post.id}
                                currentUser={user}
                                contestStatus="voting"
                                isJudgeMode={isJudgeMode}
                                isOpenProp={openComments[post.id] || false}
                                initialComments={prefetchedComments[post.id] || []}
                                onClose={() =>
                                  setOpenComments((prev) => ({
                                    ...prev,
                                    [post.id]: false,
                                  }))
                                }
                                onCommentAdded={() =>
                                  handleCommentAdded(post.id)
                                }
                                onCommentDeleted={() =>
                                  handleCommentDeleted(post.id)
                                }
                              />
                            </div>

                            {/* 審査員賞/コメント */}
                            {showVoteUI && isJudgeMode && (
                              <div className="w-full">
                                <JudgeAwardSelector
                                  postId={post.id}
                                  isSelected={
                                    judgeAwardSelection.postId === post.id
                                  }
                                  onSelect={handleJudgeAwardSelect}
                                  comment={judgeAwardSelection.comment}
                                  onCommentChange={handleJudgeCommentChange}
                                  disabled={
                                    Boolean(voteUIDisabled || isVoteDeadlineExceeded || (user && String(post.userId) === String(user.id)))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : !postsData ? (
                  <div className="text-center py-16 text-black/50 dark:text-white/50 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2] mb-3" />
                    読み込み中...
                  </div>
                ) : (
                  <div className="text-center py-16 text-black/50 dark:text-white/50">
                    投稿がありません。
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
    </>
  );
}
