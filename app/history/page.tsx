import HistoryTabs from './HistoryTabs';
import dayjs from 'dayjs';

// Fetch contest history at request time so production builds do not depend on
// the backend being reachable. The fetch-level revalidation below still keeps
// successful responses cached for 60 seconds.
export const dynamic = 'force-dynamic';

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
  totalPosters?: number;
  type?: string;
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

  return <HistoryTabs contests={sortedContests} />;
}
