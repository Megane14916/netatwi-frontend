"use client";

import Link from "next/link";
import dayjs from "dayjs";
import {
  Award,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Info,
  Share2,
  UserStar,
  Users,
} from "lucide-react";
import JudgeLoginButton from "@/components/venue/JudgeLoginButton";
import type { Contest, ContestStatus } from "@/types/domain";
import type { ContestAccess, ContestTiming } from "../model/contestStatus";

interface ContestHeaderSectionProps {
  contest: Contest;
  contestStatus: ContestStatus;
  timing: ContestTiming;
  access: ContestAccess;
  isJudgeMode: boolean;
  onJudgeLogin: () => Promise<void>;
}

const renderTitle = (name: string) => {
  if (!name.includes("ネタツイグランプリ")) return name;
  const parts = name.split("ネタツイグランプリ");
  return (
    <>
      {parts[0] && <span className="block mb-1">{parts[0]}</span>}
      <span className="block">ネタツイグランプリ</span>
      {parts[1] && <span className="block mt-1">{parts[1]}</span>}
    </>
  );
};

export function ContestHeaderSection({
  contest,
  contestStatus,
  timing,
  access,
  isJudgeMode,
  onJudgeLogin,
}: ContestHeaderSectionProps) {
  const shareContest = () => {
    const text = `${contest.name}\n${window.location.href}\n\n#ネタツイグランプリ`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <>
      <div className="relative flex flex-col justify-center h-[280px] md:h-[320px] -mt-10 mb-6">
        <div className="mt-2">
          <h1 className="font-extrabold text-white text-left drop-shadow-md text-4xl md:text-6xl tracking-tight leading-tight">
            {renderTitle(contest.name)}
          </h1>
          {contest.hasTheme && contest.theme && (
            <div className="text-[15px] md:text-lg font-bold text-white/90 mt-3 text-left drop-shadow">
              お題: {contest.theme}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center w-full mb-8 pt-2">
        <div className="flex items-center gap-2">
          {access.canJudgeLogin && (
            <JudgeLoginButton contestId={contest.id} onLoginSuccess={onJudgeLogin} />
          )}
          {isJudgeMode && (
            <span className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs md:text-sm rounded-full font-bold shadow-sm border border-gray-200 dark:border-gray-800">
              審査員モード
            </span>
          )}
        </div>
        <button
          onClick={shareContest}
          className="inline-flex items-center gap-1.5 rounded-full bg-black dark:bg-white px-4 py-2 text-[13px] md:text-[14px] font-bold text-white dark:text-black transition hover:bg-black/80 dark:hover:bg-gray-200 whitespace-nowrap"
        >
          <Share2 className="w-4 h-4" />
          Xでポスト
        </button>
      </div>

      <div className="mb-8 pl-1">
        <div className="flex flex-col gap-2 text-[15px] font-medium text-black/80 dark:text-white/80 mb-5">
          {(contestStatus === "ongoing" || contestStatus === "upcoming") && (
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
              {contestStatus === "upcoming"
                ? `投稿開始: ${dayjs(contest.startTime).format("MM/DD HH:mm")}`
                : `投稿締切: ${dayjs(contest.endTime).format("MM/DD HH:mm")}`}
            </div>
          )}
          {contestStatus === "voting" && (
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
              投票締切: {dayjs(contest.votingEndTime).format("MM/DD HH:mm")}
            </div>
          )}
          {(contestStatus === "ongoing" || contestStatus === "upcoming") && (
            <div className="flex items-center">
              <ImageIcon className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
              画像投稿: {contest.imageRule === "required" ? "1枚以上必須" : contest.imageRule === "none" ? "不可" : "可"}
            </div>
          )}
          {contest.advancementNumerator !== null && contest.advancementDenominator !== null && (
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
              予選通過率: {contest.advancementNumerator}/{contest.advancementDenominator}
            </div>
          )}
          {contestStatus === "closed" && (
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />投稿: {contest.postCount}人
              </span>
              {contest.scoringMethod !== "judge" && (
                <span className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />投票: {contest.totalVoters}人
                </span>
              )}
              {contest.scoringMethod !== "user" && (
                <span className="flex items-center">
                  <UserStar className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />審査員: {contest.totalJudges}人
                </span>
              )}
            </div>
          )}
          {contestStatus === "voting" && (
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />投稿数: {contest.postCount}
            </div>
          )}
          {contestStatus === "ongoing" && (
            <div className="flex items-start w-full">
              <Info className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-[#1DA1F2]" />
              <p>投稿は一人一つのみ、期限内なら何回でも編集できます。</p>
            </div>
          )}
          {contestStatus === "voting" && access.canVote && (
            <div className="flex items-start w-full">
              <Info className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-[#1DA1F2]" />
              <p>投票は期限内なら何回でも編集できます。</p>
            </div>
          )}
          <div className="mt-1">
            <Link href="/rules" className="inline-block text-[#1DA1F2] font-bold text-sm hover:underline">
              ルールを詳しく見る→
            </Link>
          </div>
        </div>
      </div>

      {contestStatus === "ongoing" && timing.isPostDeadlineExceeded && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          投稿受け付けは終了しました。フェーズの切り替えをお待ちください。
        </p>
      )}
      {contestStatus === "voting" && timing.isVoteDeadlineExceeded && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          投票期間は終了しました。結果発表をお待ちください。
        </p>
      )}
    </>
  );
}
