"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Clock3,
  ExternalLink,
  Users,
  Heart,
  Bookmark,
  MessageCircle,
  Repeat2,
  BarChart2,
  Calendar,
  Loader2,
} from "lucide-react";
import { Tweet } from "react-tweet";
import dayjs from "dayjs";
import PostForm from "@/components/venue/PostForm";

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

interface TimelinePostMock {
  id: number;
  userName: string;
  screenName: string;
  body: string;
  postedAt: string;
}

const timelinePostsMock: TimelinePostMock[] = [
  {
    id: 1,
    userName: "匿名さん",
    screenName: "@user_a",
    body: "このお題、深夜テンションで考えると急に天才になった気がする。",
    postedAt: "1時間前",
  },
  {
    id: 2,
    userName: "匿名さん",
    screenName: "@user_b",
    body: "投票してたら笑いすぎて、結局どれも優勝させたくなってしまう。",
    postedAt: "2時間前",
  },
  {
    id: 3,
    userName: "匿名さん",
    screenName: "@user_c",
    body: "「文字数が足りない」より「勢いが足りない」が一番こわい。",
    postedAt: "3時間前",
  },
  {
    id: 4,
    userName: "匿名さん",
    screenName: "@user_d",
    body: "結果発表の日だけ通知音をドラムロールにしてほしい。",
    postedAt: "5時間前",
  },
];

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
  if (c.endTime && now.isBefore(dayjs(c.endTime))) return "ongoing";
  if (c.votingEndTime && now.isBefore(dayjs(c.votingEndTime))) return "voting";
  return "closed";
};

const formatDateTime = (dt: string | null) => {
  if (!dt) return "";
  return dayjs(dt).format("MM/DD HH:mm");
};

function HeroTimelineGroup() {
  return (
    <div className="flex flex-col">
      {timelinePostsMock.map((post) => (
        <article
          key={post.id}
          className="flex h-[160px] w-full flex-col justify-center border-b border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 sm:p-4"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-none">
              <div className="block transition-opacity hover:opacity-80">
                <div className="h-8 w-8 rounded-full border border-gray-200 bg-gray-300 sm:h-10 sm:w-10" />
              </div>
            </div>
            <div className="min-w-0 flex-grow">
              <div className="mb-1 flex items-start justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <span className="truncate text-sm font-bold leading-tight text-black hover:underline sm:text-base">
                    {post.userName}
                  </span>
                  <span
                    className="truncate text-xs text-gray-500 sm:text-sm"
                    style={{ flexShrink: 1000 }}
                  >
                    {post.screenName}
                  </span>
                </div>
              </div>
              <div>
                <p className="whitespace-pre-wrap text-xs text-black/90 sm:text-sm">
                  {post.body}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-gray-400">
                <button
                  type="button"
                  aria-label="コメント"
                  className="group -ml-2 flex items-center focus:outline-none"
                >
                  <div className="rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-500 sm:p-2">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="リポスト"
                  className="group flex items-center focus:outline-none"
                >
                  <div className="rounded-full p-1.5 transition-colors group-hover:bg-green-500/10 group-hover:text-green-500 sm:p-2">
                    <Repeat2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="いいね"
                  className="group flex items-center focus:outline-none"
                >
                  <div className="rounded-full p-1.5 transition-colors group-hover:bg-pink-500/10 group-hover:text-pink-500 sm:p-2">
                    <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="インプレッション"
                  className="group flex items-center focus:outline-none"
                >
                  <div className="rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-500 sm:p-2">
                    <BarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="ブックマーク"
                  className="group -mr-2 flex items-center focus:outline-none"
                >
                  <div className="rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-500 sm:p-2">
                    <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function HeroTimelineRail() {
  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      setStep((prev) => {
        // シームレスな無限ループ：ステップ16に達したら、見た目が全く同じ1グループ前(ステップ12)に一瞬で戻す
        if (prev === 16) {
          setIsTransitioning(false);
          setTimeout(() => {
            setIsTransitioning(true);
            setStep(13);
          }, 50);
          return 12;
        }
        return prev + 1;
      });

      // ▼ ここの数値を変更するとスクロールの間隔が変わります
      const minDelay = 500; // 最小間隔 (0.1秒)
      const maxDelay = 2000; // 最大間隔 (0.3秒)
      const nextDelay =
        Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      timeoutId = setTimeout(tick, nextDelay);
    };

    const initialDelay = 50; // マウント直後に動き出すように短く設定
    timeoutId = setTimeout(tick, initialDelay);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="pt-12 h-full w-full bg-white overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, white 5%, white 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, white 5%, white 100%)",
      }}
    >
      <div
        className="flex flex-col w-full max-w-full border-l border-gray-200 lg:w-[600px]"
        style={{
          transform: `translateY(calc(100dvh - ${step * 160}px))`,
          transition: isTransitioning
            ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      >
        <HeroTimelineGroup />
        <HeroTimelineGroup />
        <HeroTimelineGroup />
        <HeroTimelineGroup />
        <HeroTimelineGroup />
        <HeroTimelineGroup />
      </div>
    </div>
  );
}

function TimelineRail({ direction }: { direction: "up" | "down" }) {
  const timeline = [...timelinePostsMock, ...timelinePostsMock];

  return (
    <div className={`timeline-rail timeline-${direction}`}>
      <div className="timeline-track">
        {timeline.map((post, index) => (
          <article
            key={`${post.id}-${index}`}
            className="w-[270px] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-300" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-black">
                  {post.userName}
                </p>
                <p className="truncate text-xs text-black/55">
                  {post.screenName}
                </p>
              </div>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-black/85">
              {post.body}
            </p>
            <p className="text-xs text-black/50">{post.postedAt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const heroTitleMeasureRef = useRef<HTMLSpanElement | null>(null);
  const heroTaglinesRef = useRef<HTMLDivElement | null>(null);
  const [heroTitleFontSize, setHeroTitleFontSize] = useState<number | null>(
    null,
  );

  const [newsList, setNewsList] = useState<{ id: number; tweet_id: string }[]>(
    [],
  );
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);

  const [contestsData, setContestsData] = useState<ContestsResponse | null>(
    null,
  );
  const [contestsLoading, setContestsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const data = await res.json();
          setNewsList(data);
        } else {
          setNewsError(true);
        }
      } catch (e) {
        setNewsError(true);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await fetch("/api/contests");
        if (res.ok) {
          const data = await res.json();
          setContestsData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setContestsLoading(false);
      }
    };
    fetchContests();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="relative bg-white text-black">
      <section className="relative z-0 flex h-[calc(100vh-4rem)] min-h-[640px] items-center bg-white">
        {/* Top Left Separator */}
        <svg
          className="pointer-events-none absolute left-0 top-0 z-10 w-[50vw] lg:w-[33.333vw]"
          viewBox="0 0 100 26.8"
        >
          <polygon points="0,0 100,0 0,26.8" fill="#1DA1F2" />
        </svg>

        {/* Right Timeline */}
        <div className="absolute bottom-0 right-0 top-0 z-0 w-[55.56vw] overflow-hidden lg:w-[600px]">
          <HeroTimelineRail />
        </div>

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
                className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-[1.75rem] font-normal text-black opacity-0 md:text-4xl"
              >
                ネタツイグランプリ
              </span>
              <span
                className="block whitespace-nowrap text-[1.75rem] font-normal text-black md:text-4xl"
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
                <span className="block text-[2.5rem] font-black leading-none text-black/80 md:text-7xl lg:text-[5.25rem]">
                  <span className="block md:inline">Tiny</span>
                  <span className="block md:inline md:ml-2">Tweets.</span>
                </span>
                <span className="mt-2 block text-[2.5rem] font-black leading-none text-black/80 md:text-7xl lg:text-[5.25rem]">
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
            <section className="relative z-20 py-20">
              <div className="mx-auto max-w-7xl px-6 md:px-10 flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
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

        if (!gpFinals) return null;

        const gpQualifier = gpFinals.parentContestId
          ? allContests.find((c) => c.id === gpFinals.parentContestId)
          : undefined;

        const step = getGPStep(gpFinals, gpQualifier);

        // ステータスバッジ
        const statusConfig: Record<number, { label: string; color: string }> = {
          0: { label: "投稿受付中", color: "bg-[#1DA1F2]" },
          1: { label: "審査員投票中", color: "bg-green-500" },
          2: { label: "予選結果発表 & 決勝投稿開始", color: "bg-[#1DA1F2]" },
          3: { label: "審査員投票中", color: "bg-green-500" },
          4: { label: "結果発表！", color: "bg-yellow-400" },
        };
        const { label: statusLabel, color: statusColor } = statusConfig[step];

        // 参加人数
        const participants =
          step <= 1 && gpQualifier
            ? (gpQualifier.totalPosters ?? 0)
            : (gpFinals.totalPosters ?? 0);

        // 残り時間
        const getRemainingTime = (deadline: string | null): string => {
          if (!deadline) return "";
          const diff = new Date(deadline).getTime() - currentTime.getTime();
          if (diff <= 0) return "締切済み";
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          return h > 0 ? `${h}時間${m}分${s}秒` : `${m}分${s}秒`;
        };

        const deadlineMap: Record<number, string | null> = {
          0: gpQualifier?.endTime ?? null,
          1: gpQualifier?.votingEndTime ?? null,
          2: gpFinals.endTime,
          3: gpFinals.votingEndTime,
          4: null,
        };
        const remainingTime = deadlineMap[step]
          ? getRemainingTime(deadlineMap[step])
          : null;

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
          <section className="relative z-20 py-20">
            <div
              className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 md:px-10 ${showPostForm ? "lg:grid-cols-[minmax(0,1fr)_600px]" : ""}`}
            >
              <div>
                <span
                  className={`inline-flex rounded-full px-4 py-1 text-sm font-bold text-white ${statusColor}`}
                >
                  {statusLabel}
                </span>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
                  {renderGPTitle(displayName)}
                </h2>
                <p className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-black/80 md:text-base">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#1DA1F2]" />
                    参加人数:{" "}
                    <span className="font-bold text-[#1DA1F2]">
                      {participants}人
                    </span>
                  </span>
                  {remainingTime && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-[#1DA1F2]" />
                      残り時間:{" "}
                      <span className="font-bold text-[#1DA1F2]">
                        {remainingTime}
                      </span>
                    </span>
                  )}
                </p>
                <div className="mt-3 space-y-1 text-sm text-black/70 md:text-base">
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
                <Link
                  href={`/venue/${displayContest.id}`}
                  className="mt-7 inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]"
                >
                  詳しく見る
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
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
      {contestsData &&
        (() => {
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
            type: "ongoing" | "voting" | "closed",
          ) => {
            const typeConfig = {
              ongoing: { label: "投稿受付中", bg: "bg-[#1DA1F2]" },
              voting: { label: "投票受付中", bg: "bg-green-500" },
              closed: { label: "結果発表", bg: "bg-yellow-400" },
            };
            const config = typeConfig[type];

            let timeText = "";
            if (type === "ongoing")
              timeText = `投稿締切: ${dayjs(contest.endTime).format("YYYY年MM月DD日 HH:mm")}`;
            else if (type === "voting")
              timeText = `投票締切: ${dayjs(contest.votingEndTime).format("YYYY年MM月DD日 HH:mm")}`;
            else
              timeText = `${dayjs(contest.startTime).format("YYYY年MM月DD日 HH:mm")} 開催`;

            return (
              <Link
                key={contest.id}
                href={`/venue/${contest.id}`}
                className="group relative overflow-hidden bg-white p-6 md:p-8 transition-colors duration-300 hover:text-white"
              >
                <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white transition-colors group-hover:bg-white group-hover:text-[#1DA1F2] ${config.bg}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <h4 className="text-2xl font-bold text-black transition-colors group-hover:text-white">
                      {contest.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-white/80">
                      {timeText}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 self-end md:self-auto">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-black/60 transition-colors group-hover:text-white/80">
                        投稿数
                      </span>
                      <span className="text-xl font-bold text-black transition-colors group-hover:text-white">
                        {contest.totalPosters ?? 0}件
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          };

          return (
            <section className="relative z-20 pt-12 pb-20">
              <div className="mx-auto max-w-7xl px-6 md:px-10">
                <div className="mb-6 text-left">
                  <h3 className="text-[24px] font-bold text-black">
                    日めくりコンテストも開催中！
                  </h3>
                </div>
                <div className="flex flex-col border-b border-[#1DA1F2] divide-y divide-[#1DA1F2]">
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
        className="w-full text-[#1DA1F2]"
        aria-hidden="true"
        style={{ marginBottom: "-1px" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 17.63"
          className="block w-full"
        >
          <polygon points="0,17.63 100,0 100,17.63" fill="currentColor" />
        </svg>
      </div>

      <section className="flex h-screen items-center bg-[#1DA1F2] px-6 text-white md:block md:h-auto md:px-10 md:pb-[112px] md:pt-[50px]">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-[40px] font-extrabold">ネタツイグランプリとは</h3>
          <div className="mx-auto mt-8 inline-block max-w-3xl text-center text-base leading-relaxed md:text-lg">
            <p className="mb-2">
              ネタツイグランプリは、一番面白いネタツイを決める大会です！
            </p>
            <p className="mb-2">投稿は1人1つ、140字と画像4枚。</p>
            <p className="mb-2">
              <strong className="font-bold">
                既に自分でしたことのあるツイート
              </strong>
              や、
              <strong className="font-bold">他人のツイートを投稿する</strong>
              のは<strong className="font-bold">禁止</strong>です。
            </p>
            <p className="mb-2">
              大会期間内に、
              <strong className="font-bold">
                同じ内容のものをXに投稿すること
              </strong>
              も<strong className="font-bold">禁止</strong>です。
            </p>
            <p className="mb-2">
              審査は一般投票と豪華審査員によって行われます！
            </p>
            <p className="mb-2">
              優勝から最下位まで、
              <strong className="font-bold">全て公開</strong>します。
            </p>
            <p className="mb-2">
              審査員それぞれが一番面白いと思ったネタツイには
              <strong className="font-bold">審査員特別賞</strong>が贈られます！
            </p>
            <p>誰でも奮ってご参加ください！</p>
          </div>
          <div className="mt-10">
            <Link
              href="/rules"
              className="inline-flex items-center rounded-full border border-white px-8 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#1DA1F2]"
            >
              ルールを詳しく見る
            </Link>
          </div>
        </div>
      </section>

      {/* ニュースセクション */}
      <section className="bg-[#1DA1F2] px-6 pt-16 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-[40px] font-bold text-white">
            最新のニュース
          </h2>

          <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory">
            {newsLoading ? (
              <p className="text-white">読み込み中...</p>
            ) : newsError ? (
              <p className="text-white">エラーが発生しました</p>
            ) : newsList.length === 0 ? (
              <p className="text-white">ニュースはありません</p>
            ) : (
              newsList.map((news) => (
                <div
                  key={news.id}
                  className="snap-start flex-none w-[320px] md:w-[400px] flex justify-center"
                >
                  <div className="w-full max-w-full">
                    <Tweet id={news.tweet_id} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <a
              href="https://x.com/netatwi_gp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-bold text-[#1DA1F2] shadow-md transition hover:bg-gray-100"
            >
              公式Xへ
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#1DA1F2] pr-6 pt-16 pb-0 md:pr-[96px]">
        <div className="relative w-full overflow-hidden rounded-tr-[48px] bg-white px-6 pb-24 pt-16 md:px-16 lg:px-24">
          <div className="relative z-10">
            <h2 className="text-[40px] font-bold text-black">
              過去のグランプリの結果
            </h2>

            <div className="mt-12 flex flex-col border-b border-[#1DA1F2] divide-y divide-[#1DA1F2]">
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
                  <Link
                    key={c.id}
                    href={`/venue/${c.id}`}
                    className="group relative overflow-hidden bg-white px-4 py-4 transition-colors duration-300 hover:text-white md:px-6 md:py-6"
                  >
                    <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-black transition-colors group-hover:text-white md:text-2xl">
                          {c.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-8 self-end md:self-auto">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-black/60 transition-colors group-hover:text-white/80">
                            投稿数
                          </span>
                          <span className="text-xl font-bold text-black transition-colors group-hover:text-white">
                            {c.totalPosters ?? 0}件
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

              {/* 第1回は固定リンク (DBに存在しないnote.com外部データ) — 最下部に固定 */}
              <a
                href="https://note.com/ed_nt/n/ne39d454eafb1?magazine_key=m725c32beb85d"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden bg-white px-4 py-4 transition-colors duration-300 hover:text-white md:px-6 md:py-6"
              >
                <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-black transition-colors group-hover:text-white md:text-2xl">
                      第1回 ネタツイグランプリ (note)
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 transition-colors group-hover:text-white/80">
                      外部サイト(note.com)へ移動します
                    </p>
                  </div>
                  <div className="flex items-center gap-8 self-end md:self-auto">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-black/60 transition-colors group-hover:text-white/80">
                        投稿数
                      </span>
                      <span className="text-xl font-bold text-black transition-colors group-hover:text-white">
                        324件
                      </span>
                    </div>
                    <ExternalLink className="h-6 w-6 text-gray-400 transition-colors group-hover:text-white" />
                  </div>
                </div>
              </a>
            </div>

            {/* 日めくりの結果 */}
            {contestsData &&
              (() => {
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
                    <h3 className="mb-6 text-2xl font-bold text-black">
                      日めくりコンテストの結果
                    </h3>
                    <div className="flex flex-col border-b border-[#1DA1F2] divide-y divide-[#1DA1F2]">
                      {closedDailies.map((c) => (
                        <Link
                          key={c.id}
                          href={`/venue/${c.id}`}
                          className="group relative overflow-hidden bg-white px-4 py-3 transition-colors duration-300 hover:text-white md:px-6 md:py-4"
                        >
                          <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
                          <div className="relative z-10 flex flex-row items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-bold text-black transition-colors group-hover:text-white md:text-xl">
                                {c.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="flex flex-col items-end md:items-start">
                                <span className="text-xs font-medium text-black/60 transition-colors group-hover:text-white/80">
                                  投稿数
                                </span>
                                <span className="text-lg font-bold text-black transition-colors group-hover:text-white">
                                  {c.totalPosters ?? 0}件
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
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
