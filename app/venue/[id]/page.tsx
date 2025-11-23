'use client';

import { useState, useEffect } from 'react';
// 相対パスに変更してインポートエラーを回避
import { useAuth } from '../../../context/AuthContext';
import { Trophy, PenTool, Loader2, Send, CheckCircle, AlertCircle, Clock, Heart, MessageCircle, Share2, Smile, Info, ShieldCheck, AlertTriangle, Check, X, Users, Bookmark } from 'lucide-react';
// 相対パスに変更
import JudgeLoginButton from '../../../components/venue/JudgeLoginButton';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import dayjs from 'dayjs';

// プレビュー環境のエラー回避のため、外部コンポーネントを内部で簡易定義
const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  try {
    return <span className="text-xs text-gray-500">{dayjs(timestamp).fromNow()}</span>;
  } catch (e) {
    return <span className="text-xs text-gray-500">{new Date(timestamp).toLocaleString()}</span>;
  }
};

const Twemoji = ({ text }: { text: string }) => (
  <div className="text-base text-gray-100 whitespace-pre-wrap leading-relaxed mb-2">{text}</div>
);

// --- API_URL設定の削除 (相対パスを使用) ---
const API_PREFIX = '';

// --- 型定義 ---
interface Contest {
  id: number;
  name: string;
  theme: string | null;
  hasTheme: boolean;
  hasQualifier: boolean;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  judgeVoteRatio: number;
  allowImages: boolean;
}

interface Post {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  myVotes: number;
}

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

type ContestStatus = 'upcoming' | 'ongoing' | 'voting' | 'closed';

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
        <button 
          key={index} 
          onClick={() => handleClick(index)} 
          disabled={disabled} 
          className={`p-1 rounded-full transition-colors ${!disabled ? 'hover:bg-red-900/50' : 'cursor-not-allowed opacity-50'}`}
          aria-label={`Vote ${index + 1}`}
        >
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
  isDeadlinePassed: boolean;
}
const MyPostDisplay = ({ post, isEditing, setIsEditing, isDeadlinePassed }: MyPostDisplayProps) => {
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
      {!isEditing && !isDeadlinePassed && (
        <div className="text-right mt-2">
          <button onClick={() => setIsEditing(true)} className="text-sm text-yellow-400 hover:underline">編集する</button>
        </div>
      )}
      {!isEditing && isDeadlinePassed && (
        <div className="text-right mt-2 text-xs text-red-400 flex justify-end items-center">
           <Clock className="w-3 h-3 mr-1" /> 編集受付終了
        </div>
      )}
    </div>
  );
};

export default function VenuePage({ params }: { params: { id: string } }) {
  const contestId = parseInt(params.id);
  // refetchUser を取得して、審査員ログイン後に権限情報を更新できるようにする
  const { user, judgeContests, refetchUser } = useAuth();

  const [contest, setContest] = useState<Contest | null>(null);
  const [contestStatus, setContestStatus] = useState<ContestStatus | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [results, setResults] = useState<ResultPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPosters, setTotalPosters] = useState<number | null>(null);
  const [totalVoters, setTotalVoters] = useState<number | null>(null);
  
  // 投稿フォーム用
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [hasPosted, setHasPosted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 投票用
  const [votes, setVotes] = useState<{ [postId: number]: number }>({});
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
  const [voteSubmitMessage, setVoteSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  // リアルタイム監視用
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPostDeadlineExceeded, setIsPostDeadlineExceeded] = useState(false);
  const [isVoteDeadlineExceeded, setIsVoteDeadlineExceeded] = useState(false);

  const isJudgeMode = judgeContests.includes(contestId);

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); setVoteSubmitMessage(null); setUserHasVoted(false);
      setPosts([]); setResults([]); setHasPosted(false); setIsEditing(false);
      setTotalPosters(null); setTotalVoters(null);

      // コンテスト情報の取得
      const contestRes = await fetch(`${API_PREFIX}/api/contests/${contestId}`);
      if (!contestRes.ok) throw new Error('大会情報の取得に失敗しました');
      const contestData = await contestRes.json();
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

      setIsPostDeadlineExceeded(now >= endTime);
      setIsVoteDeadlineExceeded(now >= votingEndTime);

      if (currentStatus === 'closed') {
        const resultsRes = await fetch(`${API_PREFIX}/api/contests/${contestId}/results`, { credentials: 'include' });
        if (!resultsRes.ok) throw new Error('結果の取得に失敗しました。');
        const resultsData = await resultsRes.json();
        setResults(resultsData.results || []);
        setTotalPosters(resultsData.totalPosters);
        setTotalVoters(resultsData.totalVoters);
      } else {
        // 投稿一覧の取得
        const postsRes = await fetch(`${API_PREFIX}/api/contests/${contestId}/posts`, {
            cache: 'no-store',
            credentials: 'include',
        });
        if (!postsRes.ok) throw new Error('投稿一覧の取得に失敗しました');
        const postsData = await postsRes.json();
        const allPosts: Post[] = postsData.posts;
        setUserHasVoted(postsData.userHasVotedInContest);

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
               // 自分の投票状況をstateに反映
               const initialVotes: { [key: number]: number } = {};
               let currentTotal = 0;
               allPosts.forEach(post => { 
                   if (post.myVotes > 0) {
                       initialVotes[post.id] = post.myVotes; 
                       currentTotal += post.myVotes;
                   }
               });
               setVotes(initialVotes); setTotalVotes(currentTotal);
            }
        } else {
            if (currentStatus === 'voting') { setPosts(allPosts); }
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) fetchData();
  }, [contestId, user]);

  // リアルタイム監視
  useEffect(() => {
    if (!contest) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const endTime = new Date(contest.endTime);
      const votingEndTime = new Date(contest.votingEndTime);
      setIsPostDeadlineExceeded(now >= endTime);
      setIsVoteDeadlineExceeded(now >= votingEndTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  // 投稿処理
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostDeadlineExceeded) { alert('締め切り時間を過ぎているため、操作できません。'); return; }
    if (!newPostContent.trim() || !user) return;

    setIsSubmitting(true); setPostError(null);
    const url = isEditing ? `${API_PREFIX}/api/contests/${contestId}/posts/${posts[0]?.id}` : `${API_PREFIX}/api/contests/${contestId}/posts`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '投稿に失敗しました');
      }
      const data = await res.json();
      const updatedPost = { ...data, user_id: user.id }; // レスポンスから構築
      
      setNewPostContent('');
      setPosts([updatedPost]); setHasPosted(true); setIsEditing(false);
      alert('投稿しました！');
    } catch (err: any) {
      setPostError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => { setNewPostContent(prevInput => prevInput + emojiData.emoji); setShowEmojiPicker(false); };

  // 投票処理 (ローカルState更新)
  const handleVoteChange = (postId: number, newCount: number) => {
    if (userHasVoted && !isJudgeMode) {
        alert("一般投票は一度送信すると変更できません。");
        return;
    }
    setVotes(prevVotes => { 
        const updatedVotes = { ...prevVotes, [postId]: newCount }; 
        const newTotal = Object.values(updatedVotes).reduce((sum, count) => sum + count, 0); 
        setTotalVotes(newTotal); 
        return updatedVotes; 
    }); 
    setVoteSubmitMessage(null); 
  };

  

  // 投票送信
  const submitVotes = async () => {
    if (isVoteDeadlineExceeded) { alert('投票期間が終了しました。'); return; }
    if (totalVotes < 10 && !isJudgeMode) { alert(`一般投票には合計10票以上の投票が必要です。(現在: ${totalVotes}票)`); return; }
    if(!confirm('投票を確定しますか？(一般参加の場合、修正できません)')) return;

    setIsSubmittingVotes(true); setVoteSubmitMessage(null);
    try {
      const res = await fetch(`${API_PREFIX}/api/contests/${contestId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '投票に失敗しました');

      setVoteSubmitMessage({ type: 'success', text: data.message || '投票を受け付けました！' });
      setUserHasVoted(true);
    } catch (err: any) {
      setVoteSubmitMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingVotes(false);
    }
  };

  const handleBookmarkToggle = async (postId: number) => {
    if (!user) { alert('ブックマークするにはログインが必要です。'); return; }
    // 楽観的更新
    setResults(prevResults => prevResults.map(r => r.post_id === postId ? { ...r, isBookmarked: !r.isBookmarked, bookmarkCount: r.isBookmarked ? r.bookmarkCount - 1 : r.bookmarkCount + 1 } : r));
    
    try {
        const res = await fetch(`${API_PREFIX}/api/posts/${postId}/bookmark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error);
        // サーバーの値で補正
        setResults(prevResults => prevResults.map(r => r.post_id === postId ? { ...r, isBookmarked: data.isBookmarked, bookmarkCount: data.bookmarkCount } : r));
    } catch(e) {
        console.error(e);
        // エラー時ロールバック (省略)
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400"><Loader2 className="animate-spin mr-2" /> 読み込み中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400"><AlertCircle className="mr-2" /> {error}</div>;
  if (!contest) return null;

  // 期間判定
  const isPostPeriod = !isPostDeadlineExceeded && contestStatus === 'ongoing';
  const isVotePeriod = !isVoteDeadlineExceeded && contestStatus === 'voting';
  const isClosed = contestStatus === 'closed';

  const canVote = contestStatus === 'voting' && user && !userHasVoted;
  const showVoteBar = canVote || (isJudgeMode && contestStatus === 'voting');
  const isVoteSubmitDisabled = (totalVotes < 10 && !isJudgeMode) || isSubmittingVotes || (userHasVoted && !isJudgeMode) || isVoteDeadlineExceeded;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 relative">
      {isJudgeMode && contestStatus === 'voting' && ( <div className="mb-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg flex items-center text-sm sticky top-16 z-40 shadow-lg"> <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0" /> 現在、審査員として投票中です。 </div> )}
      
      {contestStatus === 'ongoing' && isPostDeadlineExceeded && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center shadow-lg animate-pulse">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
              <div>
                  <p className="font-bold">投稿受け付けは終了しました</p>
                  <p className="text-xs opacity-80">集計中または投票フェーズへの移行待ちです。</p>
              </div>
          </div>
      )}

      <div className={`border border-gray-700 rounded-lg bg-gray-900 ${showVoteBar ? 'pb-24' : 'pb-4'}`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-start mb-2">
            <div>
                {/* UI修正: 青いステータスバッジを削除しました */}
                <h1 className="text-2xl font-bold text-yellow-400">{contest.name}</h1>
                {contest.hasTheme && (
                    <div className="text-lg text-yellow-400 font-medium">お題: {contest.theme}</div>
                )}
            </div>
            {/* UI修正 & バグ修正: 投票期間中のみ表示 & ログイン後に権限更新 */}
            {!isJudgeMode && isVotePeriod && (
                <JudgeLoginButton 
                    contestId={contestId} 
                    onLoginSuccess={async () => {
                        await refetchUser(); // 権限情報を更新
                        await fetchData();   // ページデータを更新
                    }} 
                />
            )}
            {isJudgeMode && (
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-bold">審査員モード</span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-4">
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 投稿: {dayjs(contest.startTime).format('MM/DD HH:mm')} ~</div>
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 投票〆: {dayjs(contest.votingEndTime).format('MM/DD HH:mm')}</div>
          </div>
          
          <div className="mt-2 text-sm text-gray-500 flex gap-3 flex-wrap">
               <span className="flex items-center"><Users className="w-3 h-3 mr-1"/>審査員倍率: {contest.judgeVoteRatio}倍</span>
               <span className="flex items-center">{contest.hasQualifier ? <Check className="w-3 h-3 mr-1 text-green-500"/> : <X className="w-3 h-3 mr-1 text-red-500"/>}予選・決勝{contest.hasQualifier ? 'あり' : 'なし'}</span>
               <span className="flex items-center">{contest.allowImages ? <Check className="w-3 h-3 mr-1 text-green-500"/> : <X className="w-3 h-3 mr-1 text-red-500"/>}画像投稿{contest.allowImages ? '可' : '不可'}</span>
          </div>
        </div>
        
        {contestStatus === 'ongoing' && (
          <div className="p-4 space-y-4">
            {user ? (
              hasPosted && posts.length > 0 ? (
                <>
                  <div className="bg-green-900/50 text-green-300 p-3 rounded-lg flex items-center text-sm border border-green-800">
                    <Info className="h-5 w-5 mr-3 flex-shrink-0" />
                    <p>投稿済みです。締切まで編集可能です。</p>
                  </div>
                  <MyPostDisplay 
                    post={posts[0]} 
                    isEditing={isEditing} 
                    setIsEditing={setIsEditing} 
                    isDeadlinePassed={isPostDeadlineExceeded} 
                  />
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
                  disabled={isPostDeadlineExceeded || isSubmitting}
                  className={`w-full bg-gray-800 border border-gray-700 rounded-md p-3 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-white resize-none text-lg ${isPostDeadlineExceeded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={isPostDeadlineExceeded ? "受付時間を終了しました" : (hasPosted ? "投稿を編集..." : "ネタを投稿する（1人1回まで）")}
                  rows={4}
                />
                <div className="flex justify-between items-center mt-3">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={isPostDeadlineExceeded}
                  className={`text-gray-400 hover:text-yellow-400 p-2 rounded-full hover:bg-gray-800 transition-colors ${isPostDeadlineExceeded ? 'opacity-50 cursor-not-allowed hover:text-gray-400' : ''}`}
                >
                  <Smile className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-3">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        if (posts.length > 0) setNewPostContent(posts[0].content);
                      }}
                      className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
                    >
                      キャンセル
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!newPostContent.trim() || isSubmitting || isPostDeadlineExceeded}
                    className={`bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-full transition duration-300 flex items-center shadow-lg hover:shadow-yellow-500/20 ${(!newPostContent.trim() || isSubmitting || isPostDeadlineExceeded) ? 'bg-gray-600 cursor-not-allowed shadow-none' : 'hover:bg-yellow-400 transform hover:-translate-y-0.5'}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isPostDeadlineExceeded ? '終了' : (isSubmitting ? (isEditing ? '更新中...' : '投稿中...') : (isEditing ? '更新する' : '投稿する'))}
                  </button>
                </div>
                </div>
                {postError && <p className="text-red-500 text-sm mt-2 text-right flex justify-end items-center"><AlertTriangle className="w-4 h-4 mr-1"/>{postError}</p>}

                {showEmojiPicker && !isPostDeadlineExceeded && (
                <div className="absolute z-10 mt-2 right-0 sm:right-auto shadow-2xl rounded-lg overflow-hidden">
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
            {!loading && !hasPosted && contestStatus === 'ongoing' && !user && (
               <div className="text-center py-10 text-gray-500">投稿はありません。</div>
            )}
          </div>
        )}

        {contestStatus === 'voting' && (
          <div>
             {user && userHasVoted && (
              <div className="p-4 border-b border-gray-700">
                <div className="bg-blue-900/50 text-blue-300 p-3 rounded-lg flex items-center text-sm border border-blue-800">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <p>この大会には投票済みです。{isJudgeMode && "（審査員として再投票可能です）"}</p>
                </div>
              </div>
             )}
             {/* 投票締切後のアラート */}
             {isVoteDeadlineExceeded && (
                 <div className="p-4 border-b border-gray-700">
                    <div className="bg-red-900/50 text-red-300 p-3 rounded-lg flex items-center text-sm border border-red-800">
                        <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <p>投票期間は終了しました。結果発表をお待ちください。</p>
                    </div>
                 </div>
             )}
            <div className="divide-y divide-gray-800">
            {posts.length > 0 ? (
              posts.map((post) => {
                const isMyPost = user && post.user_id === user.id;
                const showVoteUI = canVote || (isJudgeMode && contestStatus === 'voting');
                const voteUIDisabled = userHasVoted && !isJudgeMode;
                return (
                  <div key={post.id} className={`p-4 transition-colors hover:bg-gray-800/30 ${isMyPost ? 'bg-yellow-900/10' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* 左側: 投票コントロール */}
                      {showVoteUI ? (
                          <div className="flex flex-col items-center min-w-[40px] pt-1 gap-1">
                             <VoteHearts 
                                postId={post.id} 
                                initialVotes={votes[post.id] || 0} 
                                onVoteChange={handleVoteChange} 
                                disabled={voteUIDisabled || isVoteDeadlineExceeded} 
                            />
                            <span className={`text-sm font-bold ${votes[post.id] > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                {votes[post.id] || 0}
                            </span>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center min-w-[40px] pt-1 gap-1">
                             <Heart className={`h-6 w-6 ${votes[post.id] > 0 ? 'text-red-600 fill-red-600' : 'text-gray-600'}`} />
                             <span className="text-sm text-gray-500">{votes[post.id] || 0}</span>
                          </div>
                      )}

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-300 text-sm">匿名さん</span>
                          <TimeAgo timestamp={post.created_at} />
                        </div>
                        <div className="text-lg text-gray-100 leading-relaxed whitespace-pre-wrap">
                            {post.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : ( <div className="text-center py-12 text-gray-500">投稿がありません。</div> )}
            </div>
          </div>
        )}

        {contestStatus === 'closed' && (
          <div className="divide-y divide-gray-800">
            {results.length > 0 ? (
              results.map((result, index) => {
                const isMyPost = user && result.user.screen_name === user.screen_name;
                return (
                <div
                  key={result.post_id}
                  className={`p-4 transition-colors ${index < results.length - 1 ? 'border-b border-gray-700' : ''} ${isMyPost ? 'bg-yellow-900/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 順位 */}
                    <div className="w-12 text-center pt-1 flex-shrink-0 flex flex-col items-center">
                      {result.rank === 1 && <Trophy className="h-8 w-8 text-yellow-400 mb-1 drop-shadow-lg" />}
                      {result.rank === 2 && <Trophy className="h-7 w-7 text-gray-300 mb-1" />}
                      {result.rank === 3 && <Trophy className="h-6 w-6 text-amber-600 mb-1" />}
                      <span className={`font-bold text-xl ${
                        result.rank && result.rank <= 3 ? 'text-yellow-300' : 'text-gray-500'
                      }`}>{result.rank ? `${result.rank}位` : '-'}</span>
                    </div>

                    <div className="flex-grow min-w-0">
                        <div className="flex items-center mb-2">
                            <img
                            src={result.user.profile_image_url || `https://via.placeholder.com/40`}
                            alt={result.user.screen_name}
                            className="w-8 h-8 rounded-full mr-2 border border-gray-700"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                            />
                            <div className="flex flex-col">
                                <a href={`/profile/${encodeURIComponent(result.user.screen_name)}`} className="font-bold text-white hover:underline leading-tight">
                                {result.user.screen_name}
                                </a>
                                <TimeAgo timestamp={result.created_at} />
                            </div>
                        </div>
                        
                        <div className="text-lg text-gray-100 leading-relaxed whitespace-pre-wrap mb-3">
                            {result.content}
                        </div>

                        {/* アクションバー */}
                        <div className="flex items-center gap-6 text-gray-500 text-sm">
                            <div className="flex items-center text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded-full">
                                <Heart className="h-4 w-4 mr-1 fill-current" />
                                {result.score} <span className="text-xs font-normal ml-1 opacity-70">pts</span>
                            </div>
                            {/* ブックマークボタン等が必要であればここに追加 */}
                        </div>

                        {/* 投票者リスト (詳細) */}
                        {result.voters && result.voters.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-800/50 text-xs text-gray-500">
                            <span className="font-medium mr-2 opacity-70">投票した人:</span>
                            <div className="inline-flex flex-wrap gap-1">
                                {result.voters.map((voter, vIndex) => (
                                    <span key={vIndex} className="inline-flex items-center">
                                    <a
                                        href={`/profile/${encodeURIComponent(voter.screen_name)}`}
                                        className={`hover:underline hover:text-gray-300 ${voter.is_judge ? 'font-bold text-yellow-500' : ''}`}
                                    >
                                        {voter.screen_name}
                                    </a>
                                    <span className="opacity-50 ml-0.5">({voter.count})</span>
                                    {vIndex < result.voters.length - 1 && <span className="mx-1 opacity-30">,</span>}
                                    </span>
                                ))}
                            </div>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
                );
              })
            ) : (
               <div className="text-center py-16 text-gray-500">
                   <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                   <p>結果データがありません。</p>
               </div>
            )}
          </div>
        )}

        {contestStatus === 'upcoming' && ( <div className="text-center py-10 text-gray-500">この大会はまだ開始されていません。</div> )}
      </div>

      {showVoteBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur border-t border-gray-700 p-4 shadow-2xl z-50">
          <div className="container mx-auto max-w-2xl flex justify-between items-center gap-4">
            <div className={`text-sm px-4 py-2 rounded-full font-bold flex-shrink-0 ${totalVotes >= 10 || isJudgeMode ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              合計: <span className="text-lg mx-1">{totalVotes}</span> 票 {isJudgeMode ? '(審査員)' : '/ 10票以上'}
            </div>
            <button
              onClick={submitVotes}
              disabled={isVoteSubmitDisabled}
              className={`flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg hover:shadow-green-500/20 flex items-center justify-center ${isVoteSubmitDisabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none' : 'hover:bg-green-500 hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isSubmittingVotes ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
              {isVoteDeadlineExceeded ? '投票終了' : (isSubmittingVotes ? '送信中...' : isJudgeMode ? '審査員票を確定' : '投票を確定する')}
            </button>
          </div>
          {voteSubmitMessage && (
            <div className={`mt-2 text-center text-sm font-bold animate-fade-in ${voteSubmitMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {voteSubmitMessage.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}