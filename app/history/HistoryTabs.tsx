'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { History } from 'lucide-react';
import RippleLink from "@/components/RippleLink";

interface Contest {
  id: number;
  name: string;
  theme: string | null;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  totalPosters?: number;
  type?: string;
}

export default function HistoryTabs({ contests }: { contests: Contest[] }) {
  const [activeTab, setActiveTab] = useState<'grandprix' | 'daily'>('grandprix');

  const grandprixContests = contests.filter((c) => c.type === 'grandprix' || (!c.type && !c.name.includes('デイリー')));
  const dailyContests = contests.filter((c) => c.type === 'daily' || (!c.type && c.name.includes('デイリー')));

  const renderContestCard = (contest: Contest) => (
    <RippleLink
      key={contest.id}
      href={`/venue/${contest.id}`}
      prefetch={false}
      className="block group relative overflow-hidden bg-white dark:bg-black py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-bold text-black dark:text-white md:text-xl">
            {contest.name}
          </h4>
          <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
            開催日時：{dayjs(contest.startTime).format("YYYY年MM月DD日 HH:mm")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-8">
          <div className="flex flex-col items-end md:items-start">
            <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">
              投稿数
            </span>
            <span className="text-base md:text-lg font-bold text-black dark:text-white">
              {contest.totalPosters ?? 0}件
            </span>
          </div>
        </div>
      </div>
    </RippleLink>
  );

  return (
    <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white">
      <div className="container mx-auto max-w-[672px] px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 pb-2 flex items-center">
          <History className="h-8 w-8 mr-3 text-[#1DA1F2]" />
          過去ログ
        </h1>

        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${
              activeTab === 'grandprix'
                ? 'text-[#1DA1F2] border-b-4 border-[#1DA1F2]'
                : 'text-gray-400 dark:text-gray-600 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab('grandprix')}
          >
            グランプリ
          </button>
          <button
            className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${
              activeTab === 'daily'
                ? 'text-[#1DA1F2] border-b-4 border-[#1DA1F2]'
                : 'text-gray-400 dark:text-gray-600 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            デイリー
          </button>
        </div>

        <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
          {activeTab === 'grandprix' && (
            <>
              {grandprixContests.map(renderContestCard)}
              {/* 第1回ネタツイグランプリ (note) */}
              <a
                href="https://note.com/ed_nt/n/ne39d454eafb1?magazine_key=m725c32beb85d"
                target="_blank"
                rel="noopener noreferrer"
                className="block group relative overflow-hidden bg-white dark:bg-black py-6 px-3 md:p-8 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-bold text-black dark:text-white md:text-xl">
                      第1回ネタツイグランプリ
                    </h4>
                    <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                      外部サイト(note.com)へ移動します
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-8">
                    <div className="flex flex-col items-end md:items-start">
                      <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">
                        投稿数
                      </span>
                      <span className="text-base md:text-lg font-bold text-black dark:text-white">
                        324件
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </>
          )}

          {activeTab === 'daily' && (
            <>
              {dailyContests.length > 0 ? (
                dailyContests.map(renderContestCard)
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-10 bg-gray-50 dark:bg-gray-950">
                  <p>終了したデイリー大会はまだありません。</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
