"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImage from "@/assets/logo.png";
import {
  Clock3,
  ExternalLink,
  Users,
} from "lucide-react";
import dayjs from "dayjs";
import useSWR from "swr";
import RippleLink from "@/components/RippleLink";
import dynamic from "next/dynamic";
import CountdownTimer from "@/components/CountdownTimer";

const PostForm = dynamic(() => import("@/components/venue/PostForm"));
const DynamicTweet = dynamic(() => import("@/components/DynamicTweet"), {
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
  ),
});

interface Contest {
  id: number;
  name: string;
  hasTheme: boolean;
  theme: string | null;
  hasQualifier: boolean;
  parentContestId?: number;
  type?: string;
  startTime: string | null;
  endTime: string | null;
  votingEndTime: string | null;
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

interface ContestsResponse {
  ongoing: Contest[];
  voting: Contest[];
  upcoming: Contest[];
  closed: Contest[];
}



const getGPStep = (
  gpFinals: Contest,
  gpQualifier: Contest | undefined | null,
): number => {
  const now = dayjs();
  if (gpQualifier) {
    if (now.isBefore(dayjs(gpQualifier.endTime))) return 0;
    if (now.isBefore(dayjs(gpQualifier.votingEndTime))) return 1;
  }
  if (now.isBefore(dayjs(gpFinals.endTime))) return 2;
  if (now.isBefore(dayjs(gpFinals.votingEndTime))) return 3;
  return 4;
};

const renderGPTitle = (name: string) => {
  if (!name.includes("ネタツイグランプリ")) return <>{name}</>;
  const parts = name.split("ネタツイグランプリ");
  return (
    <>
      {parts[0] && <span className="block">{parts[0]}</span>}
      <span className="block">ネタツイグランプリ</span>
      {parts[1] && <span className="block">{parts[1]}</span>}
    </>
  );
};

const categorizeDaily = (c: Contest) => {
  const now = dayjs();
  if (c.startTime && now.isBefore(dayjs(c.startTime))) return "upcoming";
  if (c.endTime && now.isBefore(dayjs(c.endTime))) return "ongoing";
  if (c.votingEndTime && now.isBefore(dayjs(c.votingEndTime))) return "voting";
  return "closed";
};

const formatDateTime = (dt: string | null) => {
  if (!dt) return "";
  return dayjs(dt).format("MM/DD HH:mm");
};









export default function HomePage() {
  const heroTitleMeasureRef = useRef<HTMLSpanElement | null>(null);
  const heroTaglinesRef = useRef<HTMLDivElement | null>(null);
  const [heroTitleFontSize, setHeroTitleFontSize] = useState<number | null>(
    null,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

  const {
    data: newsList = [],
    error: newsError,
    isLoading: newsLoading,
  } = useSWR<{ id: number; tweet_id: string }[]>("/api/news", fetcher);

  // ツイート埋め込み等によるスクロール位置のバグを防ぐため初期状態では左端に戻す
  useEffect(() => {
    if (scrollRef.current && newsList.length > 0) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [newsList]);

  const {
    data: contestsData = null,
    isLoading: contestsLoading,
  } = useSWR<ContestsResponse>("/api/contests", fetcher);



  useEffect(() => {
    const updateHeroTitleFontSize = () => {
      const measureEl = heroTitleMeasureRef.current;
      const taglinesEl = heroTaglinesRef.current;
      if (!measureEl || !taglinesEl) return;

      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        setHeroTitleFontSize(null);
        return;
      }

      const baseWidth = measureEl.offsetWidth;
      const taglinesWidth = taglinesEl.offsetWidth;
      if (baseWidth === 0 || taglinesWidth === 0) return;

      const baseFontSize = parseFloat(
        window.getComputedStyle(measureEl).fontSize || "0",
      );
      if (!baseFontSize) return;

      const targetWidth = taglinesWidth * 0.9;
      const ratio = Math.min(targetWidth / baseWidth, 1);
      const nextFontSize = baseFontSize * ratio;

      setHeroTitleFontSize((prev) => {
        if (prev === null && Math.abs(ratio - 1) < 0.01) return prev;
        if (prev !== null && Math.abs(prev - nextFontSize) < 0.5) return prev;
        return nextFontSize;
      });
    };

    updateHeroTitleFontSize();
    document.fonts?.ready?.then(updateHeroTitleFontSize);
    window.addEventListener("resize", updateHeroTitleFontSize);
    return () => window.removeEventListener("resize", updateHeroTitleFontSize);
  }, []);

  return (
    <div className="relative bg-white dark:bg-black text-black dark:text-white">
      <section className="relative z-0 flex h-[calc(100vh-4rem)] min-h-[640px] items-center bg-white dark:bg-black">
        {/* Top Left Separator */}
        <svg
          className="pointer-events-none absolute left-0 top-0 z-10 w-[50vw] lg:w-[33.333vw]"
          viewBox="0 0 100 26.8"
        >
          <polygon points="0,0 100,0 0,26.8" fill="#1DA1F2" />
        </svg>



        {/* Bottom Right Separator (Triangle) */}
        <svg
          className="pointer-events-none absolute right-0 z-10 w-[66.666vw] lg:min-w-[700px] lg:w-[50vw]"
          style={{ top: "100%", transform: "translateY(-34.45%)" }}
          viewBox="0 0 89.18 84.53"
        >
          <path
            d="M 89.18 0 L 5.02 22.56 A 6.8 6.8 0 0 0 3.38 35.0 L 89.18 84.53 Z"
            fill="#1DA1F2"
          />
        </svg>

        {/* Main Content */}
        <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-end px-6 pb-24 md:px-10">
          <div className="w-full">
            <h1
              className="relative leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              <span
                ref={heroTitleMeasureRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-[2.25rem] font-normal text-black dark:text-white opacity-0 md:text-4xl"
              >
                ネタツイグランプリ
              </span>
              <span
                className="block whitespace-nowrap text-[2.25rem] font-normal text-black dark:text-white md:text-4xl"
                style={
                  heroTitleFontSize
                    ? { fontSize: `${heroTitleFontSize}px` }
                    : undefined
                }
              >
                ネタツイグランプリ
              </span>
              <div
                ref={heroTaglinesRef}
                className="mt-4 inline-flex flex-col items-start"
              >
                <span className="block text-[3.25rem] font-black leading-none text-black/80 dark:text-white md:text-7xl lg:text-[5.25rem]">
                  <span className="block md:inline">Tiny</span>
                  <span className="block md:inline md:ml-2">Tweets.</span>
                </span>
                <span className="mt-2 block text-[3.25rem] font-black leading-none text-black/80 dark:text-white md:text-7xl lg:text-[5.25rem]">
                  <span className="block md:inline">Huge</span>
                  <span className="block md:inline md:ml-2">Laughs.</span>
                </span>
              </div>
            </h1>
            <Link
              href="/venue"
              className="mt-7 inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]"
            >
              参加する
            </Link>
          </div>
        </div>
      </section>

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

        const allContests = [
          ...contestsData.ongoing,
          ...contestsData.voting,
          ...contestsData.upcoming,
          ...contestsData.closed,
        ];

        const gpFinals =
          allContests.find(
            (c) => c.type === "grandprix" && c.parentContestId != null,
          ) || allContests.find((c) => c.hasQualifier === true);

        if (!gpFinals) {
          return (
            <section className="relative z-20 pt-[186px] pb-24 md:pt-20 md:pb-32">
              <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-6 md:px-10">
                <div>
                  <span className="inline-flex rounded-full px-4 py-1 text-sm font-bold text-white bg-gray-500">
                    準備中
                  </span>
                  <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
                    {renderGPTitle("第2回 ネタツイグランプリ 予選")}
                  </h2>
                  <p className="mt-5 text-sm font-medium text-black/80 dark:text-white/80 md:text-base">
                    現在準備中です。開催までしばらくお待ちください。
                  </p>
                </div>
              </div>
            </section>
          );
        }

        const gpQualifier = gpFinals.parentContestId
          ? allContests.find((c) => c.id === gpFinals.parentContestId)
          : undefined;

        const step = getGPStep(gpFinals, gpQualifier);

        const nowTime = new Date().getTime();
        const isBeforeStart = gpQualifier
          ? gpQualifier.startTime && nowTime < new Date(gpQualifier.startTime).getTime()
          : gpFinals.startTime && nowTime < new Date(gpFinals.startTime).getTime();

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
        const displayContest =
          step <= 1 && gpQualifier ? gpQualifier : gpFinals;
        const displayName = displayContest.name;

        // 投稿フォームを表示するか
        const showPostForm = step === 0 || step === 2;
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
                  {renderGPTitle(displayName)}
                </h2>
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
                    prefetch={true}
                    className="inline-flex shrink-0 items-center rounded-full bg-[#1DA1F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1788cc] md:px-7 md:py-3"
                  >
                    詳しく見る
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                  {step === 2 && gpQualifier && (
                    <Link
                      href={`/venue/${gpQualifier.id}`}
                      prefetch={true}
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

        const allContests = [
            ...contestsData.ongoing,
            ...contestsData.voting,
            ...contestsData.upcoming,
            ...contestsData.closed,
          ];
          const dailyContests = allContests.filter((c) => c.type === "daily");

          // startTime降順でソートして最新3件のみ表示
          const visibleDailies = dailyContests
            .sort(
              (a, b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix(),
            )
            .slice(0, 3);

          if (visibleDailies.length === 0) return null;

          const renderDailyCard = (
            contest: Contest,
            type: "upcoming" | "ongoing" | "voting" | "closed",
          ) => {
            const typeConfig = {
              upcoming: { label: "準備中", bg: "bg-gray-500" },
              ongoing: { label: "投稿期間", bg: "bg-[#1DA1F2]" },
              voting: { label: "投票期間", bg: "bg-green-500" },
              closed: { label: "結果発表", bg: "bg-yellow-400" },
            };
            const config = typeConfig[type];

            let timeText = "";
            if (type === "upcoming")
              timeText = `投稿開始: ${dayjs(contest.startTime).format("YYYY年MM月DD日 HH:mm")}`;
            else if (type === "ongoing")
              timeText = `投稿締切: ${dayjs(contest.endTime).format("YYYY年MM月DD日 HH:mm")}`;
            else if (type === "voting")
              timeText = `投票締切: ${dayjs(contest.votingEndTime).format("YYYY年MM月DD日 HH:mm")}`;
            else
              timeText = `開催日時：${dayjs(contest.startTime).format("YYYY年MM月DD日 HH:mm")}`;

            return (
              <RippleLink
                key={contest.id}
                href={`/venue/${contest.id}`}
                className="group relative overflow-hidden bg-white dark:bg-black py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 md:mb-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] md:px-3 md:py-1 md:text-xs font-bold text-white ${config.bg}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <h4 className="truncate text-base font-bold text-black dark:text-white md:text-2xl">
                      {contest.name}
                    </h4>
                    <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                      {timeText}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-8">
                    <div className="flex flex-col items-end md:items-start">
                      <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">
                        投稿数
                      </span>
                      <span className="text-base md:text-xl font-bold text-black dark:text-white">
                        {contest.totalPosters ?? 0}件
                      </span>
                    </div>
                  </div>
                </div>
              </RippleLink>
            );
          };

          return (
            <section className="relative z-20 pt-12 pb-20">
              <div className="mx-auto max-w-7xl px-6 md:px-10">
                <div className="mb-6 text-left">
                  <h3 className="text-2xl font-bold text-black dark:text-white md:text-[40px]">
                    デイリー
                  </h3>
                </div>
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                  {visibleDailies.map((c) =>
                    renderDailyCard(c, categorizeDaily(c)),
                  )}
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
      <section id="news" className="bg-white dark:bg-black py-24 md:py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 flex items-center justify-between px-6 md:px-10">
            <h2 className="text-2xl font-bold text-black dark:text-white md:text-[40px]">
              最新のニュース
            </h2>
            <a
              href="https://x.com/_n1gp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center rounded-full bg-[#1DA1F2] px-4 py-2 md:px-8 md:py-3 text-xs md:text-sm font-bold text-white transition hover:bg-[#1788cc]"
            >
              公式Xへ
              <ExternalLink className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
            </a>
          </div>

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex overflow-x-auto gap-6 pb-8 snap-mandatory scroll-pl-6 md:scroll-pl-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDragging ? 'snap-none cursor-grabbing' : 'snap-x cursor-grab'}`}
          >
            {/* 左端の余白 (スナップ用) */}
            <div className="snap-start flex-none w-0 md:w-4"></div>

            {newsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="snap-start flex-none w-[280px] md:w-[400px]">
                    <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                  </div>
                ))}
              </>
            ) : newsError ? (
              <p className="text-black dark:text-white">エラーが発生しました</p>
            ) : newsList.length === 0 ? (
              <p className="text-black dark:text-white">ニュースはありません</p>
            ) : (
              newsList.map((news) => (
                <div
                  key={news.id}
                  className="snap-start flex-none w-[280px] md:w-[400px] flex justify-center"
                >
                  <div className="w-full max-w-full pointer-events-none select-none">
                    <DynamicTweet id={news.tweet_id} />
                  </div>
                </div>
              ))
            )}

            {/* 右端の余白 */}
            <div className="flex-none w-0 md:w-4"></div>
          </div>
        </div>
      </section>

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
                  {contestsData?.closed
                .filter(
                  (c) =>
                    c.type === "grandprix" &&
                    (c.hasQualifier === true || c.parentContestId == null),
                )
                .sort(
                  (a, b) =>
                    dayjs(b.startTime || 0).unix() -
                    dayjs(a.startTime || 0).unix(),
                )
                .map((c) => (
                  <RippleLink
                    key={c.id}
                    href={`/venue/${c.id}`}
                    prefetch={true}
                    className="group relative overflow-hidden bg-gray-100 dark:bg-gray-900 py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-black dark:text-white md:text-2xl">
                          {c.name}
                        </h3>
                        <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                          開催日時：{dayjs(c.startTime).format("YYYY年MM月DD日 HH:mm")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-8">
                        <div className="flex flex-col items-end md:items-start">
                          <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">
                            投稿数
                          </span>
                          <span className="text-base md:text-xl font-bold text-black dark:text-white">
                            {c.totalPosters ?? 0}件
                          </span>
                        </div>
                      </div>
                    </div>
                  </RippleLink>
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

              const closedDailies = contestsData.closed
                  .filter((c) => c.type === "daily")
                  .sort(
                    (a, b) =>
                      dayjs(b.startTime).unix() - dayjs(a.startTime).unix(),
                  )
                  .slice(0, 3);

                if (closedDailies.length === 0) return null;

                return (
                  <div className="mt-16">
                    <h3 className="mb-6 text-2xl font-bold text-black dark:text-white md:text-[40px]">
                      デイリーの結果
                    </h3>
                    <div className="flex flex-col border-b border-gray-300 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700">
                      {closedDailies.map((c) => (
                        <RippleLink
                          key={c.id}
                          href={`/venue/${c.id}`}
                          prefetch={true}
                          className="group relative overflow-hidden bg-gray-100 dark:bg-gray-900 py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-base font-bold text-black dark:text-white md:text-xl">
                                {c.name}
                              </h4>
                              <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                                開催日時：{dayjs(c.startTime).format("YYYY年MM月DD日 HH:mm")}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-8">
                              <div className="flex flex-col items-end md:items-start">
                                <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">
                                  投稿数
                                </span>
                                <span className="text-base md:text-lg font-bold text-black dark:text-white">
                                  {c.totalPosters ?? 0}件
                                </span>
                              </div>
                            </div>
                          </div>
                        </RippleLink>
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
