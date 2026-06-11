import { Timer, Zap, Calendar, CheckSquare, Trophy, Users, CheckCircle, UserStar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import Countdown from '@/components/venue/Countdown';
import React from 'react';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

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
  qualifierStartTime: string | null;
  qualifierEndTime: string | null;
  qualifierVotingEndTime: string | null;
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

interface LatestResult {
  contest_id: number;
  contest_name: string;
  theme: string | null;
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

interface ContestsResponse {
  ongoing: Contest[];
  voting: Contest[];
  upcoming: Contest[];
  closed: Contest[];
  latestResult: LatestResult | null;
}

const getGPStep = (gpFinals: Contest, gpQualifier: Contest | undefined | null) => {
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

async function getContestsData(): Promise<ContestsResponse> {
  try {
    const res = await fetch(`${API_URL}/api/contests`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch contests');
    return res.json();
  } catch (error) {
    console.error(error);
    return { ongoing: [], voting: [], upcoming: [], closed: [], latestResult: null };
  }
}

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

export default async function VenuePage() {
  const data = await getContestsData();
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
  }

  // 日めくり: type === 'daily' のもののみ
  const dailyContests = allContests.filter(c => c.type === 'daily');
  
  const categorizeDaily = (c: Contest) => {
    const now = dayjs();
    if (c.endTime && now.isBefore(dayjs(c.endTime))) return 'ongoing';
    if (c.votingEndTime && now.isBefore(dayjs(c.votingEndTime))) return 'voting';
    return 'closed';
  };

  const dailyOngoing = dailyContests.filter(c => categorizeDaily(c) === 'ongoing').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());
  const dailyVoting = dailyContests.filter(c => categorizeDaily(c) === 'voting').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());
  const dailyClosed = dailyContests.filter(c => categorizeDaily(c) === 'closed').sort((a,b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());

  const visibleClosed = dailyClosed.slice(0, 3);
  const hasMoreClosed = dailyClosed.length > 3;

  const renderCard = (contest: Contest, type: 'ongoing' | 'voting' | 'closed') => {
    const typeConfig = {
       ongoing: { label: '投稿期間', bg: 'bg-[#1DA1F2]', color: 'text-white' },
       voting: { label: '投票期間', bg: 'bg-green-500', color: 'text-white' },
       closed: { label: '結果発表', bg: 'bg-yellow-400', color: 'text-white' }
    };
    
    const config = typeConfig[type];

    let timeText = "";
    if (type === 'ongoing') {
      timeText = `投稿締切: ${dayjs(contest.endTime).format('YYYY年MM月DD日 HH:mm')}`;
    } else if (type === 'voting') {
      timeText = `投票締切: ${dayjs(contest.votingEndTime).format('YYYY年MM月DD日 HH:mm')}`;
    } else {
      timeText = `${dayjs(contest.startTime).format('YYYY年MM月DD日 HH:mm')} 開催`;
    }

    return (
       <Link
          key={contest.id}
          href={`/venue/${contest.id}`}
          className="group relative overflow-hidden bg-white px-4 py-4 transition-colors duration-300 hover:text-white md:px-6 md:py-5 flex flex-col"
       >
          <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
          
          <div className="relative z-10 flex flex-row items-center justify-between gap-4">
             <div>
                <div className={`self-start inline-block px-2.5 py-0.5 text-xs font-bold rounded-full mb-2 transition-colors duration-300 ${config.bg} ${config.color} group-hover:bg-white group-hover:text-[#1DA1F2]`}>
                   {config.label}
                </div>
                <h4 className="text-lg font-bold text-black transition-colors group-hover:text-white md:text-xl">{contest.name}</h4>
                <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-white/80">
                {timeText}
                </p>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-end md:items-start">
                <span className="text-xs font-medium text-black/60 transition-colors group-hover:text-white/80">
                   投稿数
                </span>
                <span className="text-lg font-bold text-black transition-colors group-hover:text-white">
                   {contest.totalPosters ?? 0}件
                </span>
                </div>
             </div>
          </div>
       </Link>
    );
  };

  return (
    <div className="relative min-h-screen bg-white text-black flex flex-col overflow-clip pb-20">
      
      {/* グランプリエリア */}
      {gpFinals && (() => {
        const isPosting = step === 0 || step === 2;
        const isVoting = step === 1 || step === 3;
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
          <div className="relative w-full bg-white">
            
            {/* 上部 バナー */}
            <div className="relative z-30 w-full bg-gray-50 text-gray-800 text-center py-3.5 px-4 text-[15px] font-bold">
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
                      <Link href={`/venue/${activeGpId}`} className="inline-block text-center bg-white text-[#1DA1F2] font-bold px-8 py-2.5 rounded-full hover:bg-gray-50 transition-colors text-[14px]">
                        投稿する
                      </Link>
                    )}
                    {isResults && (
                      <Link href={`/venue/${activeGpId}`} className="inline-block text-center bg-white text-[#1DA1F2] font-bold px-8 py-2.5 rounded-full hover:bg-gray-50 transition-colors text-[14px]">
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
                      : 'bg-gray-100 text-gray-400';

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
        {/* 日めくりエリア */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2">
            <Calendar className="w-7 h-7 text-[#1DA1F2]" />
            <h2 className="text-2xl font-extrabold text-black">日めくりコンテスト</h2>
          </div>
          
          <div className="flex flex-col border-b border-[#1DA1F2] divide-y divide-[#1DA1F2] mb-4">
            {dailyOngoing.map(c => renderCard(c, 'ongoing'))}
            {dailyVoting.map(c => renderCard(c, 'voting'))}
            {visibleClosed.map(c => renderCard(c, 'closed'))}
            
            {dailyOngoing.length === 0 && dailyVoting.length === 0 && visibleClosed.length === 0 && (
              <div className="text-gray-500 text-center py-10 bg-gray-50">
                <p>現在開催中の日めくり大会はありません。</p>
              </div>
            )}
          </div>

          {hasMoreClosed && (
            <div className="flex justify-end mt-4 mb-8">
              <Link href="/history" className="inline-block px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">
                全ての結果を見る
              </Link>
            </div>
          )}
        </section>
        
      </div>
    </div>
  );
}