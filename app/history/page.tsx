import { History, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';

// --- API_URLの設定 ---
// Server Componentなので、内部通信用のBACKEND_URLを使用
// (クライアント用の NEXT_PUBLIC_API_URL は使用しない)
const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

// 型定義
interface Contest {
  id: number;
  name: string;
  theme: string | null;
  startTime: string;
  endTime: string;
  votingEndTime: string;
}

interface ContestsApiResponse {
  ongoing: Contest[];
  voting: Contest[];
  upcoming: Contest[];
  closed: Contest[];
  latestResult: any;
}

// データを取得する非同期関数
async function getPastContests(): Promise<Contest[]> {
  try {
    // next: { revalidate: 60 } で60秒間キャッシュする
    const res = await fetch(`${API_URL}/api/contests`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch contests');
    }

    const data: ContestsApiResponse = await res.json();
    // 終了した大会(closed)のみを返す
    return data.closed || [];
  } catch (error) {
    console.error('Error fetching past contests:', error);
    return [];
  }
}

export default async function PastLogsPage() {
  const pastContests = await getPastContests();

  // 念のため開催日時で降順ソート (API側でもされているが確実にするため)
  const sortedContests = [...pastContests].sort(
    (a, b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2 flex items-center">
        <History className="h-8 w-8 mr-3 text-gray-400" />
        過去ログ
      </h1>

      {sortedContests.length > 0 ? (
        <div className="space-y-4">
          {sortedContests.map((contest) => (
            <Link
              key={contest.id}
              href={`/venue/${contest.id}`}
              className="block bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors duration-300 shadow border border-gray-800 hover:border-gray-600"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-300 flex items-center">
                  {contest.name}
                </h2>
                <span className="text-sm text-gray-500">
                  {dayjs(contest.startTime).format('YYYY年MM月DD日 HH:mm')} 開催
                </span>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="text-gray-400 line-clamp-1 text-sm">
                  {contest.theme ? `お題: ${contest.theme}` : 'お題: なし'}
                </p>
                <span className="text-xs text-yellow-500 flex items-center">
                  結果を見る <ExternalLink className="h-3 w-3 ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-10 bg-gray-900/50 rounded-lg border border-gray-800">
          <p>終了した大会はまだありません。</p>
        </div>
      )}
    </div>
  );
}