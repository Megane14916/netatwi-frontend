"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Award, Loader2 } from "lucide-react";
import ResultPostCard from "@/components/ResultPostCard";
import type { Contest, ContestResults, ResultPost, User } from "@/types/domain";
import type { ContestResultsState } from "../hooks/useContestDetail";
import { usePrefetchedComments } from "../hooks/usePrefetchedComments";
import { shufflePostIds } from "../model/judgeOrder";

type ResultSortOrder = "asc" | "desc" | "random";

interface ContestResultsSectionProps {
  contest: Contest;
  data: ContestResults | undefined;
  state: ContestResultsState;
  currentUser: User | null;
}

const ResultsPlaceholder = ({ state }: { state: ContestResultsState }) => {
  if (state === "loading") {
    return (
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-20 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#1DA1F2]" />
        <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
      </div>
    );
  }
  if (state === "aggregating") {
    return (
      <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-20 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#1DA1F2]" />
        <p className="mb-2 text-xl font-bold text-gray-700 dark:text-gray-300">現在、結果を集計中です</p>
        <p className="text-gray-500 dark:text-gray-400">結果が発表されるまでしばらくお待ちください。</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
      投稿がありませんでした。
    </div>
  );
};

export function ContestResultsSection({
  contest,
  data,
  state,
  currentUser,
}: ContestResultsSectionProps) {
  const [sortOrder, setSortOrder] = useState<ResultSortOrder>("desc");
  const [randomOrder, setRandomOrder] = useState<number[]>([]);
  const results = useMemo(() => data?.results ?? [], [data?.results]);
  const commentsByPost = usePrefetchedComments([], results, "closed");

  const sortedResults = useMemo(() => {
    if (sortOrder === "asc") return results;
    if (sortOrder === "desc") return [...results].reverse();
    const order = new Map(randomOrder.map((postId, index) => [postId, index]));
    return [...results].sort(
      (left, right) =>
        (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [randomOrder, results, sortOrder]);

  if (state !== "ready" || !data) return <ResultsPlaceholder state={state} />;

  return (
    <div className="space-y-8 pb-12">
      {contest.resultCommentTop && (
        <div className="whitespace-pre-wrap break-words px-2 leading-relaxed text-black/80 dark:text-white/80">
          {contest.resultCommentTop}{"\u200B"}
        </div>
      )}

      <div className="-mx-4 overflow-hidden border-y border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-black md:mx-0 md:rounded-2xl md:border-x">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3 font-bold dark:border-gray-800 dark:bg-gray-950">
          <span>ランキング</span>
          <select
            value={sortOrder}
            onChange={(event) => {
              const nextOrder = event.target.value as ResultSortOrder;
              if (nextOrder === "random") setRandomOrder(shufflePostIds(results.map(({ id }) => id)));
              setSortOrder(nextOrder);
            }}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-[#1DA1F2] focus:outline-none dark:border-gray-800 dark:bg-black"
          >
            <option value="asc">昇順</option>
            <option value="desc">降順</option>
            <option value="random">ランダム</option>
          </select>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sortedResults.map((result, index) => {
            const previous = sortedResults[index - 1];
            const showBorder = Boolean(
              previous &&
                ((sortOrder === "asc" && previous.isAdvanced && !result.isAdvanced) ||
                  (sortOrder === "desc" && !previous.isAdvanced && result.isAdvanced)),
            );
            return (
              <Fragment key={result.id}>
                {showBorder && contest.advancementNumerator !== null && contest.advancementDenominator !== null && (
                  <div className="flex items-center justify-center border-y border-red-200 bg-red-50/50 py-3 text-xs font-bold tracking-widest text-red-500">
                    予選通過ボーダー
                  </div>
                )}
                <ResultPostCard
                  post={result}
                  currentUser={currentUser}
                  contestScoringMethod={contest.scoringMethod}
                  initialComments={commentsByPost[result.id] ?? []}
                />
              </Fragment>
            );
          })}
        </div>
      </div>

      {contest.scoringMethod !== "general" && data.judgeAwards.length > 0 && (
        <div className="mt-24">
          <h2 className="mb-12 flex items-center px-2 text-3xl font-bold">
            <Award className="mr-3 h-8 w-8 text-[#1DA1F2]" />審査員賞
          </h2>
          <div className="space-y-12">
            {data.judgeAwards.map((award, index) => {
              const fullPost: ResultPost | undefined = results.find(({ id }) => id === award.post.id);
              return (
                <div key={`${award.judge.screenName}-${index}`} className="px-2">
                  <div className="mb-4 flex items-center gap-3">
                    <Link href={`/profile/${encodeURIComponent(award.judge.screenName)}`}>
                      <img src={award.judge.profileImageUrl || "https://via.placeholder.com/40"} alt={award.judge.name} className="h-10 w-10 rounded-full border object-cover" />
                    </Link>
                    <Link href={`/profile/${encodeURIComponent(award.judge.screenName)}`} className="text-xl font-bold hover:underline">
                      {award.judge.name}
                    </Link>
                    <span className="text-xl font-bold">賞</span>
                  </div>
                  {fullPost ? (
                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
                      <ResultPostCard
                        post={fullPost}
                        currentUser={currentUser}
                        contestScoringMethod={contest.scoringMethod}
                        hideVotersAndComments
                        initialComments={commentsByPost[fullPost.id] ?? []}
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800">
                      <p className="whitespace-pre-wrap break-words">{award.post.content}{"\u200B"}</p>
                    </div>
                  )}
                  <div className="ml-1 whitespace-pre-wrap break-words text-base leading-relaxed">
                    {award.comment ? `${award.comment}\u200B` : "（コメントなし）"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {contest.resultCommentBottom && (
        <div className="mt-12 whitespace-pre-wrap break-words border-t border-gray-200 px-2 pt-12 leading-relaxed text-black/80 dark:border-gray-800 dark:text-white/80">
          {contest.resultCommentBottom}{"\u200B"}
        </div>
      )}
    </div>
  );
}
