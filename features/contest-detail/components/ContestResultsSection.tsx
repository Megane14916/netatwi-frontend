"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Award, Loader2 } from "lucide-react";
import ResultPostCard from "@/components/ResultPostCard";
import type { ContestDetailController } from "../hooks/useContestDetailController";

export function ContestResultsSection({ controller }: { controller: ContestDetailController }) {
  const {
    contestStatus,
    resultsDataRaw,
    results,
    contest,
    sortOrder,
    setSortOrder,
    sortedResults,
    user,
    prefetchedComments,
    judgeAwardsResults,
  } = controller;

  if (!contest) return null;

  return (
    <>
        {/* 結果発表 */}
        {contestStatus === "closed" && (
          <div className="space-y-8 pb-12">
            {!resultsDataRaw ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mt-8 px-4 flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2] mb-4" />
                <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
                投稿がありませんでした。
              </div>
            ) : results.some((result) => result.rank === null) ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mt-8 px-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2] mx-auto mb-4" />
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  現在、結果を集計中です
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  結果が発表されるまでしばらくお待ちください。
                </p>
              </div>
            ) : (
              <>
                {contest.resultCommentTop && (
                  <div className="whitespace-pre-wrap text-black/80 dark:text-white/80 leading-relaxed px-2 break-words [line-break:anywhere]">
                    {contest.resultCommentTop ? contest.resultCommentTop + '\u200B' : null}
                  </div>
                )}

                {/* 結果のタイムライン (並び替え考慮のコンテナ) */}
                <div className="-mx-4 md:mx-0 bg-white dark:bg-black md:rounded-2xl border-y border-[#d9e1e7] dark:border-gray-800 md:border-x shadow-sm overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-5 py-3 font-bold text-black dark:text-white flex justify-between items-center">
                    <span>ランキング</span>
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(
                          e.target.value as "asc" | "desc" | "random",
                        )
                      }
                      className="text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded px-2 py-1 focus:outline-none focus:border-[#1DA1F2]"
                    >
                      <option value="asc">昇順</option>
                      <option value="desc">降順</option>
                      <option value="random">ランダム</option>
                    </select>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sortedResults.map((result, index) => {
                      let showBorder = false;
                      if (sortOrder === "asc") {
                        showBorder = Boolean(
                          index > 0 &&
                          sortedResults[index - 1].isAdvanced &&
                          !result.isAdvanced,
                        );
                      } else if (sortOrder === "desc") {
                        showBorder = Boolean(
                          index > 0 &&
                          !sortedResults[index - 1].isAdvanced &&
                          result.isAdvanced,
                        );
                      }
                      return (
                        <Fragment key={result.id}>
                          {showBorder &&
                            contest.advancementNumerator != null &&
                            contest.advancementDenominator != null && (
                              <div className="py-3 bg-red-50/50 border-y border-red-200 flex items-center justify-center">
                                <span className="text-red-500 font-bold text-xs tracking-widest flex items-center">
                                  <div className="w-12 h-px bg-red-300 mr-3"></div>
                                  予選通過ボーダー
                                  <div className="w-12 h-px bg-red-300 ml-3"></div>
                                </span>
                              </div>
                            )}
                          <ResultPostCard
                            post={result}
                            currentUser={user}
                            contestScoringMethod={contest.scoringMethod}
                            initialComments={prefetchedComments[result.id] || []}
                          />
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* 審査員賞 */}
                {contest.scoringMethod !== "general" &&
                  judgeAwardsResults.length > 0 && (
                    <div className="mt-24">
                      <h2 className="text-3xl font-bold text-black dark:text-white mb-12 mt-24 flex items-center px-2">
                        <Award className="w-8 h-8 mr-3 text-[#1DA1F2]" />
                        審査員賞
                      </h2>
                      <div className="space-y-12">
                        {judgeAwardsResults.map((award, idx) => {
                          const fullPost = results.find(
                            (result) => result.id === award.post.id,
                          );
                          return (
                            <div key={idx} className="px-2">
                              {/* Header */}
                              <div className="flex items-center gap-3 mb-4">
                                <Link
                                  href={`/profile/${encodeURIComponent(award.judge.screenName)}`}
                                >
                                  <img
                                    src={
                                      award.judge.profileImageUrl ||
                                      "https://via.placeholder.com/40"
                                    }
                                    alt={award.judge.name}
                                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover bg-white dark:bg-black"
                                  />
                                </Link>
                                <Link
                                  href={`/profile/${encodeURIComponent(award.judge.screenName)}`}
                                  className="text-xl font-bold text-black dark:text-white hover:underline"
                                >
                                  {award.judge.name}
                                </Link>
                                <span className="text-xl font-bold text-black dark:text-white">
                                  賞
                                </span>
                              </div>

                              {/* Post */}
                              {fullPost ? (
                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-black shadow-sm">
                                  <ResultPostCard
                                    post={fullPost}
                                    currentUser={user}
                                    contestScoringMethod={contest.scoringMethod}
                                    hideVotersAndComments={true}
                                    initialComments={prefetchedComments[fullPost.id] || []}
                                  />
                                </div>
                              ) : (
                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-black p-4 shadow-sm">
                                  <p className="whitespace-pre-wrap break-words [line-break:anywhere]">{award.post.content}{'\u200B'}</p>
                                </div>
                              )}

                              {/* Judge Comment */}
                              <div className="text-black/90 dark:text-white/90 text-base leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere] ml-1">
                                {award.comment ? award.comment + '\u200B' : "（コメントなし）"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {contest.resultCommentBottom && (
                  <div
                    className={`whitespace-pre-wrap break-words [line-break:anywhere] text-black/80 dark:text-white/80 leading-relaxed px-2 ${contest.scoringMethod !== "general" && judgeAwardsResults.length > 0 ? "mt-12 pt-12 border-t border-gray-200 dark:border-gray-800" : "mt-12"}`}
                  >
                    {contest.resultCommentBottom ? contest.resultCommentBottom + '\u200B' : null}
                  </div>
                )}
              </>
            )}
          </div>
        )}
    </>
  );
}
