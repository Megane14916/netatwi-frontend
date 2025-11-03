'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Send, Smile, Heart, Info, Vote as VoteIcon, CheckCircle, Trophy, ShieldCheck, Clock, Check, X, Image as ImageIcon, Users, Bookmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TimeAgo from '@/components/TimeAgo';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import Twemoji from '@/components/Twemoji';
import Link from 'next/link';
import dayjs from 'dayjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// 型定義
interface ContestDetails {
  id: number;
  name: string;
  theme: string | null;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  judgeVoteRatio: number;
  hasTheme: boolean;
  hasQualifier: boolean;
  allowImages: boolean;
}

interface Post {
  id: number;
  content: string;
  user_id: number;
  created_at: string;
  myVotes: number;
}
type ContestStatus = 'upcoming' | 'ongoing' | 'voting' | 'closed';

interface Voter {
    screen_name: string;
    count: number;
    is_judge: boolean;
}

interface ResultPost {
    rank: number | null;
    post_id: number;
    content: string;
    created_at: string;
    score: number;
    user: {
        screen_name: string;
        profile_image_url: string | null;
    };
    voters: Voter[];
    bookmarkCount: number;
    isBookmarked: boolean;
}

// 投票ハートUIコンポーネント
interface VoteHeartsProps {
  postId: number;
  initialVotes: number;
  maxVotes?: number;
  onVoteChange: (postId: number, newCount: number) => void;
  disabled?: boolean;
}
const VoteHearts = ({ postId, initialVotes, maxVotes = 3, onVoteChange, disabled = false }: VoteHeartsProps) => {
  const [currentVotes, setCurrentVotes] = useState(initialVotes);
  useEffect(() => { setCurrentVotes(initialVotes); }, [initialVotes]);
  const handleClick = (index: number) => {
      if (disabled) return;
      const newCount = index + 1;
      const finalCount = (currentVotes === maxVotes && newCount === maxVotes) ? 0 : newCount;
      setCurrentVotes(finalCount);
      onVoteChange(postId, finalCount);
  };
  return (
      <div className="flex items-center space-x-1">
          {[...Array(maxVotes)].map((_, index) => (
              <button key={index} onClick={() => handleClick(index)} disabled={disabled} className={`p-1 rounded-full transition-colors ${!disabled ? 'hover:bg-red-900/50' : 'cursor-not-allowed'}`} aria-label={`Vote ${index + 1}`}>
                  <Heart className={`h-5 w-5 ${index < currentVotes ? 'text-red-500 fill-red-500' : 'text-gray-500'} ${!disabled ? 'hover:text-red-400' : ''}`} />
              </button>
          ))}
      </div>
  );
};

// 自分の投稿表示用コンポーネント
interface MyPostDisplayProps {
    post: Post;
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
}
const MyPostDisplay = ({ post, isEditing, setIsEditing }: MyPostDisplayProps) => {
    return (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
             <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 mr-4"></div>
                <div className="flex-grow">
                    <div className="flex items-center justify-between">
                        <span className="font-bold">あなたの投稿</span>
                        <TimeAgo timestamp={post.created_at} />
                    </div>
                    <Twemoji text={post.content} />
                </div>
            </div>
            {!isEditing && (
                 <div className="text-right mt-2">
                    <button onClick={() => setIsEditing(true)} className="text-sm text-yellow-400 hover:underline">編集する</button>
                </div>
            )}
        </div>
    );
};


export default function VenueDetailPage() {
    const params = useParams();
    const contestId = parseInt(params.id as string, 10);
    const { user, judgeContests } = useAuth();

    const [contest, setContest] = useState<ContestDetails | null>(null);
    const [contestStatus, setContestStatus] = useState<ContestStatus | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [results, setResults] = useState<ResultPost[]>([]);
    const [totalPosters, setTotalPosters] = useState<number | null>(null);
    const [totalVoters, setTotalVoters] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [hasPosted, setHasPosted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [votes, setVotes] = useState<{ [postId: number]: number }>({});
    const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
    const [voteSubmitMessage, setVoteSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [totalVotes, setTotalVotes] = useState(0);
    const [hasVotedInContest, setHasVotedInContest] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const isJudgeMode = judgeContests.includes(contestId);

    useEffect(() => {
        if (!contestId) return;
        const fetchData = async () => {
             try {
                setLoading(true);
                setError(null); setVoteSubmitMessage(null); setHasVotedInContest(false);
                setPosts([]); setResults([]); setHasPosted(false); setIsEditing(false);
                setTotalPosters(null); setTotalVoters(null); 

                const contestRes = await fetch(`${API_URL}/api/contests/${contestId}`, { credentials: 'include' });
                if (!contestRes.ok) throw new Error('大会情報の取得に失敗しました。');
                const contestData: ContestDetails = await contestRes.json();
                setContest(contestData);
                
                const now = new Date();
                const startTime = new Date(contestData.startTime);
                const endTime = new Date(contestData.endTime);
                const votingEndTime = new Date(contestData.votingEndTime);
                let currentStatus: ContestStatus = 'closed';
                if (now < startTime) currentStatus = 'upcoming';
                else if (now >= startTime && now < endTime) currentStatus = 'ongoing';
                else if (now >= endTime && now < votingEndTime) currentStatus = 'voting';
                setContestStatus(currentStatus);

                if (currentStatus === 'closed') {
                    const resultsRes = await fetch(`${API_URL}/api/contests/${contestId}/results`, { credentials: 'include' });
                    if (!resultsRes.ok) throw new Error('結果の取得に失敗しました。');
                    const resultsData = await resultsRes.json();
                    setResults(resultsData.results || []);
                    setTotalPosters(resultsData.totalPosters);
                    setTotalVoters(resultsData.totalVoters);
                } else {
                    const postsRes = await fetch(`${API_URL}/api/contests/${contestId}/posts`, { credentials: 'include' });
                    if (!postsRes.ok) throw new Error('投稿の取得に失敗しました。');
                    const postsResponse = await postsRes.json();
                    const allPosts: Post[] = postsResponse.posts;
                    setHasVotedInContest(postsResponse.userHasVotedInContest);
                    if (user) {
                        const myPost = allPosts.find(p => p.user_id === user.id);
                        if (myPost) {
                            setHasPosted(true);
                            if (currentStatus === 'ongoing') { setPosts([myPost]); setNewPostContent(myPost.content); }
                        } else {
                            setHasPosted(false);
                            if (currentStatus === 'ongoing') { setPosts([]); }
                        }
                         if (currentStatus === 'voting') {
                            setPosts(allPosts);
                            const initialVotes: { [postId: number]: number } = {};
                            let currentTotal = 0;
                            allPosts.forEach(post => { initialVotes[post.id] = post.myVotes; currentTotal += post.myVotes; });
                            setVotes(initialVotes); setTotalVotes(currentTotal);
                        }
                    } else {
                        if (currentStatus === 'voting') { setPosts(allPosts); }
                    }
                }
            } catch (err) { setError(err instanceof Error ? err.message : 'データの読み込み中にエラーが発生しました。');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [contestId, user]);

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim() || !user) return;
        setIsSubmitting(true); setPostError(null);
        const url = isEditing ? `${API_URL}/api/contests/${contestId}/posts/${posts[0]?.id}` : `${API_URL}/api/contests/${contestId}/posts`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newPostContent }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || (isEditing ? '編集' : '投稿') + 'に失敗しました。');
            const updatedPost = { ...data, user_id: user.id };
            setPosts([updatedPost]); setHasPosted(true); setIsEditing(false); setPostError(null);
        } catch (err) { setPostError(err instanceof Error ? err.message : `不明なエラーが発生しました。(${method})`);
        } finally { setIsSubmitting(false); }
    };
    
    const onEmojiClick = (emojiData: EmojiClickData) => { setNewPostContent(prevInput => prevInput + emojiData.emoji); setShowEmojiPicker(false); };
    
    const handleVoteChange = (postId: number, newCount: number) => { setVotes(prevVotes => { const updatedVotes = { ...prevVotes, [postId]: newCount }; const newTotal = Object.values(updatedVotes).reduce((sum, count) => sum + count, 0); setTotalVotes(newTotal); return updatedVotes; }); setVoteSubmitMessage(null); };
    
    const handleSubmitVotes = async () => {
        if (totalVotes < 10 && !isJudgeMode) return;
        setIsSubmittingVotes(true); setVoteSubmitMessage(null);
        try {
            const response = await fetch(`${API_URL}/api/contests/${contestId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ votes }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '投票の送信に失敗しました。');
            setVoteSubmitMessage({ type: 'success', text: data.message || '投票を受け付けました！' });
            setHasVotedInContest(true);
        } catch (err) { setVoteSubmitMessage({ type: 'error', text: err instanceof Error ? err.message : '投票処理中にエラーが発生しました。' });
        } finally { setIsSubmittingVotes(false); }
    };

    const handleBookmarkToggle = async (postId: number) => {
        if (!user) { alert('ブックマークするにはログインが必要です。'); return; }
        setResults(prevResults => 
            prevResults.map(result => {
                if (result.post_id === postId) {
                    const newIsBookmarked = !result.isBookmarked;
                    const newBookmarkCount = newIsBookmarked ? result.bookmarkCount + 1 : result.bookmarkCount - 1;
                    return { ...result, isBookmarked: newIsBookmarked, bookmarkCount: newBookmarkCount };
                }
                return result;
            })
        );
        try {
            const response = await fetch(`${API_URL}/api/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'ブックマークに失敗しました。');
            setResults(prevResults =>
                prevResults.map(result =>
                    result.post_id === postId
                        ? { ...result, isBookmarked: data.isBookmarked, bookmarkCount: data.bookmarkCount }
                        : result
                )
            );
        } catch (err) {
            console.error(err);
            // エラー時はUIを元に戻す
            setResults(prevResults => 
                prevResults.map(result => {
                    if (result.post_id === postId) {
                        const newIsBookmarked = !result.isBookmarked;
                        const newBookmarkCount = newIsBookmarked ? result.bookmarkCount + 1 : result.bookmarkCount - 1;
                        return { ...result, isBookmarked: newIsBookmarked, bookmarkCount: newBookmarkCount };
                    }
                    return result;
                })
            );
        }
    };

    if (loading) { return <div className="text-center py-10">読み込み中...</div>; }
    if (error) { return <div className="text-center py-10 text-red-500">エラー: {error}</div>; }
    if (!contest) { return <div className="text-center py-10">大会が見つかりません。</div>; }

    const canVote = contestStatus === 'voting' && user && !hasVotedInContest;
    const showVoteBar = canVote || (isJudgeMode && contestStatus === 'voting');

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 relative">
            {isJudgeMode && contestStatus === 'voting' && ( <div className="mb-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg flex items-center text-sm sticky top-16 z-40 shadow-lg"> <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0" /> 現在、審査員として投票中です。 </div> )}
            <div className={`border border-gray-700 rounded-lg bg-gray-900 ${showVoteBar ? 'pb-24' : 'pb-4'}`}>
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-yellow-400">{contest.name}</h1>
                    <p className="text-lg text-gray-300 mt-2"> {contest.hasTheme && contest.theme ? `お題: 「${contest.theme}」` : "自由にネタツイしよう"} </p>
                    <div className="mt-3 text-sm text-gray-400 space-y-1">
                        <div className="flex items-center"><Clock className="h-4 w-4 mr-2"/>投稿締切: {dayjs(contest.endTime).format('YYYY/MM/DD HH:mm')}</div>
                        <div className="flex items-center gap-x-4 flex-wrap">
                             <span className="flex items-center"><Users className="h-4 w-4 mr-1.5"/>審査員倍率: {contest.judgeVoteRatio}倍</span>
                             <span className="flex items-center">{contest.hasQualifier ? <Check className="h-4 w-4 mr-1.5 text-green-500"/> : <X className="h-4 w-4 mr-1.5 text-red-500"/>}予選・決勝{contest.hasQualifier ? 'あり' : 'なし'}</span>
                             <span className="flex items-center">{contest.allowImages ? <Check className="h-4 w-4 mr-1.5 text-green-500"/> : <X className="h-4 w-4 mr-1.5 text-red-500"/>}画像投稿{contest.allowImages ? '可' : '不可'}</span>
                        </div>
                    </div>
                    {contestStatus === 'ongoing' && <p className="text-sm text-yellow-400 mt-2">投稿受付中</p>}
                    {contestStatus === 'voting' && <p className="text-sm text-green-400 mt-2">投票受付中</p>}
                    {contestStatus === 'closed' && ( <> <p className="text-sm text-gray-400 mt-2">この大会は終了しました</p> {(totalPosters !== null || totalVoters !== null) && ( <p className="text-xs text-gray-500 mt-1"> 参加者: {totalPosters ?? '?'}人 / 投票者: {totalVoters ?? '?'}人 </p> )} </> )}
                    {contestStatus === 'upcoming' && <p className="text-sm text-blue-400 mt-2">開催前</p>}
                </div>
                
                {contestStatus === 'ongoing' && (
                    <div className="p-4 space-y-4">
                        {user ? (
                            hasPosted && posts.length > 0 ? (
                                <>
                                    <div className="bg-green-900/50 text-green-300 p-3 rounded-lg flex items-center text-sm">
                                        <Info className="h-5 w-5 mr-3 flex-shrink-0" />
                                        <p>投稿済みです。締切まで編集可能です。</p>
                                    </div>
                                    <MyPostDisplay post={posts[0]} isEditing={isEditing} setIsEditing={setIsEditing} />
                                </>
                            ) : null
                        ) : (
                             <div className="text-center py-10 text-gray-500">ログインすると投稿できます。</div>
                        )}
                        {user && (!hasPosted || isEditing) && (
                            <form onSubmit={handlePostSubmit} className="relative">
                                <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-white resize-none"
                                placeholder={hasPosted ? "投稿を編集..." : "いまどうしてる？"}
                                rows={3}
                                />
                                <div className="flex justify-between items-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="text-gray-400 hover:text-yellow-400 p-2 rounded-full hover:bg-gray-800 transition-colors"
                                >
                                    <Smile className="h-6 w-6" />
                                </button>
                                <div className="flex items-center gap-2">
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                if (posts.length > 0) setNewPostContent(posts[0].content);
                                            }}
                                            className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-md hover:bg-gray-700"
                                        >
                                            キャンセル
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!newPostContent.trim() || isSubmitting}
                                        className="bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-full hover:bg-yellow-600 transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting ? (isEditing ? '更新中...' : '投稿中...') : (isEditing ? '更新する' : '投稿')}
                                    </button>
                                </div>
                                </div>
                                {postError && <p className="text-red-500 text-sm mt-2 text-right">{postError}</p>}

                                {showEmojiPicker && (
                                <div className="absolute z-10 mt-2 right-0 sm:right-auto">
                                    <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.DARK}
                                    emojiStyle={EmojiStyle.TWITTER}
                                    lazyLoadEmojis={true}
                                    />
                                </div>
                                )}
                            </form>
                        )}
                        {!loading && !hasPosted && contestStatus === 'ongoing' && (
                             <div className="text-center py-10 text-gray-500">{user ? '投稿を作成してください。' : '投稿はありません。'}</div>
                        )}
                    </div>
                )}

                {contestStatus === 'voting' && (
                    <div>
                         {user && hasVotedInContest && (
                            <div className="p-4 border-b border-gray-700">
                                <div className="bg-blue-900/50 text-blue-300 p-3 rounded-lg flex items-center text-sm">
                                    <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                    <p>この大会には投票済みです。</p>
                                </div>
                            </div>
                         )}
                        {posts.length > 0 ? (
                            posts.map((post, index) => {
                                const isMyPost = user && post.user_id === user.id;
                                const showVoteUI = canVote || (isJudgeMode && contestStatus === 'voting');
                                const voteUIDisabled = hasVotedInContest && !isJudgeMode;
                                return (
                                    <div key={post.id} className={`p-4 transition-colors ${index < posts.length - 1 ? 'border-b border-gray-700' : ''} ${isMyPost ? 'bg-yellow-900/20' : ''}`}>
                                        <div className="flex items-start">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 mr-4"></div>
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold">匿名さん</span>
                                                    <TimeAgo timestamp={post.created_at} />
                                                </div>
                                                <Twemoji text={post.content} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-3 items-center">
                                            {showVoteUI ? (
                                                <VoteHearts postId={post.id} initialVotes={votes[post.id] || 0} onVoteChange={handleVoteChange} disabled={voteUIDisabled} />
                                            ) : (
                                                <div className="flex items-center text-gray-500">
                                                    <Heart className={`h-5 w-5 mr-1 ${votes[post.id] > 0 ? 'text-red-600 fill-red-600' : ''}`} />
                                                    <span className="text-sm">{votes[post.id] || 0}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : ( <div className="text-center py-10 text-gray-500">投稿がありません。</div> )}
                    </div>
                )}

                {contestStatus === 'closed' && (
                    <div>
                        {results.length > 0 ? (
                            results.map((result, index) => {
                                const isMyPost = user && result.user.screen_name === user.screen_name;
                                return (
                                <div
                                    key={result.post_id}
                                    className={`p-4 transition-colors ${index < results.length - 1 ? 'border-b border-gray-700' : ''} ${isMyPost ? 'bg-yellow-900/20' : ''}`}
                                >
                                    <div className="flex items-start">
                                        <div className="w-10 text-center mr-4 pt-1">
                                            {result.rank === 1 && <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-1" />}
                                            {result.rank === 2 && <Trophy className="h-6 w-6 text-gray-400 mx-auto mb-1" />}
                                            {result.rank === 3 && <Trophy className="h-6 w-6 text-yellow-700 mx-auto mb-1" />}
                                            <span className={`font-bold text-lg ${
                                                result.rank && result.rank <= 3 ? 'text-yellow-300' : 'text-gray-500'
                                            }`}>{result.rank ? `${result.rank}位` : '-'}</span>
                                        </div>
                                        <img
                                            src={result.user.profile_image_url || `https://via.placeholder.com/40`}
                                            alt={result.user.screen_name}
                                            className="w-10 h-10 rounded-full flex-shrink-0 mr-4"
                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                                        />
                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between">
                                                <Link href={`/profile/${encodeURIComponent(result.user.screen_name)}`} className="font-bold hover:underline">
                                                    {result.user.screen_name}
                                                </Link>
                                                <TimeAgo timestamp={result.created_at} />
                                            </div>
                                            <Twemoji text={result.content} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-3 items-center space-x-4">
                                        <div className="flex items-center text-red-500">
                                            <Heart className="h-5 w-5 mr-1 fill-current" />
                                            <span className="text-sm font-semibold">{result.score}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleBookmarkToggle(result.post_id)}
                                            className={`flex items-center transition-colors p-1 rounded-full ${
                                                result.isBookmarked 
                                                ? 'text-blue-400 hover:text-blue-300' 
                                                : 'text-gray-500 hover:text-blue-400'
                                            }`}
                                            disabled={!user}
                                        >
                                            <Bookmark className={`h-5 w-5 mr-1 ${result.isBookmarked ? 'fill-current' : ''}`} />
                                            <span className="text-sm font-semibold">{result.bookmarkCount}</span>
                                        </button>
                                    </div>
                                    {result.voters && result.voters.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">
                                            <span className="font-semibold mr-1">投票者:</span>
                                            {result.voters.map((voter, vIndex) => (
                                                <span key={vIndex} className="mr-2">
                                                    <Link
                                                        href={`/profile/${encodeURIComponent(voter.screen_name)}`}
                                                        className={`hover:underline ${voter.is_judge ? 'font-bold text-yellow-400' : ''}`}
                                                    >
                                                        {voter.screen_name}
                                                    </Link>
                                                    ({voter.count})
                                                    {vIndex < result.voters.length - 1 && ' / '}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                );
                            })
                        ) : (
                           <div className="text-center py-10 text-gray-500">
                               <p>結果データがありません。</p>
                           </div>
                        )}
                    </div>
                )}

                {contestStatus === 'upcoming' && ( <div className="text-center py-10 text-gray-500">この大会はまだ開始されていません。</div> )}
            </div>

            {showVoteBar && (
                <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur border-t border-gray-700 p-4 shadow-lg">
                   <div className="container mx-auto max-w-2xl flex justify-between items-center">
                        <div className={`text-sm px-3 py-1 rounded-full ${totalVotes >= 10 || isJudgeMode ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                            {totalVotes}票 {isJudgeMode ? '' : '/ 10票以上'}
                        </div>
                        <button
                            onClick={handleSubmitVotes}
                            disabled={(totalVotes < 10 && !isJudgeMode) || isSubmittingVotes || (hasVotedInContest && !isJudgeMode)}
                            className="bg-green-500 text-white font-bold py-2 px-6 rounded-full hover:bg-green-600 transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
                        >
                            <VoteIcon className="h-5 w-5 mr-2" />
                            {isSubmittingVotes ? '投票中...' : isJudgeMode ? '審査員票を確定' : '投票する'}
                        </button>
                    </div>
                    {voteSubmitMessage && (
                        <div className={`mt-2 text-center text-sm ${voteSubmitMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {voteSubmitMessage.text}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

