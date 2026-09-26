"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import dayjs from "dayjs";
import CountdownTimer from "@/components/CountdownTimer";
import { ContestTitle } from "@/features/contests/components/ContestTitle";
import { flattenContests, getGrandPrixProgress } from "@/features/contests/model/contestPresentation";
import type { ContestsByStatus } from "@/types/domain";

const PostForm = dynamic(() => import("@/components/venue/PostForm"));

const formatDateTime = (value: string | null) =>
  value ? dayjs(value).format("MM/DD HH:mm") : "";

export function HomeGrandPrixSection({
  contests,
  isLoading,
}: {
  contests: ContestsByStatus | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="relative z-20 pt-[186px] pb-24 md:pt-20 md:pb-20 animate-pulse">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-800"></div>
          <div className="mt-4 h-12 w-3/4 max-w-md rounded-md bg-gray-200 dark:bg-gray-800 md:h-14"></div>
          <div className="mt-5 flex gap-4">
            <div className="h-4 w-32 rounded-md bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-4 w-32 rounded-md bg-gray-200 dark:bg-gray-800"></div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-4 w-64 rounded-md bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-4 w-64 rounded-md bg-gray-200 dark:bg-gray-800"></div>
          </div>
          <div className="mt-7 flex gap-3">
            <div className="h-10 w-32 rounded-full bg-gray-200 dark:bg-gray-800 md:h-12 md:w-40"></div>
            <div className="h-10 w-32 rounded-full bg-gray-200 dark:bg-gray-800 md:h-12 md:w-40"></div>
          </div>
        </div>
      </section>
    );
  }
  if (!contests) return null;

  const grandPrix = getGrandPrixProgress(flattenContests(contests));
  if (!grandPrix) {
    return (
      <section className="relative z-20 pt-[186px] pb-24 md:pt-20 md:pb-32">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-6 md:px-10">
          <div>
            <span className="inline-flex rounded-full px-4 py-1 text-sm font-bold text-white bg-gray-500">準備中</span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              <ContestTitle name="第2回 ネタツイグランプリ 予選" />
            </h2>
            <p className="mt-5 text-sm font-medium text-black/80 dark:text-white/80 md:text-base">
              現在準備中です。開催までしばらくお待ちください。
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { finals, qualifier, step, isBeforeStart, displayContest } = grandPrix;
  const statusConfig = {
    0: { label: "投稿受付中", color: "bg-[#1DA1F2]" },
    1: { label: "審査員投票中", color: "bg-green-500" },
    2: { label: "予選結果発表 & 決勝投稿開始", color: "bg-[#1DA1F2]" },
    3: { label: "審査員投票中", color: "bg-green-500" },
    4: { label: "結果発表！", color: "bg-yellow-400" },
  } as const;
  const status = isBeforeStart
    ? { label: "準備中", color: "bg-gray-500" }
    : statusConfig[step];
  const participants = step <= 1 && qualifier ? qualifier.totalPosters : finals.totalPosters;
  const deadline = {
    0: qualifier?.endTime ?? null,
    1: qualifier?.votingEndTime ?? null,
    2: finals.endTime,
    3: finals.votingEndTime,
    4: null,
  }[step];
  const showPostForm = !isBeforeStart && (step === 0 || step === 2);
  const postFormContestId = step === 0 ? (qualifier?.id ?? finals.id) : finals.id;

  return (
    <section className="relative z-20 pt-[186px] pb-24 md:pt-20 md:pb-20">
      <div className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 md:px-10 ${showPostForm ? "lg:grid-cols-[minmax(0,1fr)_600px]" : ""}`}>
        <div>
          <span className={`inline-flex rounded-full px-4 py-1 text-sm font-bold text-white ${status.color}`}>
            {status.label}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            <ContestTitle name={displayContest.name} />
          </h2>
          {!isBeforeStart && (
            <p className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-black/80 dark:text-white/80 md:text-base">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#1DA1F2]" />
                参加人数: <span className="font-bold text-[#1DA1F2]">{participants ?? 0}人</span>
              </span>
              <CountdownTimer deadline={deadline} />
            </p>
          )}
          <div className="mt-3 space-y-1 text-sm text-black/70 dark:text-white/70 md:text-base">
            {qualifier && (
              <p>
                予選投稿締切: {formatDateTime(qualifier.endTime)}　/　予選投票締切: {formatDateTime(qualifier.votingEndTime)}
              </p>
            )}
            <p>
              決勝投稿締切: {formatDateTime(finals.endTime)}　/　決勝投票締切: {formatDateTime(finals.votingEndTime)}
            </p>
          </div>
          <div className="mt-7 flex items-center gap-2 md:gap-3">
            <Link href={`/venue/${displayContest.id}`} prefetch={false} className="inline-flex shrink-0 items-center rounded-full bg-[#1DA1F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1788cc] md:px-7 md:py-3">
              詳しく見る <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
            {step === 2 && qualifier && (
              <Link href={`/venue/${qualifier.id}`} prefetch={false} className="inline-flex shrink-0 items-center rounded-full bg-gray-200 dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-300 dark:hover:bg-gray-600 md:px-7 md:py-3">
                予選結果を見る
              </Link>
            )}
          </div>
        </div>
        {showPostForm && <PostForm contestId={postFormContestId} isFinalRound={step === 2} />}
      </div>
    </section>
  );
}
