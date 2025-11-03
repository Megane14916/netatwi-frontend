'use client';

import { useState, useEffect } from 'react';
import { Timer, Zap, Calendar, CheckSquare, Trophy, ExternalLink, KeyRound } from 'lucide-react';
import Twemoji from '@/components/Twemoji';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

// --- ▼▼▼ API_URLを環境変数から取得 ▼▼▼ ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
// --- ▲▲▲ ここまで ▲▲▲ ---

// --- ▼▼▼ Contestの型定義を更新 ▼▼▼ ---
interface Contest {
    id: number;
    name: string;
    hasTheme: boolean; // 追加
    theme: string | null; // null許容に変更
    hasQualifier: boolean; // 追加
    startTime: string | null; // null許容に変更 (予選ありの場合考慮)
    endTime: string | null;
    votingEndTime: string | null;
    qualifierStartTime: string | null; // 追加
    qualifierEndTime: string | null; // 追加
    qualifierVotingEndTime: string | null; // 追加
}
// --- ▲▲▲ ここまで ▲▲▲ ---

// --- ▼▼▼ ContestStatus 型定義をここに移動 ▼▼▼ ---
type ContestStatus = 'upcoming' | 'ongoing' | 'voting' | 'closed';
// --- ▲▲▲ ここまで ▲▲▲ ---


// カウントダウン表示用のコンポーネント (targetTimeがnullの場合を考慮)
const Countdown = ({ targetTime, status }: { targetTime: string | null; status: 'upcoming' | 'ongoing' | 'voting' | 'qualifier_ongoing' | 'qualifier_voting' }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!targetTime) {
            setTimeLeft('時間未定');
            return;
        }

        const calculateTimeLeft = () => {
            const difference = +new Date(targetTime) - +new Date();
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);

                let timer = '';
                if (days > 0) timer += `${days}日`;
                if (hours > 0 || days > 0) timer += `${hours}時間`;
                timer += `${minutes}分`;
                setTimeLeft(timer);
            } else {
                switch (status) {
                    case 'upcoming': setTimeLeft('開催中'); break;
                    case 'qualifier_ongoing': setTimeLeft('予選投票受付中'); break;
                    case 'ongoing': setTimeLeft('投票受付中'); break;
                    case 'qualifier_voting': setTimeLeft('決勝準備中'); break;
                    case 'voting': setTimeLeft('終了'); break;
                    default: setTimeLeft('終了');
                }
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000 * 30);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [targetTime, status]);

    return <span>{timeLeft}</span>;
};

// --- ▼▼▼ 最新結果表示用の型定義をシンプル化 ▼▼▼ ---
interface LatestResult {
    contest_id: number;
    contest_name: string;
    theme: string | null; // null許容
}
// --- ▲▲▲ ここまで ▲▲▲ ---

// パスワード入力モーダル
interface JudgeLoginModalProps {
    contestId: number;
    contestName: string;
    onClose: () => void;
 }
const JudgeLoginModal = ({ contestId, contestName, onClose }: JudgeLoginModalProps) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { refetchUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/contests/${contestId}/judge/login`, { // URL修正
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '認証に失敗しました。');
            }
            await refetchUser();
            if (data.redirectUrl) {
                router.push(data.redirectUrl);
            } else {
                onClose();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-sm relative shadow-xl border border-gray-700">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
                <h2 className="text-lg font-semibold mb-2 text-center">{contestName}</h2>
                <p className="text-sm text-gray-400 mb-4 text-center">審査員用パスワードを入力してください</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 mb-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        placeholder="パスワード"
                    />
                    {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50"
                    >
                        {isLoading ? '認証中...' : '認証する'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- ▼▼▼ 予選/決勝判定ヘルパー関数 ▼▼▼ ---
// 戻り値の型アノテーション statusKey から ContestStatus を削除
const getQualifierStatus = (contest: Contest): { phase: '予選' | '決勝' | null; statusKey: 'upcoming' | 'qualifier_ongoing' | 'qualifier_voting' | null; targetTime: string | null } => {
    if (!contest.hasQualifier) return { phase: null, statusKey: null, targetTime: null }; // 予選なし

    const now = dayjs();
    const qStart = contest.qualifierStartTime ? dayjs(contest.qualifierStartTime) : null;
    const qEnd = contest.qualifierEndTime ? dayjs(contest.qualifierEndTime) : null;
    const qVoteEnd = contest.qualifierVotingEndTime ? dayjs(contest.qualifierVotingEndTime) : null;
    
    // 予選開始前
    if (qStart && now.isBefore(qStart)) {
         return { phase: '予選', statusKey: 'upcoming', targetTime: contest.qualifierStartTime };
    }
    if (qStart && qEnd && now.isAfter(qStart) && now.isBefore(qEnd)) {
        return { phase: '予選', statusKey: 'qualifier_ongoing', targetTime: contest.qualifierEndTime }; // 予選投稿中
    }
    if (qEnd && qVoteEnd && now.isAfter(qEnd) && now.isBefore(qVoteEnd)) {
        return { phase: '予選', statusKey: 'qualifier_voting', targetTime: contest.qualifierVotingEndTime }; // 予選投票中
    }
    return { phase: '決勝', statusKey: null, targetTime: null }; // それ以外は決勝扱い (仮)
};
// --- ▲▲▲ ここまで ▲▲▲ ---

export default function VenuePage() {
    const { user, refetchUser } = useAuth();
    const router = useRouter();
    const [ongoingContests, setOngoingContests] = useState<Contest[]>([]);
    const [votingContests, setVotingContests] = useState<Contest[]>([]);
    const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
    const [latestResult, setLatestResult] = useState<LatestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showJudgeModal, setShowJudgeModal] = useState<number | null>(null);

    // --- ▼▼▼ データ取得と分類ロジックを更新 ▼▼▼ ---
    useEffect(() => {
        const fetchContests = async () => {
            try {
                const response = await fetch(`${API_URL}/api/contests`); // URL修正
                if (!response.ok) throw new Error('大会情報の取得に失敗しました。');
                const data = await response.json();

                const now = dayjs();
                const ongoing: Contest[] = [];
                const voting: Contest[] = [];
                const upcoming: Contest[] = [];

                // バックエンドから来たデータを分類 (より詳細なステータス判定はここで行う)
                (data.ongoing || []).forEach((c: Contest) => ongoing.push(c));
                (data.voting || []).forEach((c: Contest) => voting.push(c));
                (data.upcoming || []).forEach((c: Contest) => upcoming.push(c));

                setOngoingContests(ongoing);
                setVotingContests(voting);
                setUpcomingContests(upcoming);
                setLatestResult(data.latestResult || null);

            } catch (err) {
                setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
            } finally {
                setLoading(false);
            }
        };
        fetchContests();
    }, []);
    // --- ▲▲▲ ここまで ▲▲▲ ---


    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 border-b border-gray-700 pb-2">会場</h1>
                <div className="animate-pulse space-y-8">
                    {/* ローディングスケルトン */}
                    <div className="space-y-4">
                        <div className="h-8 w-48 bg-gray-700 rounded mb-4"></div>
                        <div className="h-40 bg-gray-800 rounded-lg"></div>
                        <div className="h-40 bg-gray-800 rounded-lg"></div>
                    </div>
                     <div className="space-y-4">
                        <div className="h-8 w-48 bg-gray-700 rounded mb-4"></div>
                        <div className="h-40 bg-gray-800 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
     }
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
            <h1 className="text-3xl font-bold mb-8 border-b border-gray-700 pb-2">会場</h1>
            {latestResult && (
                <section className="mb-12 bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-3 text-gray-300 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                        最新の結果：{latestResult.contest_name}
                    </h2>
                     <p className="text-gray-400 mb-4 text-sm">
                        お題: {latestResult.theme || 'お題なし'}
                     </p>
                    <a href={`/venue/${latestResult.contest_id}`} className="inline-flex items-center text-sm text-yellow-400 hover:text-yellow-300 hover:underline">
                        詳細結果を見る <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                </section>
            )}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Zap className="h-6 w-6 mr-2 text-yellow-400" />
                    開催中の大会 (投稿受付中)
                </h2>
                {ongoingContests.length > 0 ? (
                    <div className="space-y-4">
                        {ongoingContests.map((contest) => {
                            const qualStatus = getQualifierStatus(contest);
                            return (
                                <a key={contest.id} href={`/venue/${contest.id}`} className="block bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors duration-300 shadow-lg border border-yellow-500/50">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-yellow-300">{contest.name}</h3>
                                        {qualStatus.phase && <span className="text-xs font-semibold bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">{qualStatus.phase}</span>}
                                    </div>
                                    <p className="text-gray-400 mt-2 line-clamp-2">お題: {contest.hasTheme && contest.theme ? contest.theme : '自由にネタツイしよう'}</p>
                                    <div className="text-sm text-red-400 mt-4 flex items-center font-semibold">
                                        <Timer className="h-4 w-4 mr-1.5" />
                                        {qualStatus.phase === '予選' ? '予選投稿終了まで残り ' : '投稿終了まで残り '}
                                        <Countdown targetTime={qualStatus.phase === '予選' ? contest.qualifierEndTime : contest.endTime} status={qualStatus.statusKey || 'ongoing'} />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : ( <p className="text-gray-500">現在開催中の大会はありません。</p> )}
            </section>
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <CheckSquare className="h-6 w-6 mr-2 text-green-400" />
                    投票受付中の大会
                </h2>
                {votingContests.length > 0 ? (
                    <div className="space-y-4">
                        {votingContests.map((contest) => {
                             const qualStatus = getQualifierStatus(contest);
                             return (
                                <div key={contest.id} className="bg-gray-900 rounded-lg p-6 shadow-lg border border-green-500/50 flex flex-col justify-between">
                                    <div>
                                         <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-green-300">{contest.name}</h3>
                                            {qualStatus.phase && <span className="text-xs font-semibold bg-green-900 text-green-300 px-2 py-0.5 rounded">{qualStatus.phase}</span>}
                                        </div>
                                        <p className="text-gray-400 mt-2 line-clamp-2">お題: {contest.hasTheme && contest.theme ? contest.theme : '自由にネタツイしよう'}</p>
                                        <div className="text-sm text-green-400 mt-4 flex items-center font-semibold">
                                            <Timer className="h-4 w-4 mr-1.5" />
                                             {qualStatus.phase === '予選' ? '予選投票終了まで残り ' : '投票終了まで残り '}
                                            <Countdown targetTime={qualStatus.phase === '予選' ? contest.qualifierVotingEndTime : contest.votingEndTime} status={qualStatus.statusKey || 'voting'} />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row gap-2">
                                         <a href={`/venue/${contest.id}`} className="flex-1 text-center bg-green-700/50 hover:bg-green-600/50 text-green-300 font-semibold py-2 px-4 rounded-md transition-colors text-sm">一般投票</a>
                                         {user && (<button onClick={() => setShowJudgeModal(contest.id)} className="flex-1 text-center bg-yellow-700/50 hover:bg-yellow-600/50 text-yellow-300 font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center"><KeyRound className="h-4 w-4 mr-1.5"/>審査員として投票</button>)}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                ) : ( <p className="text-gray-500">現在投票受付中の大会はありません。</p> )}
            </section>
            <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-blue-400" />
                    準備中の大会
                </h2>
                {upcomingContests.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingContests.map((contest) => {
                             const qualStatus = getQualifierStatus(contest);
                            return (
                                <div key={contest.id} className="bg-gray-900 rounded-lg p-6 opacity-70">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold">{contest.name}</h3>
                                         {qualStatus.phase && <span className="text-xs font-semibold bg-blue-900 text-blue-300 px-2 py-0.5 rounded">{qualStatus.phase}</span>}
                                    </div>
                                     <p className="text-gray-400 mt-2 line-clamp-2">お題: {contest.hasTheme && contest.theme ? contest.theme : '自由にネタツイしよう'}</p>
                                    <div className="text-sm text-blue-400 mt-4 flex items-center font-semibold">
                                        <Timer className="h-4 w-4 mr-1.5" />
                                         {qualStatus.phase === '予選' ? '予選開始まで残り ' : '開催まで残り '}
                                        <Countdown targetTime={qualStatus.phase === '予選' ? contest.qualifierStartTime : contest.startTime} status={'upcoming'} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : ( <p className="text-gray-500">準備中の大会はありません。</p> )}
            </section>
            {showJudgeModal !== null &&
                <JudgeLoginModal
                    contestId={showJudgeModal}
                    contestName={votingContests.find(c => c.id === showJudgeModal)?.name || ''}
                    onClose={() => setShowJudgeModal(null)}
                />
            }
        </div>
    );
}

