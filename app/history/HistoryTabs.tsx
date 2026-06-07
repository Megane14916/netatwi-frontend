'use client';

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { History } from 'lucide-react';

interface Contest {
  id: number;
  name: string;
  theme: string | null;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  totalPosters?: number;
}

export default function HistoryTabs({ contests }: { contests: Contest[] }) {
  const [activeTab, setActiveTab] = useState<'grandprix' | 'daily'>('grandprix');

  const grandprixContests = contests.filter((c) => !c.name.includes('日めくり'));
  const dailyContests = contests.filter((c) => c.name.includes('日めくり'));

  const renderContestCard = (contest: Contest) => (
    <Link
      key={contest.id}
      href={`/venue/${contest.id}`}
      className="group relative overflow-hidden bg-white px-4 py-3 transition-colors duration-300 hover:text-white md:px-6 md:py-4"
    >
      <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
      <div className="relative z-10 flex flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-black transition-colors group-hover:text-white md:text-xl">{contest.name}</h4>
          <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-white/80">
            {dayjs(contest.startTime).format('YYYY年MM月DD日 HH:mm')} 開催
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

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="container mx-auto max-w-[672px] px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 pb-2 flex items-center">
          <History className="h-8 w-8 mr-3 text-[#1DA1F2]" />
          過去ログ
        </h1>

        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${
              activeTab === 'grandprix'
                ? 'text-[#1DA1F2] border-b-4 border-[#1DA1F2]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab('grandprix')}
          >
            グランプリ
          </button>
          <button
            className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${
              activeTab === 'daily'
                ? 'text-[#1DA1F2] border-b-4 border-[#1DA1F2]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            日めくり
          </button>
        </div>

        <div className="flex flex-col border-b border-[#1DA1F2] divide-y divide-[#1DA1F2]">
          {activeTab === 'grandprix' && (
            <>
              {grandprixContests.map(renderContestCard)}
              {/* 第1回 ネタツイグランプリ (note) */}
              <a
                href="https://note.com/ed_nt/n/ne39d454eafb1?magazine_key=m725c32beb85d"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden bg-white px-4 py-3 transition-colors duration-300 hover:text-white md:px-6 md:py-4"
              >
                <div className="absolute inset-0 z-0 origin-top -translate-y-full bg-[#1DA1F2] transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <div className="relative z-10 flex flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-black transition-colors group-hover:text-white md:text-xl">第1回 ネタツイグランプリ</h4>
                    <p className="mt-1 text-sm text-gray-500 transition-colors group-hover:text-white/80">
                      外部サイト(note.com)へ移動します
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end md:items-start">
                      <span className="text-xs font-medium text-black/60 transition-colors group-hover:text-white/80">
                        投稿数
                      </span>
                      <span className="text-lg font-bold text-black transition-colors group-hover:text-white">324件</span>
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
                <div className="text-gray-500 text-center py-10 bg-gray-50">
                  <p>終了した日めくり大会はまだありません。</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
