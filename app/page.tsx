"use client";

import Link from "next/link";
import Image from "next/image";
import logoImage from "@/assets/logo.png";
import { ExternalLink, Users } from "lucide-react";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import CountdownTimer from "@/components/CountdownTimer";
import HeroSection from "@/components/home/HeroSection";
import NewsSection from "@/components/home/NewsSection";
import { useContests } from '@/hooks/api/useContests';
import { ContestCard } from '@/features/contests/components/ContestCard';
import { ContestTitle } from '@/features/contests/components/ContestTitle';
import {
  flattenContests,
  getGrandPrixProgress,
  getVisibleDailyContests,
  isContestType,
  sortContestsNewestFirst,
} from '@/features/contests/model/contestPresentation';

const PostForm = dynamic(() => import("@/components/venue/PostForm"));

const formatDateTime = (dt: string | null) => {
  if (!dt) return "";
  return dayjs(dt).format("MM/DD HH:mm");
};









export default function HomePage() {
  const {
    data: contestsData = null,
    isLoading: contestsLoading,
  } = useContests();

  return (
    <div className="relative bg-white dark:bg-black text-black dark:text-white">
      <HeroSection />

      {/* グランプリセクション */}
      {(() => {
        if (contestsLoading) {
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
        if (!contestsData) return null;

        const grandPrix = getGrandPrixProgress(flattenContests(contestsData));

        if (!grandPrix) {
          return (
            <section className="relative z-20 pt-[186px] pb-24 md:pt-20 md:pb-32">
              <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-6 md:px-10">
                <div>
                  <span className="inline-flex rounded-full px-4 py-1 text-sm font-bold text-white bg-gray-500">
                    準備中
                  </span>
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

        const { finals: gpFinals, qualifier: gpQualifier, step, isBeforeStart } = grandPrix;

        // ステータスバッジ
        const statusConfig: Record<number, { label: string; color: string }> = {
          0: { label: "投稿受付中", color: "bg-[#1DA1F2]" },
          1: { label: "審査員投票中", color: "bg-green-500" },
          2: { label: "予選結果発表 & 決勝投稿開始", color: "bg-[#1DA1F2]" },
          3: { label: "審査員投票中", color: "bg-green-500" },
          4: { label: "結果発表！", color: "bg-yellow-400" },
        };
        let { label: statusLabel, color: statusColor } = statusConfig[step];
        if (isBeforeStart) {
          statusLabel = "準備中";
          statusColor = "bg-gray-500";
        }

        // 参加人数
        const participants =
          step <= 1 && gpQualifier
            ? (gpQualifier.totalPosters ?? 0)
            : (gpFinals.totalPosters ?? 0);

        const deadlineMap: Record<number, string | null> = {
          0: gpQualifier?.endTime ?? null,
          1: gpQualifier?.votingEndTime ?? null,
          2: gpFinals.endTime,
          3: gpFinals.votingEndTime,
          4: null,
        };
        const activeDeadline = deadlineMap[step];

        // フェーズに応じた表示名・リンク先を決定
        // step 0/1（予選期間）は予選の情報を、step 2以降は決勝の情報を表示
        const displayContest = grandPrix.displayContest;
        const displayName = displayContest.name;

        // 投稿フォームを表示するか
        const showPostForm = !isBeforeStart && (step === 0 || step === 2);
        const postFormContestId =
          step === 0 ? (gpQualifier?.id ?? gpFinals.id) : gpFinals.id;
        const postFormIsFinalRound = step === 2;

        return (
          <section className="relative z-20 pt-[186px] pb-24 md:pt-20 md:pb-20">
            <div
              className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 md:px-10 ${showPostForm ? "lg:grid-cols-[minmax(0,1fr)_600px]" : ""}`}
            >
              <div>
                <span
                  className={`inline-flex rounded-full px-4 py-1 text-sm font-bold text-white ${statusColor}`}
                >
                  {statusLabel}
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
                  <ContestTitle name={displayName} />
                </h2>
                {!isBeforeStart && (
                  <p className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-black/80 dark:text-white/80 md:text-base">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[#1DA1F2]" />
                      参加人数:{" "}
                      <span className="font-bold text-[#1DA1F2]">
                        {participants}人
                      </span>
                    </span>
                    <CountdownTimer deadline={activeDeadline} />
                  </p>
                )}
                <div className="mt-3 space-y-1 text-sm text-black/70 dark:text-white/70 md:text-base">
                  {gpQualifier && (
                    <p>
                      予選投稿締切: {formatDateTime(gpQualifier.endTime)}
                      　/　予選投票締切:{" "}
                      {formatDateTime(gpQualifier.votingEndTime)}
                    </p>
                  )}
                  <p>
                    決勝投稿締切: {formatDateTime(gpFinals.endTime)}
                    　/　決勝投票締切: {formatDateTime(gpFinals.votingEndTime)}
                  </p>
                </div>
                <div className="mt-7 flex items-center gap-2 md:gap-3">
                  <Link
                    href={`/venue/${displayContest.id}`}
                    prefetch={false}
                    className="inline-flex shrink-0 items-center rounded-full bg-[#1DA1F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1788cc] md:px-7 md:py-3"
                  >
                    詳しく見る
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                  {step === 2 && gpQualifier && (
                    <Link
                      href={`/venue/${gpQualifier.id}`}
                      prefetch={false}
                      className="inline-flex shrink-0 items-center rounded-full bg-gray-200 dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-300 dark:hover:bg-gray-600 md:px-7 md:py-3"
                    >
                      予選結果を見る
                    </Link>
                  )}
                </div>
              </div>

              {showPostForm && (
                <PostForm
                  contestId={postFormContestId}
                  isFinalRound={postFormIsFinalRound}
                />
              )}
            </div>
          </section>
        );
      })()}

      {/* Daily Contest Section */}
      {(() => {
        if (contestsLoading) {
          return (
            <section className="relative z-20 pt-12 pb-20 animate-pulse">
              <div className="mx-auto max-w-7xl px-6 md:px-10">
                <div className="mb-6">
                  <div className="h-6 w-64 rounded-md bg-gray-200 dark:bg-gray-800 md:h-8"></div>
                </div>
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-6 px-3 md:p-8 flex flex-row items-center justify-between gap-2 md:gap-4">
                      <div className="min-w-0">
                        <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-1 md:h-6 md:w-24 md:mb-2"></div>
                        <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-800 md:h-8 md:w-48"></div>
                        <div className="mt-1 h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-800 md:mt-2 md:h-4 md:w-32"></div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end md:items-start">
                        <div className="h-3 w-8 rounded-md bg-gray-200 dark:bg-gray-800 mb-1 md:w-10"></div>
                        <div className="h-5 w-10 rounded-md bg-gray-200 dark:bg-gray-800 md:h-6 md:w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }
        if (!contestsData) return null;

          const visibleDailies = getVisibleDailyContests(flattenContests(contestsData), 3);

          if (visibleDailies.length === 0) return null;

          return (
            <section className="relative z-20 pt-12 pb-20">
              <div className="mx-auto max-w-7xl px-6 md:px-10">
                <div className="mb-6 text-left">
                  <h3 className="text-2xl font-bold text-black dark:text-white md:text-[40px]">
                    デイリー
                  </h3>
                </div>
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                  {visibleDailies.map(({ contest, status }) => (
                    <ContestCard key={contest.id} contest={contest} status={status} />
                  ))}
                </div>
                <div className="mt-8 flex justify-end">
                  <Link
                    href="/venue"
                    className="inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]"
                  >
                    全ての大会を見る
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          );
        })()}

      <div
        className="w-full text-[#1DA1F2] relative mt-[130px] md:mt-[150px]"
        aria-hidden="true"
        style={{ marginBottom: "-1px" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 26.8"
          className="block w-full"
        >
          {/* 右側の斜め区切り */}
          <polygon points="0,26.8 100,0 100,26.8" fill="currentColor" />
          {/* 左側の三角形 (右向き ▶) */}
          <polygon points="0,0 50,13.4 0,26.8" className="fill-gray-100 dark:fill-gray-900" />
        </svg>
        <div className="absolute top-[25%] md:top-[40%] left-0 w-full -translate-y-[calc(50%+20px)] md:-translate-y-[calc(50%+50px)] flex justify-center px-4 pointer-events-none">
          <Image src={logoImage} alt="ネタツイグランプリ" className="w-[200px] md:w-[400px] h-auto object-contain drop-shadow-md" />
        </div>
      </div>

      <section className="bg-[#1DA1F2] px-6 text-white md:px-10 pb-1 pt-8 md:pt-12">
        <div className="mx-auto max-w-4xl text-center md:text-left">
          <h3 className="text-2xl font-extrabold md:text-[40px] text-white mb-8 md:mb-16 text-center">
            ネタツイグランプリとは
          </h3>
          <div className="mx-auto inline-block max-w-4xl text-left text-base leading-relaxed md:text-lg">
            <p className="mb-2">
              ネタツイグランプリとは、実力派ネタツイッタラー8名による審査オンリーの、インプレッション数や流行に縛られない、おもしろさのみで競うネタツイの賞レースである。
            </p>
            <p className="mb-2">今回のネタツイグランプリでは、予選・決勝方式を採用している。予選は誰でも参加することができ、決勝には予選で上位1/3の結果を残した者のみ進出することができる。</p>
            <p className="mb-2">
              なお、予選では画像を使用することができず、逆に決勝では画像を１枚以上使用しなければならない。
            </p>
            <p className="mb-2">
              今回のネタツイグランプリでは、審査期間中に、予選・決勝とは別で『デイリー』という大会が毎日開催される。
            </p>
            <p className="mb-2">
              『デイリー』では、ユーザーによる「いいね」の数で順位が決まるため、本番とはまた違った勝ち方が求められる。
            </p>
            <p className="mb-2">
              全28回、熾烈なネタツイバトルが勃発する。 
            </p>
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/rules"
              className="inline-flex items-center rounded-full border border-white px-8 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#1DA1F2]"
            >
              ルールを詳しく見る
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full bg-white dark:bg-black text-[#1DA1F2]" aria-hidden="true" style={{ marginTop: "-1px" }}>
        <svg viewBox="0 0 100 26.8" className="block w-full">
          {/* 左側の斜め区切り (/) */}
          <polygon points="0,0 100,0 0,26.8" fill="currentColor" />
          {/* 右側の三角形 (左向き ◀) */}
          <polygon points="100,0 50,13.4 100,26.8" className="fill-gray-100 dark:fill-gray-900" />
        </svg>
      </div>

      {/* ニュースセクション */}
      <NewsSection />

      <section className="bg-white dark:bg-black px-0 pt-0 pb-0">
        <div className="relative w-full overflow-hidden rounded-t-[12.5vw] md:rounded-t-[6vw] bg-gray-100 dark:bg-gray-900 px-6 pb-24 pt-12 md:px-16 lg:px-24">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-black dark:text-white md:text-[40px]">
              過去のグランプリの結果
            </h2>

            <div className="mt-12 flex flex-col border-b border-gray-300 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700">
              {contestsLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="py-6 px-3 md:p-8 flex flex-row items-center justify-between gap-2 md:gap-4 animate-pulse">
                    <div className="min-w-0">
                      <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-1 md:h-6 md:w-24 md:mb-2"></div>
                      <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-800 md:h-8 md:w-48"></div>
                      <div className="mt-1 h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-800 md:mt-2 md:h-4 md:w-32"></div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end md:items-start">
                      <div className="h-3 w-8 rounded-md bg-gray-200 dark:bg-gray-800 mb-1 md:w-10"></div>
                      <div className="h-5 w-10 rounded-md bg-gray-200 dark:bg-gray-800 md:h-6 md:w-12"></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* DBから取得した終了済みグランプリ (新しい順) */}
                  {sortContestsNewestFirst(
                    contestsData?.closed.filter(
                      (contest) =>
                        isContestType(contest, "grandprix") &&
                        (contest.hasQualifier || contest.parentContestId === null),
                    ) ?? [],
                  ).map((contest) => (
                    <ContestCard key={contest.id} contest={contest} muted />
                  ))}

              {/* 第1回は固定リンク (DBに存在しないnote.com外部データ) — 最下部に固定 */}
              <a
                href="https://note.com/ed_nt/n/ne39d454eafb1?magazine_key=m725c32beb85d"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden bg-gray-100 dark:bg-gray-900 py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-black dark:text-white md:text-2xl">
                      第1回 ネタツイグランプリ
                    </h3>
                    <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                      外部サイト(note.com)へ移動します
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 md:gap-8">
                    <div className="flex flex-col items-end md:items-start">
                      <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">
                        投稿数
                      </span>
                      <span className="text-base md:text-xl font-bold text-black dark:text-white">
                        324件
                      </span>
                    </div>
                  </div>
                </div>
              </a>
                </>
              )}
            </div>

            {/* デイリーの結果 */}
            {(() => {
              if (contestsLoading) {
                return (
                  <div className="mt-16 animate-pulse">
                    <div className="mb-6 h-6 w-64 rounded-md bg-gray-200 dark:bg-gray-800 md:h-8"></div>
                    <div className="flex flex-col border-b border-gray-300 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 md:px-6 md:py-4 flex flex-row items-center justify-between gap-4">
                          <div className="h-5 w-40 rounded-md bg-gray-200 dark:bg-gray-800 md:h-6"></div>
                          <div className="flex flex-col items-end md:items-start">
                            <div className="h-3 w-10 rounded-md bg-gray-200 dark:bg-gray-800 mb-1"></div>
                            <div className="h-5 w-10 rounded-md bg-gray-200 dark:bg-gray-800 md:h-6"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              if (!contestsData) return null;

              const closedDailies = sortContestsNewestFirst(
                contestsData.closed.filter((contest) => isContestType(contest, "daily")),
              ).slice(0, 3);

                if (closedDailies.length === 0) return null;

                return (
                  <div className="mt-16">
                    <h3 className="mb-6 text-2xl font-bold text-black dark:text-white md:text-[40px]">
                      デイリーの結果
                    </h3>
                    <div className="flex flex-col border-b border-gray-300 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700">
                      {closedDailies.map((contest) => (
                        <ContestCard key={contest.id} contest={contest} muted compactTitle />
                      ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <Link
                        href="/history"
                        className="inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]"
                      >
                        全ての結果を見る
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </section>

      <style jsx>{`
        .wave-divider {
          height: 180px;
          width: 100%;
          line-height: 0;
          overflow: hidden;
        }

        .wave-svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .wave-divider-top {
          margin-bottom: -2px;
        }

        .timeline-rail {
          height: 460px;
          width: 290px;
          overflow: hidden;
          transform: rotate(-15deg);
          opacity: 0.95;
        }

        .timeline-track {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-up .timeline-track {
          animation: timeline-scroll-up 60s linear infinite;
        }

        .timeline-down .timeline-track {
          animation: timeline-scroll-down 60s linear infinite;
        }

        @keyframes timeline-scroll-up {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(calc(-50% - 6px));
          }
        }

        @keyframes timeline-scroll-down {
          0% {
            transform: translateY(calc(-50% - 6px));
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
