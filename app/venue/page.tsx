import { Timer, Zap, Calendar, CheckSquare, Trophy, Users,CheckCircle } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import Countdown from '@/components/venue/Countdown';

// --- API_URLの設定 ---
// Server Componentはサーバー上で実行されるため、相対パスではなく完全なURLが必要です。
// また、NEXT_PUBLIC_API_URL（クライアント用）ではなく、
// サーバー間通信用の BACKEND_URL（環境変数）またはローカルアドレスを使用します。
const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

// 型定義
interface Contest {
  id: number;
  name: string;
  hasTheme: boolean;
  theme: string | null;
  hasQualifier: boolean;
  startTime: string | null;
  endTime: string | null;
  votingEndTime: string | null;
  qualifierStartTime: string | null;
  qualifierEndTime: string | null;
  qualifierVotingEndTime: string | null;
  totalPosters: number;
  totalVoters: number;
}

interface LatestResult {
  contest_id: number;
  contest_name: string;
  theme: string | null;
  totalPosters: number;
  totalVoters: number;
}

interface ContestsResponse {
  ongoing: Contest[];
  voting: Contest[];
  upcoming: Contest[];
  closed: Contest[];
  latestResult: LatestResult | null;
}

// ステータス判定用ヘルパー関数
type ContestStatusKey = 'upcoming' | 'ongoing' | 'voting' | 'qualifier_ongoing' | 'qualifier_voting' | null;

const getQualifierStatus = (contest: Contest): { phase: '予選' | '決勝' | null; statusKey: ContestStatusKey; targetTime: string | null } => {
  if (!contest.hasQualifier) return { phase: null, statusKey: null, targetTime: null };

  const now = dayjs();
  const qStart = contest.qualifierStartTime ? dayjs(contest.qualifierStartTime) : null;
  const qEnd = contest.qualifierEndTime ? dayjs(contest.qualifierEndTime) : null;
  const qVoteEnd = contest.qualifierVotingEndTime ? dayjs(contest.qualifierVotingEndTime) : null;

  if (qStart && now.isBefore(qStart)) {
      return { phase: '予選', statusKey: 'upcoming', targetTime: contest.qualifierStartTime };
  }
  if (qStart && qEnd && now.isAfter(qStart) && now.isBefore(qEnd)) {
    return { phase: '予選', statusKey: 'qualifier_ongoing', targetTime: contest.qualifierEndTime };
  }
  if (qEnd && qVoteEnd && now.isAfter(qEnd) && now.isBefore(qVoteEnd)) {
    return { phase: '予選', statusKey: 'qualifier_voting', targetTime: contest.qualifierVotingEndTime };
  }
  return { phase: '決勝', statusKey: null, targetTime: null };
};

// データを取得する非同期関数
async function getContestsData(): Promise<ContestsResponse> {
  try {
    // Server Componentからのフェッチなので、credentials: 'include' は不要（セッションCookieは関係ない公開情報のため）
    const res = await fetch(`${API_URL}/api/contests`, {
      next: { revalidate: 60 }, // 60秒キャッシュ
    });

    if (!res.ok) {
      throw new Error('Failed to fetch contests');
    }

    return res.json();
  } catch (error) {
    console.error(error);
    return { ongoing: [], voting: [], upcoming: [], closed: [], latestResult: null };
  }
}

export default async function VenuePage() {
  // サーバー側でデータを取得
  const data = await getContestsData();

  const { ongoing, voting, upcoming, latestResult } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 border-b border-gray-700 pb-2">会場</h1>

      {/* 最新の結果 */}
      {latestResult && (
        <Link
          href={`/venue/${latestResult.contest_id}`}
          className="block mb-12 group hover:bg-gray-800/50 transition-colors"
        >
          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg hover:bg-gray-800/50 transition-colors">
            <h2 className="text-xl font-semibold mb-3 text-gray-300 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              最新の結果：{latestResult.contest_name}
            </h2>
            {/* お題は表示しない */}
            
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-4">
                 <span className="flex items-center"><Users className="w-4 h-4 mr-1.5"/>投稿: {latestResult.totalPosters}人</span>
                 <span className="flex items-center border-l border-gray-600 pl-4"><CheckCircle className="w-4 h-4 mr-1.5"/>投票: {latestResult.totalVoters}人</span>
            </div>
          </section>
        </Link>
      )}

      {/* 開催中の大会 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Zap className="h-6 w-6 mr-2 text-yellow-400" />
          開催中の大会 (投稿受付中)
        </h2>
        {ongoing && ongoing.length > 0 ? (
          <div className="space-y-4">
            {ongoing.map((contest) => {
              const qualStatus = getQualifierStatus(contest);
              return (
                <a
                  key={contest.id}
                  href={`/venue/${contest.id}`}
                  className="block bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors duration-300 shadow-lg border border-yellow-500/50 relative"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-yellow-300">{contest.name}</h3>
                    {qualStatus.phase && (
                      <span className="text-xs font-semibold bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">
                        {qualStatus.phase}
                      </span>
                    )}
                  </div>
                  {/* お題非表示 */}
                  
                  <div className="text-sm text-red-400 mt-4 flex items-center font-semibold">
                    <Timer className="h-4 w-4 mr-1.5" />
                    {qualStatus.phase === '予選' ? '予選投稿終了まで残り ' : '投稿終了まで残り '}
                    <Countdown
                      targetTime={qualStatus.phase === '予選' ? contest.qualifierEndTime : contest.endTime}
                      status={qualStatus.statusKey || 'ongoing'}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">現在開催中の大会はありません。</p>
        )}
      </section>

      {/* 投票受付中の大会 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <CheckSquare className="h-6 w-6 mr-2 text-green-400" />
          投票受付中の大会
        </h2>
        {voting && voting.length > 0 ? (
          <div className="space-y-4">
            {voting.map((contest) => {
              const qualStatus = getQualifierStatus(contest);
              return (
                <a
                  key={contest.id}
                  href={`/venue/${contest.id}`}
                  className="block bg-gray-900 rounded-lg p-6 shadow-lg border border-green-500/50 hover:bg-gray-800 transition-colors relative group"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-green-300">{contest.name}</h3>
                      {qualStatus.phase && (
                        <span className="text-xs font-semibold bg-green-900 text-green-300 px-2 py-0.5 rounded">
                          {qualStatus.phase}
                        </span>
                      )}
                    </div>
                    {/* お題非表示 */}

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-green-400 flex items-center font-semibold">
                        <Timer className="h-4 w-4 mr-1.5" />
                        {qualStatus.phase === '予選' ? '予選投票終了まで残り ' : '投票終了まで残り '}
                        <Countdown
                            targetTime={qualStatus.phase === '予選' ? contest.qualifierVotingEndTime : contest.votingEndTime}
                            status={qualStatus.statusKey || 'voting'}
                        />
                        </div>
                        {/* 投稿者数表示 */}
                        <div className="text-sm text-gray-400 flex items-center">
                            <Users className="h-4 w-4 mr-1.5"/> 投稿数: {contest.totalPosters}
                        </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">現在投票受付中の大会はありません。</p>
        )}
      </section>

      {/* 準備中の大会 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-blue-400" />
          準備中の大会
        </h2>
        {upcoming && upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((contest) => {
              const qualStatus = getQualifierStatus(contest);
              return (
                <div key={contest.id} className="bg-gray-900 rounded-lg p-6 opacity-70">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{contest.name}</h3>
                    {qualStatus.phase && (
                      <span className="text-xs font-semibold bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                        {qualStatus.phase}
                      </span>
                    )}
                  </div>
                  {/* お題非表示 */}
                  <div className="text-sm text-blue-400 mt-4 flex items-center font-semibold">
                    <Timer className="h-4 w-4 mr-1.5" />
                    {qualStatus.phase === '予選' ? '予選開始まで残り ' : '開催まで残り '}
                    <Countdown
                      targetTime={qualStatus.phase === '予選' ? contest.qualifierStartTime : contest.startTime}
                      status={'upcoming'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">準備中の大会はありません。</p>
        )}
      </section>
    </div>
  );
}