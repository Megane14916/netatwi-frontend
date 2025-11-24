'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Smile, Heart, Info, Vote as VoteIcon, CheckCircle, Trophy, ShieldCheck, Clock, Check, X, Users, Bookmark, AlertTriangle,AlertCircle, Loader2, Share2, Award, Quote } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TimeAgo from '@/components/TimeAgo';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import Twemoji from '@/components/Twemoji';
import dayjs from 'dayjs';
import JudgeLoginButton from '@/components/venue/JudgeLoginButton';
import Countdown from '@/components/venue/Countdown';

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
  awards: string[]; // 受賞バッジ
}

// 審査員賞データ型
interface JudgeAwardResult {
    judge: {
        screen_name: string;
        profile_image_url: string | null;
    };
    comment: string | null;
    post: {
        post_id: number;
        content: string;
        user: { screen_name: string; profile_image_url: string | null };
        created_at: string;
    };
}

type ContestStatus = 'upcoming' | 'ongoing' | 'voting' | 'closed';

// --- UIコンポーネント ---

const GeneralVoteButton = ({ postId, isLiked, onToggle, disabled }: { postId: number, isLiked: boolean, onToggle: (postId: number, val: number) => void, disabled: boolean }) => (
  <button
    onClick={() => onToggle(postId, isLiked ? 0 : 1)}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group ${
      isLiked ? 'text-pink-500 bg-pink-500/10 border border-pink-500/30' : 'text-gray-500 hover:bg-pink-500/10 hover:text-pink-500 border border-transparent hover:border-pink-500/30'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
    <span className="text-sm font-bold">{isLiked ? 'いいね！' : 'いいね'}</span>
  </button>
);

const JudgeVoteSelector = ({ postId, currentScore, onSelect, disabled }: { postId: number, currentScore: number, onSelect: (postId: number, val: number) => void, disabled: boolean }) => (
  <div className="mt-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
    <div className="flex justify-between items-center mb-2 px-1">
      <span className="text-xs text-indigo-300 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 審査員評価</span>
      <span className="text-xs text-gray-500">現在: <span className={`font-bold text-sm ${currentScore > 0 ? 'text-white' : 'text-gray-600'}`}>{currentScore}</span> 点</span>
    </div>
    <div className="flex flex-wrap gap-1 justify-center">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
        <button key={score} onClick={() => onSelect(postId, score)} disabled={disabled} className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all ${currentScore === score ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-lg transform scale-110' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{score}</button>
      ))}
    </div>
  </div>
);

// 審査員賞選出コンポーネント
const JudgeAwardSelector = ({ postId, isSelected, onSelect, comment, onCommentChange, disabled }: { postId: number, isSelected: boolean, onSelect: (postId: number) => void, comment: string, onCommentChange: (val: string) => void, disabled: boolean }) => (
    <div className="mt-2 px-1">
        <label className={`flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
            <input 
                type="radio" 
                name="judgeAward" 
                checked={isSelected} 
                onChange={() => onSelect(postId)} 
                disabled={disabled}
                className="form-radio h-4 w-4 text-yellow-500 border-gray-600 bg-gray-700 focus:ring-yellow-500"
            />
            <span className={`ml-2 text-sm font-bold flex items-center ${isSelected ? 'text-yellow-400' : 'text-gray-500'}`}>
                <Trophy className="w-4 h-4 mr-1" /> 審査員賞として選出
            </span>
        </label>
        {isSelected && (
            <div className="mt-2 ml-6 animate-fade-in">
                <textarea
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    placeholder="選評コメントを入力してください..."
                    className="w-full bg-gray-900 border border-yellow-500/30 rounded p-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    rows={2}
                    disabled={disabled}
                />
            </div>
        )}
    </div>
);

// 自分の投稿表示用
const MyPostDisplay = ({ post, isEditing, setIsEditing, isDeadlinePassed, user }: any) => (
  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
    <div className="flex items-start gap-3">
      <div className="flex-none">
         <img src={user?.profile_image_url || 'https://via.placeholder.com/40'} alt={user?.screen_name} className="w-10 h-10 rounded-full bg-gray-700 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')} />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div><span className="font-bold text-white mr-2">{user?.screen_name}</span><span className="text-xs text-gray-500 border border-gray-600 px-1.5 py-0.5 rounded">あなた</span></div>
          <TimeAgo timestamp={post.created_at} />
        </div>
        <div className="mt-1"><Twemoji text={post.content} /></div>
      </div>
    </div>
    {!isEditing && !isDeadlinePassed && ( <div className="text-right mt-2"> <button onClick={() => setIsEditing(true)} className="text-sm text-yellow-400 hover:underline flex items-center justify-end ml-auto gap-1"> <div className="w-4 h-4" /> 編集する </button> </div> )}
    {!isEditing && isDeadlinePassed && ( <div className="text-right mt-2 text-xs text-red-400 flex justify-end items-center"> <Clock className="w-3 h-3 mr-1" /> 編集受付終了 </div> )}
  </div>
);

export default function VenueDetailPage() {
  const params = useParams();
  const contestId = parseInt(params?.id as string, 10);
  const { user, judgeContests, refetchUser } = useAuth();

  const [contest, setContest] = useState<Contest | null>(null);
  const [contestStatus, setContestStatus] = useState<ContestStatus | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // 結果データ
  const [results, setResults] = useState<ResultPost[]>([]);
  const [judgeAwardsResults, setJudgeAwardsResults] = useState<JudgeAwardResult[]>([]); // 審査員賞データ
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPosters, setTotalPosters] = useState<number | null>(null);
  const [totalVoters, setTotalVoters] = useState<number | null>(null);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [hasPosted, setHasPosted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [votes, setVotes] = useState<{ [postId: number]: number }>({});
  // 審査員賞選択状態: { postId: 123, comment: "..." }
  const [judgeAwardSelection, setJudgeAwardSelection] = useState<{ postId: number | null, comment: string }>({ postId: null, comment: '' });
  
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
  const [voteSubmitMessage, setVoteSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPostDeadlineExceeded, setIsPostDeadlineExceeded] = useState(false);
  const [isVoteDeadlineExceeded, setIsVoteDeadlineExceeded] = useState(false);
  
  // 結果画面のタブ
  const [resultTab, setResultTab] = useState<'ranking' | 'awards'>('ranking');

  const isJudgeMode = judgeContests.includes(contestId);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); setVoteSubmitMessage(null); setUserHasVoted(false);
      setPosts([]); setResults([]); setHasPosted(false); setIsEditing(false);
      setTotalPosters(null); setTotalVoters(null); 

      const contestRes = await fetch(`${API_PREFIX}/api/contests/${contestId}`, { credentials: 'include' });
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
        setJudgeAwardsResults(resultsData.judgeAwards || []); // 審査員賞データ
        setTotalPosters(resultsData.totalPosters);
        setTotalVoters(resultsData.totalVoters);
        // 審査員賞があればデフォルトタブを審査員賞にするなどの工夫も可
      } else {
        const postsRes = await fetch(`${API_PREFIX}/api/contests/${contestId}/posts`, { credentials: 'include', cache: 'no-store' });
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
               const initialVotes: { [key: number]: number } = {};
               let currentTotal = 0;
               allPosts.forEach(post => { 
                   const voteVal = post.myVotes || 0;
                   initialVotes[post.id] = voteVal;
                   currentTotal += voteVal;
               });
               setVotes(initialVotes); 
               setTotalVotes(currentTotal);
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

  useEffect(() => { if (contestId) fetchData(); }, [contestId, user]);

  useEffect(() => {
    if (!contest) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setIsPostDeadlineExceeded(now >= new Date(contest.endTime));
      setIsVoteDeadlineExceeded(now >= new Date(contest.votingEndTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostDeadlineExceeded) { alert('操作できません'); return; }
    if (!newPostContent.trim() || !user) return;
    setIsSubmitting(true); setPostError(null);
    const url = isEditing ? `${API_PREFIX}/api/contests/${contestId}/posts/${posts[0]?.id}` : `${API_PREFIX}/api/contests/${contestId}/posts`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newPostContent }), credentials: 'include' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      const data = await res.json();
      setNewPostContent(''); setPosts([{ ...data, user_id: user.id }]); setHasPosted(true); setIsEditing(false);
      alert('投稿しました！');
    } catch (err: any) { setPostError(err.message); } finally { setIsSubmitting(false); }
  };
  const onEmojiClick = (emojiData: EmojiClickData) => { setNewPostContent(prevInput => prevInput + emojiData.emoji); setShowEmojiPicker(false); };

  const handleVoteChange = (postId: number, newCount: number) => { 
      if (userHasVoted && !isJudgeMode) { alert("変更できません。"); return; }
      setVotes(prev => { 
        const updated = { ...prev, [postId]: newCount }; 
        setTotalVotes(Object.values(updated).reduce((sum, c) => sum + c, 0)); 
        return updated; 
      }); 
      setVoteSubmitMessage(null); 
  };

  // 審査員賞選択
  const handleJudgeAwardSelect = (postId: number) => {
      setJudgeAwardSelection(prev => prev.postId === postId ? { postId: null, comment: '' } : { postId, comment: '' });
  };
  const handleJudgeCommentChange = (val: string) => {
      setJudgeAwardSelection(prev => ({ ...prev, comment: val }));
  }
  
  const handleSubmitVotes = async () => {
    if (isVoteDeadlineExceeded) { alert('終了しました。'); return; }
    if(!confirm('投票を確定しますか？')) return;
    setIsSubmittingVotes(true); setVoteSubmitMessage(null);
    
    // 審査員賞データを含めて送信
    const payload: any = { votes };
    if (isJudgeMode && judgeAwardSelection.postId) {
        payload.judgeAward = judgeAwardSelection;
    }

    try {
      const response = await fetch(`${API_PREFIX}/api/contests/${contestId}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVoteSubmitMessage({ type: 'success', text: data.message });
      setUserHasVoted(true);
    } catch (err: any) { setVoteSubmitMessage({ type: 'error', text: err.message });
    } finally { setIsSubmittingVotes(false); }
  };

  const handleBookmarkToggle = async (postId: number) => { /* 省略: 既存と同じ */ };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400"><Loader2 className="animate-spin mr-2"/>読み込み中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400"><AlertCircle className="mr-2"/>{error}</div>;
  if (!contest) return null;

  const isPostPeriod = !isPostDeadlineExceeded && contestStatus === 'ongoing';
  const isVotePeriod = !isVoteDeadlineExceeded && contestStatus === 'voting';
  const canVote = contestStatus === 'voting' && user && !userHasVoted;
  const showVoteUI = (contestStatus === 'voting' && user && !userHasVoted) || (isJudgeMode && contestStatus === 'voting');
  const voteUIDisabled = userHasVoted && !isJudgeMode;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 relative">
      {isJudgeMode && contestStatus === 'voting' && ( <div className="mb-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg flex items-center text-sm sticky top-16 z-40 shadow-lg"> <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0" /> 現在、審査員として投票中です。 </div> )}
      
      <div className={`border border-gray-700 rounded-lg bg-gray-900 ${showVoteUI ? 'pb-8' : 'pb-4'}`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-start mb-2">
             <div><h1 className="text-2xl font-bold text-yellow-400">{contest.name}</h1>{contest.hasTheme && <div className="text-lg text-yellow-400 font-medium">お題: {contest.theme}</div>}</div>
             {!isJudgeMode && isVotePeriod && (<JudgeLoginButton contestId={contestId} onLoginSuccess={async()=>{await refetchUser(); await fetchData();}} />)}
             {isJudgeMode && (<span className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-bold">審査員モード</span>)}
          </div>
          <div className="mt-2 text-sm text-gray-500 flex gap-3 flex-wrap"><span className="flex items-center"><Users className="w-3 h-3 mr-1"/>審査員倍率: {contest.judgeVoteRatio}倍</span></div>
        </div>
        
        {/* 投稿期間 */}
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
                            user={user}
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

        {/* 投票期間 */}
        {contestStatus === 'voting' && (
          <div>
            <div className="divide-y divide-gray-800">
            {posts.length > 0 ? (
              posts.map((post) => {
                return (
                  <div key={post.id} className={`p-4 transition-colors hover:bg-gray-800/30`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-300 text-sm">匿名さん</span>
                          <TimeAgo timestamp={post.created_at} />
                        </div>
                        <div className="text-lg text-gray-100 leading-relaxed whitespace-pre-wrap">{post.content}</div>
                      </div>
                    </div>
                    {/* 投票UI */}
                    <div className="flex flex-col items-end mt-2">
                      {showVoteUI && (
                        isJudgeMode ? (
                           <>
                             <JudgeVoteSelector postId={post.id} currentScore={votes[post.id] || 0} onSelect={handleVoteChange} disabled={isVoteDeadlineExceeded} />
                             <JudgeAwardSelector 
                                postId={post.id}
                                isSelected={judgeAwardSelection.postId === post.id}
                                onSelect={handleJudgeAwardSelect}
                                comment={judgeAwardSelection.comment}
                                onCommentChange={handleJudgeCommentChange}
                                disabled={isVoteDeadlineExceeded}
                             />
                           </>
                        ) : (
                           <GeneralVoteButton postId={post.id} isLiked={votes[post.id] === 1} onToggle={handleVoteChange} disabled={voteUIDisabled || isVoteDeadlineExceeded} />
                        )
                      )}
                    </div>
                  </div>
                );
              })
            ) : ( <div className="text-center py-12 text-gray-500">投稿がありません。</div> )}
            </div>
          </div>
        )}

        {/* 結果発表 */}
        {contestStatus === 'closed' && (
          <div>
              <div className="flex border-b border-gray-800">
                  <button onClick={()=>setResultTab('ranking')} className={`flex-1 py-3 text-sm font-bold ${resultTab==='ranking' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>ランキング</button>
                  <button onClick={()=>setResultTab('awards')} className={`flex-1 py-3 text-sm font-bold ${resultTab==='awards' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>審査員賞</button>
              </div>

              {resultTab === 'ranking' && (
                <div className="divide-y divide-gray-800">
                    {results.map((result, index) => (
                        <div key={result.post_id} className="p-4 hover:bg-gray-800/30">
                            <div className="flex items-start gap-3">
                                <div className="w-10 text-center pt-1"><span className="font-bold text-xl text-yellow-300">{result.rank}位</span></div>
                                <div className="flex-grow">
                                    {/* 受賞バッジ表示 */}
                                    {result.awards && result.awards.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {result.awards.map((award, i) => (
                                                <span key={i} className="bg-indigo-600/90 text-white text-xs px-2 py-0.5 rounded flex items-center shadow-sm border border-indigo-400/50"><Trophy className="w-3 h-3 mr-1"/>{award}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-lg text-gray-100 mb-2">{result.content}</div>
                                    <div className="flex justify-end gap-4 text-sm text-gray-500">
                                        <span className="flex items-center text-red-400"><Heart className="w-4 h-4 mr-1"/>{result.score}</span>
                                    </div>
                                    {/* 投票者リスト (既存) */}
                                    <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-500">
                                        <span className="font-bold mr-1">Voters:</span>
                                        {result.voters.map((v, i) => (
                                            <span key={i} className={`mr-2 ${v.is_judge ? 'bg-yellow-900/50 text-yellow-300 px-1 rounded' : ''}`}>
                                                {v.screen_name} {v.is_judge && `(${v.count})`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}

              {resultTab === 'awards' && (
                  <div className="space-y-6 p-6">
                      {judgeAwardsResults.length === 0 && <div className="text-center text-gray-500">審査員賞はありません。</div>}
                      {judgeAwardsResults.map((award, idx) => (
                          <div key={idx} className="bg-gray-800/40 border border-indigo-500/30 rounded-xl p-4 relative">
                              <div className="absolute -top-3 -left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center border border-indigo-400">
                                  <Award className="w-4 h-4 mr-1" /> {award.judge.screen_name}賞
                              </div>
                              
                              {/* 審査員コメント (引用リツイート風) */}
                              <div className="mb-4 pl-2">
                                  <div className="flex items-center gap-2 mb-2">
                                      <img src={award.judge.profile_image_url || ''} className="w-8 h-8 rounded-full border border-indigo-500/50"/>
                                      <span className="font-bold text-indigo-200">{award.judge.screen_name}</span>
                                  </div>
                                  <p className="text-white text-lg leading-relaxed"><Quote className="inline w-4 h-4 text-gray-500 mr-1 mb-2" />{award.comment || "（コメントなし）"}</p>
                              </div>

                              {/* 引用された投稿 */}
                              <div className="border border-gray-600 rounded-lg p-3 bg-gray-900/50 text-gray-300 text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                      <img src={award.post.user.profile_image_url || ''} className="w-5 h-5 rounded-full"/>
                                      <span className="font-bold">{award.post.user.screen_name}</span>
                                      <span className="text-gray-500">· {dayjs(award.post.created_at).format('MM/DD')}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{award.post.content}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        )}
      </div>

      {/* 投票確定ボタン (最下部) */}
      {showVoteUI && (
        <div className="mt-8 pb-12">
           <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg text-center">
               <p className="text-gray-400 mb-4">
                   {isJudgeMode ? "全ての投稿への採点が終わったら、投票を確定してください。" : "「いいね」を付け終わったら、投票を確定してください。"}
               </p>
               <button
                onClick={handleSubmitVotes}
                disabled={isSubmittingVotes || isVoteDeadlineExceeded || (userHasVoted && !isJudgeMode)}
                className={`w-full max-w-md mx-auto py-3 px-6 rounded-full font-bold text-lg flex items-center justify-center transition-all ${
                    (isSubmittingVotes || (userHasVoted && !isJudgeMode)) 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/30'
                }`}
               >
                   {isSubmittingVotes ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2"/>}
                   {userHasVoted && !isJudgeMode ? '投票済みです' : '投票を確定する'}
               </button>
               {voteSubmitMessage && (
                 <div className={`mt-4 font-bold ${voteSubmitMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {voteSubmitMessage.text}
                 </div>
               )}
           </div>
        </div>
      )}
    </div>
  );
}