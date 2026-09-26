"use client";

import { Calendar, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useContests } from '@/hooks/api/useContests';
import { ContestCard } from '@/features/contests/components/ContestCard';
import { ContestTitle } from '@/features/contests/components/ContestTitle';
import {
  GRAND_PRIX_STEPS,
  flattenContests,
  getGrandPrixProgress,
  getVisibleDailyContests,
} from '@/features/contests/model/contestPresentation';

export default function VenuePage() {
  const { data, isLoading } = useContests();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
      </div>
    );
  }

  if (!data) return null;

  const allContests = flattenContests(data);
  const grandPrix = getGrandPrixProgress(allContests);
  const gpFinals = grandPrix?.finals;
  const activeGpId = grandPrix?.displayContest.id;
  const activeGpName = grandPrix?.displayContest.name;
  const step = grandPrix?.step ?? 0;
  const isBeforeStart = grandPrix?.isBeforeStart ?? false;
  const visibleDailies = getVisibleDailyContests(allContests, 5);

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
                      <ContestTitle name={activeGpName || ""} spaced />
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
                {GRAND_PRIX_STEPS.map((stepName, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === GRAND_PRIX_STEPS.length - 1;
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
            {visibleDailies.map(({ contest, status }) => (
              <ContestCard key={contest.id} contest={contest} status={status} countSuffix="人" />
            ))}
            
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
