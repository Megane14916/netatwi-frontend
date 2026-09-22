"use client";

import { Calendar, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import RippleLink from "@/components/RippleLink";
import React from 'react';
import useSWR from 'swr';
import type { ContestSummary, ContestsByStatus } from '@/types/domain';
import { contestKeys, getContests } from '@/lib/api/endpoints/contests';

const getGPStep = (gpFinals: ContestSummary, gpQualifier: ContestSummary | undefined | null) => {
  const now = dayjs();
  
  if (gpQualifier) {
    const qEnd = dayjs(gpQualifier.endTime);
    const qVoteEnd = dayjs(gpQualifier.votingEndTime);
    
    // 0. 予選投稿期間
    if (now.isBefore(qEnd)) return 0;
    
    // 1. 予選投票期間
    if (now.isBefore(qVoteEnd)) return 1;
  }
  
  // 2. 本選投稿(予選結果発表と同時)
  const end = dayjs(gpFinals.endTime);
  const voteEnd = dayjs(gpFinals.votingEndTime);
  
  if (now.isBefore(end)) return 2;
  
  // 3. 本選投票期間
  if (now.isBefore(voteEnd)) return 3;
  
  // 4. 本選結果発表
  return 4;
};

const GP_STEPS = [
  "予選投稿",
  "予選投票",
  "決勝投稿",
  "決勝投票",
  "決勝結果"
];

const renderTitle = (name: string) => {
  if (!name.includes('ネタツイグランプリ')) return name;
  const parts = name.split('ネタツイグランプリ');
  return (
    <>
      {parts[0] && <span className="block mb-1">{parts[0]}</span>}
      <span className="block">ネタツイグランプリ</span>
      {parts[1] && <span className="block mt-1">{parts[1]}</span>}
    </>
  );
};

export default function VenuePage() {
  const { data, isLoading } = useSWR<ContestsByStatus>(contestKeys.all, getContests);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
      </div>
    );
  }

  if (!data) return null;

  const { ongoing, voting, upcoming, closed } = data;
  const allContests = [...ongoing, ...voting, ...upcoming, ...closed];

  // GPの「本選(決勝)」を取得 (parentContestIdを持っているものが本選)
  // 最新のものを優先するため、idが最大のものを取得するなどしても良いが、
  // 現行のグランプリを取得する
  const gpFinals = allContests.find(c => c.type === 'grandprix' && c.parentContestId != null)
                || allContests.find(c => c.hasQualifier === true); // フォールバック

  let activeGpId = gpFinals?.id;
  let activeGpName = gpFinals?.name;
  let step = 0;
  let isBeforeStart = false;

  if (gpFinals) {
    const gpQualifier = gpFinals.parentContestId 
      ? allContests.find(c => c.id === gpFinals.parentContestId) 
      : undefined;

    step = getGPStep(gpFinals, gpQualifier);
    
    // 予選期間中(0または1)は、親コンテスト(=予選)の情報を表示する
    if ((step === 0 || step === 1) && gpQualifier) {
      activeGpId = gpQualifier.id;
      activeGpName = gpQualifier.name;
    }

    const nowTime = new Date().getTime();
    isBeforeStart = gpQualifier
      ? !!(gpQualifier.startTime && nowTime < new Date(gpQualifier.startTime).getTime())
      : !!(gpFinals.startTime && nowTime < new Date(gpFinals.startTime).getTime());
  }

  // デイリー: type === 'daily' のもののみ
  const dailyContests = allContests.filter(c => {
    if (c.type !== 'daily') return false;
    const now = dayjs();
    if (c.startTime && now.isBefore(dayjs(c.startTime))) {
      return dayjs(c.startTime).diff(now, 'hour', true) <= 1;
    }
    return true;
  });
  
  const categorizeDaily = (c: ContestSummary) => {
    const now = dayjs();
    if (c.startTime && now.isBefore(dayjs(c.startTime))) return 'upcoming';
    if (c.endTime && now.isBefore(dayjs(c.endTime))) return 'ongoing';
    if (c.votingEndTime && now.isBefore(dayjs(c.votingEndTime))) return 'voting';
    return 'closed';
  };

  const dailyUpcoming = dailyContests.filter(c => categorizeDaily(c) === 'upcoming').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());
  const dailyOngoing = dailyContests.filter(c => categorizeDaily(c) === 'ongoing').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());
  const dailyVoting = dailyContests.filter(c => categorizeDaily(c) === 'voting').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());
  const dailyClosed = dailyContests.filter(c => categorizeDaily(c) === 'closed').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());

  const categorizedDaily = [
    ...dailyUpcoming.map(c => ({ contest: c, type: 'upcoming' as const })),
    ...dailyOngoing.map(c => ({ contest: c, type: 'ongoing' as const })),
    ...dailyVoting.map(c => ({ contest: c, type: 'voting' as const })),
    ...dailyClosed.map(c => ({ contest: c, type: 'closed' as const }))
  ];
  const visibleDailies = categorizedDaily.slice(0, 5);

  const renderCard = (contest: ContestSummary, type: 'upcoming' | 'ongoing' | 'voting' | 'closed') => {
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
        prefetch={false}
        className="block group relative overflow-hidden bg-white dark:bg-black py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                {contest.totalPosters ?? 0}人
              </span>
            </div>
          </div>
        </div>
      </RippleLink>
    );
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col overflow-clip pb-20">
      
      {/* グランプリエリア */}
      {gpFinals && !isBeforeStart && (() => {
        const isPosting = step === 0 || step === 2;
        const isResults = step === 4;

        let bannerText = "";
        let bannerLink = null;
        if (step === 0) bannerText = "ただいま投稿受付中！";
        if (step === 1) bannerText = "結果発表までしばらくお待ちください。";
        if (step === 2) {
          bannerText = "予選の結果が発表されました！結果ページはこちら";
          bannerLink = "/history";
        }
        if (step === 3) bannerText = "結果発表までしばらくお待ちください。";
        if (step === 4) {
          bannerText = "決勝の結果が発表されました！結果ページはこちら";
          bannerLink = "/history";
        }

        return (
          <div className="relative w-full bg-white dark:bg-black">
            
            {/* 上部 バナー */}
            <div className="relative z-30 w-full bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 text-center py-3.5 px-4 text-[12px] md:text-[15px] font-bold">
              {bannerLink ? (
                <Link href={bannerLink} className="hover:underline flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80">
                  {bannerText} <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span>{bannerText}</span>
              )}
            </div>

            {/* タイトル・アクション背景エリア */}
            <div className="relative w-full overflow-hidden bg-[linear-gradient(15deg,#1DA1F2,#70c8f7)] py-12 md:py-20">
              {/* 背景テキスト (中央揃えのズレ解消) */}
              <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] min-w-[1000px] -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] opacity-[0.07] text-white font-black text-5xl md:text-7xl tracking-widest flex flex-col items-center justify-center gap-0 pointer-events-none select-none">
                  {Array.from({ length: 14 }).map((_, rowIndex) => (
                      <div 
                          key={rowIndex}
                          className={`h-10 md:h-16 flex items-center whitespace-nowrap gap-8 leading-none ${
                              rowIndex % 2 === 0 
                                  ? 'translate-x-0' 
                                  : 'translate-x-16 scale-y-[-1] scale-x-[-1] mt-2 md:mt-4'
                          }`}
                      >
                          {Array.from({ length: 8 }).map((_, colIndex) => (
                              <span key={colIndex}>NETATWEET GRANDPRIX</span>
                          ))}
                      </div>
                  ))}
              </div>

              {/* コンテンツ (タイトルとボタン) */}
              <div className="relative z-20 container mx-auto max-w-2xl px-4 flex flex-col justify-center h-full">
                  <h2 className="font-extrabold text-white text-left drop-shadow-md text-4xl md:text-6xl tracking-tight leading-tight mb-8">
                      {renderTitle(activeGpName || "")}
                  </h2>
                  
                  {/* アクションエリア (青背景に合わせて白ボタンに変更、サイズ縮小) */}
                  <div className="flex justify-start">
                    {isPosting && (
                      <Link href={`/venue/${activeGpId}`} prefetch={false} className="inline-block text-center bg-white text-[#1DA1F2] font-bold px-8 py-2.5 rounded-full hover:bg-gray-50 transition-colors text-[14px]">
                        投稿する
                      </Link>
                    )}
                    {isResults && (
                      <Link href={`/venue/${activeGpId}`} prefetch={false} className="inline-block text-center bg-white text-[#1DA1F2] font-bold px-8 py-2.5 rounded-full hover:bg-gray-50 transition-colors text-[14px]">
                        結果を見る
                      </Link>
                    )}
                  </div>
              </div>
            </div>
            {/* タイムライン */}
            <div className="mt-2 mb-12 w-full flex justify-center overflow-hidden">
              <div className="flex w-full">
                {GP_STEPS.map((stepName, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === GP_STEPS.length - 1;
                  const isActive = step === idx;
                  const isPast = step > idx;

                  const bgClass = isActive 
                    ? 'bg-[#1DA1F2] text-white' 
                    : isPast 
                      ? 'bg-[#1DA1F2]/20 text-[#1DA1F2]' 
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600';

                  const cut = 12;
                  const clipPath = isFirst 
                    ? `polygon(0% 0%, calc(100% - ${cut}px) 0%, 100% 50%, calc(100% - ${cut}px) 100%, 0% 100%)`
                    : isLast
                    ? `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${cut}px 50%)`
                    : `polygon(0% 0%, calc(100% - ${cut}px) 0%, 100% 50%, calc(100% - ${cut}px) 100%, 0% 100%, ${cut}px 50%)`;

                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 flex items-center justify-center py-2 md:py-3 text-[9px] sm:text-[11px] md:text-[13px] font-extrabold transition-all ${bgClass}`}
                      style={{ 
                        clipPath, 
                        marginLeft: isFirst ? '0' : '-6px',
                        paddingLeft: isFirst ? '4px' : `${cut + 4}px`,
                        paddingRight: isLast ? '4px' : `${cut + 2}px`,
                      }}
                    >
                      <span className="whitespace-nowrap text-center break-keep leading-tight">{stepName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })()}

      <div className="container mx-auto max-w-[672px] px-4 mt-12">
        {/* デイリーエリア */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2">
            <Calendar className="w-7 h-7 text-[#1DA1F2]" />
            <h2 className="text-2xl font-bold text-black dark:text-white">デイリー</h2>
          </div>
          
          <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800 mb-4">
            {visibleDailies.map(({ contest, type }) => renderCard(contest, type))}
            
            {visibleDailies.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-center py-10 bg-gray-50 dark:bg-gray-950">
                <p>現在開催中のデイリー大会はありません。</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 mb-8">
            <Link
              href="/history"
              className="inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]"
            >
              全ての結果を見る
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
        
      </div>
    </div>
  );
}
