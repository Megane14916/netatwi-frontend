import HistoryTabs from './HistoryTabs';
import dayjs from 'dayjs';
import type { ContestSummary } from '@/types/domain';
import { getServerContests } from '@/lib/api/endpoints/server';

// Fetch contest history at request time so production builds do not depend on
// the backend being reachable. The fetch-level revalidation below still keeps
// successful responses cached for 60 seconds.
export const dynamic = 'force-dynamic';

// データを取得する非同期関数
async function getPastContests(): Promise<ContestSummary[]> {
  try {
    const data = await getServerContests();
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
