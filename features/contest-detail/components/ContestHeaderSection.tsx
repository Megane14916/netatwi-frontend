"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { AlertTriangle, Award, CheckCircle, Clock, Download, Image as ImageIcon, Info, Share2, ShieldCheck, Upload, UserStar, Users, X } from "lucide-react";
import JudgeLoginButton from "@/components/venue/JudgeLoginButton";
import type { ContestDetailController } from "../hooks/useContestDetailController";

const renderTitle = (name: string) => {
  if (!name || typeof name !== "string") return "";
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

export function ContestHeaderSection({ controller }: { controller: ContestDetailController }) {
  const {
    showSuccessBanner,
    isJudgeMode,
    contestStatus,
    hideJudgeBanner,
    setHideJudgeBanner,
    isPostDeadlineExceeded,
    isVoteDeadlineExceeded,
    contest,
    isVotePeriod,
    contestId,
    refetchUser,
    mutateContest,
    mutatePosts,
    totalPosters,
    totalVoters,
    totalJudges,
    showVoteUI,
    handleBackupVotes,
    restoreFileInputRef,
    fillUnvotedWithZero,
    handleRestoreFileChange,
  } = controller;

  if (!contest) return null;

  return (
    <>
        {/* ヘッダー下に浮かせる固定アラート群 */}
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl flex flex-col gap-2 pointer-events-none">
          {/* 投票完了バナー */}
          {showSuccessBanner && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center shadow-lg animate-fade-in-down pointer-events-auto">
              <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0 text-green-500" />
              <div>
                <p className="font-bold text-lg">投票が完了しました！</p>
                <p className="text-sm">
                  期間内であれば何度でも投票内容を更新できます。
                </p>
              </div>
            </div>
          )}

          {isJudgeMode && contestStatus === "voting" && !hideJudgeBanner && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-sm pointer-events-auto">
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0 text-yellow-600" />
                <span>現在、審査員として投票中です。</span>
              </div>
              <button
                onClick={() => setHideJudgeBanner(true)}
                className="ml-4 p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {contestStatus === "ongoing" && isPostDeadlineExceeded && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-sm animate-pulse pointer-events-auto">
              {" "}
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-red-500" />{" "}
              <div>
                {" "}
                <p className="font-bold">投稿受け付けは終了しました</p>{" "}
                <p className="text-xs opacity-80">
                  集計中または投票フェーズへの移行待ちです。
                </p>{" "}
              </div>{" "}
            </div>
          )}
          {contestStatus === "voting" && isVoteDeadlineExceeded && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-sm animate-pulse pointer-events-auto">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-bold">投票期間は終了しました</p>
                <p className="text-xs opacity-80">
                  集計中または結果発表待ちです。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ヘッダーエリア (タイトルとお題のみ) - 背景の中央に配置 */}
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

        {/* アクションボタンエリア (Xでポスト、審査員ログインなど) */}
        <div className="flex justify-between items-center w-full mb-8 pt-2">
          <div className="flex items-center gap-2">
            {/* 審査員ボタン: 投票期間のみ表示、かつ審査員が含まれる場合のみ */}
            {!isJudgeMode &&
              isVotePeriod &&
              contest.scoringMethod !== "user" && (
                <JudgeLoginButton
                  contestId={contestId}
                  onLoginSuccess={async () => {
                    await refetchUser();
                    await mutateContest();
                    await mutatePosts();
                  }}
                />
              )}
            {isJudgeMode && (
              <span className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs md:text-sm rounded-full font-bold shadow-sm border border-gray-200 dark:border-gray-800">
                審査員モード
              </span>
            )}
          </div>

          <button
            onClick={() => {
              const url = window.location.href;
              const text = `${contest.name}\n${url}\n\n#ネタツイグランプリ`;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                "_blank",
              );
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-black dark:bg-white px-4 py-2 text-[13px] md:text-[14px] font-bold text-white dark:text-black transition hover:bg-black/80 dark:hover:bg-gray-200 whitespace-nowrap shadow-none border border-transparent"
          >
            <Share2 className="w-4 h-4" />
            Xでポスト
          </button>
        </div>

        {/* 各種バッジ・ルール */}
        <div className="mb-8 pl-1">
          <div className="flex flex-col gap-2 text-[15px] font-medium text-black/80 dark:text-white/80 mb-5">
            {(contestStatus === "ongoing" || contestStatus === "upcoming") && (
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                {contestStatus === "upcoming" ? "投稿開始: " + dayjs(contest.startTime).format("MM/DD HH:mm") : "投稿締切: " + dayjs(contest.endTime).format("MM/DD HH:mm")}
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
                画像投稿:{" "}
                {contest.imageRule === "required"
                  ? "1枚以上必須"
                  : contest.imageRule === "none"
                    ? "不可"
                    : "可"}
              </div>
            )}
            {contest.advancementNumerator != null &&
              contest.advancementDenominator != null && (
                <div className="flex items-center">
                  <Award className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                  予選通過率: {contest.advancementNumerator}/
                  {contest.advancementDenominator}
                </div>
              )}
            {contestStatus === "closed" && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center">
                  <Users className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                  投稿: {totalPosters ?? 0}人
                </span>
                {contest.scoringMethod !== "judge" && (
                  <span className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                    投票: {totalVoters ?? 0}人
                  </span>
                )}
                {contest.scoringMethod !== "user" && (
                  <span className="flex items-center">
                    <UserStar className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                    審査員: {totalJudges ?? 0}人
                  </span>
                )}
              </div>
            )}
            {contestStatus === "voting" && (
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2.5 text-[#1DA1F2]" />
                投稿数: {totalPosters ?? 0}
              </div>
            )}

            {/* ルール・概要 */}
            {contestStatus === "ongoing" && (
              <div className="flex items-start w-full">
                <Info className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-[#1DA1F2]" />
                <p>投稿は一人一つのみ、期限内なら何回でも編集できます。</p>
              </div>
            )}
            {contestStatus === "voting" && showVoteUI && (
              <div className="flex items-start w-full">
                <Info className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-[#1DA1F2]" />
                <p>投票は期限内なら何回でも編集できます。</p>
              </div>
            )}
            <div className="mt-1">
              <Link
                href="/rules"
                className="inline-block text-[#1DA1F2] font-bold text-sm hover:underline"
              >
                ルールを詳しく見る→
              </Link>
            </div>

            {showVoteUI && isJudgeMode && (
              <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
                <button
                  onClick={handleBackupVotes}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-[14px] font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  現在の投票をバックアップ
                </button>
                <button
                  onClick={() => restoreFileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-[14px] font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  バックアップから復元
                </button>
                <button
                  onClick={fillUnvotedWithZero}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-[14px] font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                >
                  未投票を0点で埋める
                </button>
                <input
                  type="file"
                  accept="application/json"
                  ref={restoreFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleRestoreFileChange}
                />
              </div>
            )}
          </div>
        </div>
    </>
  );
}
