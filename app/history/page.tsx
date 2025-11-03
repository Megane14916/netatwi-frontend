'use client';

import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import dayjs from 'dayjs'; // 日付比較のためにdayjsをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Contestの型定義 (会場ページと同じ)
interface Contest {
  id: number;
  name: string;
  theme: string;
  startTime: string;
  endTime: string;
  votingEndTime: string;
}

// APIレスポンス全体の型定義を追加
interface ContestsApiResponse {
    ongoing: Contest[];
    voting: Contest[];
    upcoming: Contest[];
    closed: Contest[]; // 終了済み大会のリスト
    latestResult: any | null; // latestResultの型はここでは使わないのでany
}

export default function PastLogsPage() {
  const [pastContests, setPastContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPastContests = async () => {
      try {
        const response = await fetch(`${API_URL}/api/contests`, { credentials: 'include' }); // URL修正
        if (!response.ok) {
          throw new Error('大会情報の取得に失敗しました。');
        }
        const data: ContestsApiResponse = await response.json();
        const closedContests = data.closed || [];
        closedContests.sort((a, b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix());
        setPastContests(closedContests);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchPastContests();
  }, []);

  // ローディング表示
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">過去ログ</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-800 rounded-lg"></div>
          <div className="h-20 bg-gray-800 rounded-lg"></div>
          <div className="h-20 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">エラー</h1>
        <p className="text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2 flex items-center">
        <History className="h-8 w-8 mr-3 text-gray-400" />
        過去ログ
      </h1>

      {pastContests.length > 0 ? (
        <div className="space-y-4">
          {pastContests.map((contest) => (
            // 結果ページへのリンク (まだ作成していないため # で代用)
            <a key={contest.id} href={`/venue/${contest.id}`} className="block bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors duration-300 shadow">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-300">{contest.name}</h2>
                <span className="text-sm text-gray-500">
                  {/* 開催日時を表示 */}
                  {dayjs(contest.startTime).format('YYYY年MM月DD日 HH:mm')} 開催
                </span>
              </div>
              <p className="text-gray-400 mt-1 line-clamp-1">お題: {contest.theme}</p>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">終了した大会はまだありません。</p>
      )}
    </div>
  );
}
