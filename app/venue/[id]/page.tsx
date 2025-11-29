'use client';

import { useState, useEffect, useRef,useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Smile, Heart, Info, CheckCircle, Trophy, ShieldCheck, Clock, X, User,Users, AlertTriangle,AlertCircle, Loader2, Award,  Image as ImageIcon ,UserStar} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TimeAgo from '@/components/TimeAgo';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle, SkinTonePickerLocation } from 'emoji-picker-react';
import Twemoji from '@/components/Twemoji';
import dayjs from 'dayjs';
import JudgeLoginButton from '@/components/venue/JudgeLoginButton';
import ImageGrid from '@/components/ImageGrid';
import ResultPostCard from '@/components/ResultPostCard';
import RichTextEditor, { RichTextEditorHandle } from '@/components/RichTextEditor';

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
  generalVoteWeight: number;
  judgeMaxScore: number
  allowImages: boolean;
}

interface Post {
  id: number;
  content: string;
  images?: string[]; // 画像URLリスト
  created_at: string;
  user_id: number;
  myVotes: number;
  myJudgeAward?: boolean;
  myJudgeComment?: string | null;
}

interface Voter {
  screen_name: string;
  name: string;
  count: number;
  is_judge: boolean;
}

interface JudgeObj {
    screen_name: string;
    name: string;
    profile_image_url: string | null;
}

interface ResultPost {
  rank: number | null;
  post_id: number;
  content: string;
  images?: string[];
  created_at: string;
  score: number;
  user: {
    screen_name: string;
    name: string;
    profile_image_url: string | null;
  };
  voters: Voter[];
  bookmarkCount: number;
  isBookmarked: boolean;
  awards: string[]; 
}

interface JudgeAwardResult {
    judge: JudgeObj;
    comment: string | null;
    post: {
        post_id: number;
        content: string;
        images?: string[];
        user: { screen_name: string; name: string; profile_image_url: string | null };
        created_at: string;
    };
}

type ContestStatus = 'upcoming' | 'ongoing' | 'voting' | 'closed';

// --- UIコンポーネント ---

// 画像グリッドコンポーネント


const GeneralVoteButton = ({ postId, isLiked, onToggle, disabled }: { postId: number, isLiked: boolean, onToggle: (postId: number, val: number) => void, disabled: boolean }) => (
  <button
    onClick={() => onToggle(postId, isLiked ? 0 : 1)}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group ${
      isLiked 
        ? 'text-pink-500 bg-pink-500/10 border border-pink-500/30' 
        : 'text-gray-500 hover:bg-pink-500/10 hover:text-pink-500 border border-transparent hover:border-pink-500/30'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
    <span className="text-sm font-bold">{isLiked ? 'いいね！' : 'いいね'}</span>
  </button>
);

const JudgeVoteSelector = ({ postId, currentScore, onSelect, disabled, maxScore }: { postId: number, currentScore: number, onSelect: (postId: number, val: number) => void, disabled: boolean, maxScore: number }) => {
  return (
    <div className="mt-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs text-indigo-300 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 審査員評価</span>
        <span className="text-xs text-gray-500">満点: {maxScore}</span>
      </div>
      <div className="flex items-center gap-2">
          <input 
             type="number" 
             min="0" 
             max={maxScore} 
             step="0.1" 
             value={currentScore || ''} 
             onChange={(e) => {
                 const val = parseFloat(e.target.value);
                 onSelect(postId, isNaN(val) ? 0 : Math.min(val, maxScore));
             }}
             disabled={disabled}
             className="w-20 bg-gray-900 border border-indigo-500/50 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-indigo-400"
             placeholder="0"
          />
          <span className="text-sm text-gray-400">点</span>
      </div>
    </div>
  );
};

const JudgeAwardSelector = ({ postId, isSelected, onSelect, comment, onCommentChange, disabled }: { postId: number, isSelected: boolean, onSelect: (postId: number) => void, comment: string, onCommentChange: (val: string) => void, disabled: boolean }) => (
    <div className="mt-2 px-1 border-t border-gray-700 pt-2 w-full">
        <label className={`flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
            <input type="radio" name="judgeAward" checked={isSelected} onChange={() => onSelect(postId)} disabled={disabled} className="w-4 h-4 text-yellow-500 border-gray-600 bg-gray-700 focus:ring-yellow-500 flex-shrink-0"/>
            <span className={`ml-2 text-xs font-bold flex items-center ${isSelected ? 'text-yellow-400' : 'text-gray-500'}`}><Trophy className="w-3 h-3 mr-1" /> 審査員賞に選ぶ</span>
        </label>
        {isSelected && (
            <div className="mt-2 ml-6 animate-fade-in w-full pr-6">
                <textarea value={comment} onChange={(e) => onCommentChange(e.target.value)} placeholder="選評コメントを入力してください..." className="w-full bg-gray-900 border border-yellow-500/30 rounded p-2 text-sm text-white focus:outline-none focus:border-yellow-500" rows={2} disabled={disabled}/>
            </div>
        )}
    </div>
);

// 自分の投稿表示用
const MyPostDisplay = ({ post, isEditing, onStartEdit, isDeadlinePassed, user }: any) => (
  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
    <div className="flex items-start gap-3">
      <div className="flex-none"><img src={user?.profile_image_url || 'https://via.placeholder.com/40'} alt={user?.screen_name} className="w-10 h-10 rounded-full bg-gray-700 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')} /></div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div><span className="font-bold text-white mr-2">{user?.screen_name}</span><span className="text-xs text-gray-500 border border-gray-600 px-1.5 py-0.5 rounded">あなた</span></div>
          <TimeAgo timestamp={post.created_at} />
        </div>
        <div className="mt-1"><Twemoji text={post.content} /></div>
        {post.images && <ImageGrid images={post.images} />}
      </div>
    </div>
    {!isEditing && !isDeadlinePassed && ( 
      <div className="text-right mt-2"> 
        <button onClick={onStartEdit} className="text-sm text-yellow-400 hover:underline flex items-center justify-end ml-auto gap-1"> 
          <div className="w-4 h-4" /> 編集する 
        </button> 
      </div> 
    )}
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
  
  const [results, setResults] = useState<ResultPost[]>([]);
  const [judgeAwardsResults, setJudgeAwardsResults] = useState<JudgeAwardResult[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPosters, setTotalPosters] = useState<number | null>(null);
  const [totalVoters, setTotalVoters] = useState<number | null>(null);
  const [totalJudges, setTotalJudges] = useState<number | null>(null);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [hasPosted, setHasPosted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 画像アップロード用
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [votes, setVotes] = useState<{ [postId: number]: number }>({});
  const [judgeAwardSelection, setJudgeAwardSelection] = useState<{ postId: number | null, comment: string }>({ postId: null, comment: '' });
  
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
  const [voteSubmitMessage, setVoteSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPostDeadlineExceeded, setIsPostDeadlineExceeded] = useState(false);
  const [isVoteDeadlineExceeded, setIsVoteDeadlineExceeded] = useState(false);
  
  const [resultTab, setResultTab] = useState<'ranking' | 'awards'>('ranking');

  const isJudgeMode = judgeContests.includes(contestId);

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const editorRef = useRef<RichTextEditorHandle>(null);

  const maxTotalScore = useMemo(() => {
      if (!contest || !results || results.length === 0) return 0;
      
      // 投票した審査員のユニーク数をカウント
      const uniqueJudges = new Set<string>();
      results.forEach(post => {
          post.voters.forEach(voter => {
              if (voter.is_judge) uniqueJudges.add(voter.screen_name);
          });
      });
      
      return (uniqueJudges.size * contest.judgeMaxScore) + contest.generalVoteWeight;
    }, [contest, results]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('voted') === 'true') {
              setShowSuccessBanner(true);
              // URLをクリーンにする
              window.history.replaceState({}, '', window.location.pathname);
              // 数秒後にバナーを消す
              setTimeout(() => setShowSuccessBanner(false), 5000);
          }
      }
  }, []);

  // 絵文字ピッカーの外側クリック検知
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (
            showEmojiPicker &&
            emojiPickerRef.current &&
            !emojiPickerRef.current.contains(event.target as Node) &&
            emojiButtonRef.current &&
            !emojiButtonRef.current.contains(event.target as Node)
        ) {
            setShowEmojiPicker(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);


  // 画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        const totalImages = selectedImages.length + files.length;
        if (totalImages > 4) {
            alert("画像は最大4枚までです。");
            return;
        }
        
        const newImages = [...selectedImages, ...files];
        setSelectedImages(newImages);

        // プレビューURL生成
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviews]);
    }
  };

  // 画像削除処理
  const removeImage = (index: number) => {
      const targetUrl = previewUrls[index];
      
      // 1. previewUrls から削除 (非破壊的)
      setPreviewUrls(prev => {
          const newArr = prev.filter((_, i) => i !== index);
          return newArr;
      });

      // 2. Blobだった場合 (新規画像)、selectedImages からも対応するファイルを削除
      if (targetUrl.startsWith('blob:')) {
          // targetUrlがプレビュー内の何番目のBlobかを探す
          // (URL.createObjectURL で生成されたURLは一意なので、それを使って特定も可能だが、
          //  selectedImagesにはURL情報がないので、インデックスで同期をとる必要がある)
          
          // 削除前の配列において、index番目より前にあるBlobの数を数える
          const blobIndex = previewUrls.slice(0, index).filter(u => u.startsWith('blob:')).length;
          
          setSelectedImages(prev => {
              const newArr = [...prev];
              newArr.splice(blobIndex, 1);
              return newArr;
          });
          
          URL.revokeObjectURL(targetUrl); // メモリ解放
      }
  };



  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); setVoteSubmitMessage(null); setUserHasVoted(false);
      setPosts([]); setResults([]); setHasPosted(false); setIsEditing(false);
      setTotalPosters(null); setTotalVoters(null); setTotalJudges(null);

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
        setJudgeAwardsResults(resultsData.judgeAwards || []);
        setTotalPosters(resultsData.totalPosters);
        setTotalVoters(resultsData.totalVoters);
        setTotalJudges(resultsData.totalJudges);
        // if (resultsData.judgeAwards && resultsData.judgeAwards.length > 0) setResultTab('awards');
      } else {
        const postsRes = await fetch(`${API_PREFIX}/api/contests/${contestId}/posts`, { credentials: 'include', cache: 'no-store' });
        if (!postsRes.ok) throw new Error('投稿一覧の取得に失敗しました');
        const postsData = await postsRes.json();
        const allPosts: Post[] = postsData.posts;
        setUserHasVoted(postsData.userHasVotedInContest);
        setTotalPosters(postsData.totalPosters);

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
               
               // 審査員賞の復元ロジック
               let awardPostId: number | null = null;
               let awardComment = '';

               allPosts.forEach(post => { 
                   const voteVal = post.myVotes || 0;
                   initialVotes[post.id] = voteVal;
                   currentTotal += voteVal;
                   
                   // APIから返ってきた審査員賞情報をStateにセット
                   if (post.myJudgeAward) {
                       awardPostId = post.id;
                       awardComment = post.myJudgeComment || '';
                   }
               });
               setVotes(initialVotes); 
               setTotalVotes(currentTotal);
               if (awardPostId) {
                   setJudgeAwardSelection({ postId: awardPostId, comment: awardComment });
               }
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

  const handleStartEdit = () => {
    if (posts.length > 0) {
      const post = posts[0];
      setNewPostContent(post.content);
      setPreviewUrls(post.images || []);
      setSelectedImages([]); // 新規追加分はリセット
      setIsEditing(true);
    }
  };

  // 投稿処理 (FormDataを使用)
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostDeadlineExceeded) return;
    // エディタの内容は state (newPostContent) に同期されている前提
    if ((!newPostContent.trim() && previewUrls.length === 0) || !user) return;

    setIsSubmitting(true); setPostError(null);
    const url = isEditing ? `${API_PREFIX}/api/contests/${contestId}/posts/${posts[0]?.id}` : `${API_PREFIX}/api/contests/${contestId}/posts`;
    const method = isEditing ? 'PUT' : 'POST';

    const formData = new FormData();
    formData.append('content', newPostContent);
    
    if (isEditing) {
        // Blob以外のURL（=既存の画像）のみをリスト化して送信
        const keptImages = previewUrls.filter(url => !url.startsWith('blob:'));
        formData.append('kept_images', JSON.stringify(keptImages));
    }
    selectedImages.forEach((file) => formData.append('images', file));

    try {
      const res = await fetch(url, {
        method,
        body: formData, // JSONではなくFormDataを送信
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '投稿に失敗しました');
      }
      const data = await res.json();
      const updatedPost = { ...data, user_id: user.id };
      
      setNewPostContent('');
      setSelectedImages([]);
      setPreviewUrls([]);
      setPosts([updatedPost]); setHasPosted(true); setIsEditing(false); setPostError(null);
      alert('投稿しました！');
    } catch (err: any) {
      setPostError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onEmojiClick = (emojiData: EmojiClickData) => {
      // ref経由でエディタに絵文字画像を挿入
      if (editorRef.current) {
          editorRef.current.insertEmoji(emojiData.emoji);
      } else {
          // フォールバック (textarea使用時など)
          setNewPostContent(prev => prev + emojiData.emoji);
      }
  };

  const handleVoteChange = (postId: number, newCount: number) => { 
      // 変更点: 一般投票でも再投票可能にするため、userHasVoted チェックを削除
      setVotes(prev => { 
        const updated = { ...prev, [postId]: newCount }; 
        setTotalVotes(Object.values(updated).reduce((sum, c) => sum + c, 0)); 
        return updated; 
      }); 
      setVoteSubmitMessage(null); 
  };

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
    const payload: any = { votes };
    if (isJudgeMode && judgeAwardSelection.postId) payload.judgeAward = judgeAwardSelection;
    try {
      const response = await fetch(`${API_PREFIX}/api/contests/${contestId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include', });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // 成功したらリロード (URLパラメータ付与)
      window.location.href = `${window.location.pathname}?voted=true`;
    } catch (err: any) { 
        setVoteSubmitMessage({ type: 'error', text: err.message }); 
        setIsSubmittingVotes(false);
    } 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400"><Loader2 className="animate-spin mr-2"/>読み込み中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400"><AlertCircle className="mr-2"/>{error}</div>;
  if (!contest) return null;

  const isPostPeriod = !isPostDeadlineExceeded && contestStatus === 'ongoing';
  const isVotePeriod = !isVoteDeadlineExceeded && contestStatus === 'voting';
  const canVote = contestStatus === 'voting' && user;
  const showVoteUI = (contestStatus === 'voting' && user) || (isJudgeMode && contestStatus === 'voting');

  // 変更点: 投票済みでもボタン無効化しない
  const voteUIDisabled = false;
  // 変更点: 投票済みでも送信ボタン無効化しない
  const isVoteSubmitDisabled = isSubmittingVotes || isVoteDeadlineExceeded;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 relative">
      {/* 投票完了バナー */}
      {showSuccessBanner && (
          <div className="mb-6 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center shadow-lg animate-fade-in-down">
              <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
              <div>
                  <p className="font-bold text-lg">投票が完了しました！</p>
                  <p className="text-sm opacity-90">期間内であれば何度でも投票内容を更新できます。</p>
              </div>
          </div>
      )}

      {isJudgeMode && contestStatus === 'voting' && ( <div className="mb-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg flex items-center text-sm sticky top-16 z-40 shadow-lg"> <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0" /> 現在、審査員として投票中です。 </div> )}
      {contestStatus === 'ongoing' && isPostDeadlineExceeded && ( <div className="mb-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center shadow-lg animate-pulse"> <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" /> <div> <p className="font-bold">投稿受け付けは終了しました</p> <p className="text-xs opacity-80">集計中または投票フェーズへの移行待ちです。</p> </div> </div> )}
      {contestStatus === 'voting' && isVoteDeadlineExceeded && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center shadow-lg animate-pulse">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
              <div>
                  <p className="font-bold">投票期間は終了しました</p>
                  <p className="text-xs opacity-80">集計中または結果発表待ちです。</p>
              </div>
          </div>
      )}

      <div className={`border border-gray-700 rounded-lg bg-gray-900 ${showVoteUI ? 'pb-8' : 'pb-4'}`}>
        {/* 大会情報ヘッダー (修正部分) */}
                <div className="p-6 border-b border-gray-700 space-y-4">
                  
                  {/* 1. タイトル & 審査員ボタン */}
                  <div className="flex justify-between items-start">
                     <div>
                         <h1 className="text-2xl font-bold text-yellow-400">{contest.name}</h1>
                     </div>
                     {/* 審査員ボタン: 投票期間のみ表示 */}
                     {!isJudgeMode && isVotePeriod && (
                         <JudgeLoginButton contestId={contestId} onLoginSuccess={async()=>{await refetchUser(); await fetchData();}} />
                     )}
                     {isJudgeMode && (<span className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-bold flex-shrink-0 ml-2">審査員モード</span>)}
                  </div>
        
                  {/* 2. お題 */}
                  <div className="text-lg font-medium text-gray-200">
                      {contest.hasTheme && contest.theme ? `お題: ${contest.theme}` : "自由にネタツイしよう"}
                  </div>
        
                  {/* 3-6. 各種情報 (Wrap) */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                     
                     {/* 3. 締め切り */}
                     {(contestStatus === 'ongoing' || contestStatus === 'upcoming') && (
                         <div className="flex items-center bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                             <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                             投稿締切: {dayjs(contest.endTime).format('MM/DD HH:mm')}
                         </div>
                     )}
                     {(contestStatus === 'voting' || contestStatus === 'closed') && (
                         <div className="flex items-center bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                             <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                             投票締切: {dayjs(contest.votingEndTime).format('MM/DD HH:mm')}
                         </div>
                     )}
        
                     {/* 4. 画像投稿の有無 */}
                     <div className="flex items-center bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                         <ImageIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                         画像投稿: {contest.allowImages ? '可' : '不可'}
                     </div>
        
                     {/* 5 & 6. 結果画面のみの表示項目 */}
                     {contestStatus === 'closed' && (
                         <>
                            {/* 満点 */}
                            <div className="flex items-center bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">
                                <Trophy className="w-4 h-4 mr-1.5 text-yellow-500" />
                                満点: <span className="font-bold ml-1 text-gray-200">{maxTotalScore}</span>点
                            </div>
                            {/* 人数 */}
                            <div className="flex items-center gap-3 bg-gray-800/50 px-3 py-1 rounded border border-gray-700/50">
                                <span className="flex items-center"><Users className="w-4 h-4 mr-1.5"/>投稿: {totalPosters ?? 0}人</span>
                                <span className="flex items-center border-l border-gray-600 pl-3"><CheckCircle className="w-4 h-4 mr-1.5"/>投票: {totalVoters ?? 0}人</span>
                                <span className="flex items-center border-l border-gray-600 pl-3"><UserStar className="w-4 h-4 mr-1.5"/>審査員: {totalJudges ?? 0}人</span>
                            </div>
                         </>
                     )}
                     {contestStatus === 'voting' && (<div className="flex items-center bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50"><Users className="w-4 h-4 mr-1.5 text-gray-400" />投稿数: {totalPosters ?? 0}</div>)}
                  </div>
                  {/* 7. 投稿期間の注意書き */}
          {contestStatus === 'ongoing' && (
              <div className="bg-blue-900/30 text-blue-300 px-4 py-2 rounded-lg text-sm flex items-start border border-blue-900/50">
                  <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>投稿は一人一つのみ、期限内なら何回でも編集できます。</span>
              </div>
          )}

          {/* 8. 投票期間の注意書き */}
          {contestStatus === 'voting' && (
              <div className="bg-green-900/30 text-green-300 px-4 py-2 rounded-lg text-sm flex items-start border border-green-900/50">
                  <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>投票は期限内なら何回でも編集できます。</span>
              </div>
          )}
                </div>
        
        {/* 投稿期間 */}
        {contestStatus === 'ongoing' && (
          <div className="p-4 space-y-4">
                      {user ? ( hasPosted && posts.length > 0 ? ( <MyPostDisplay post={posts[0]} isEditing={isEditing} setIsEditing={setIsEditing} onStartEdit={handleStartEdit} isDeadlinePassed={isPostDeadlineExceeded} user={user} /> ) : null ) : ( <div className="text-center py-10 text-gray-500">ログインすると投稿できます。</div> )}
                      {user && (!hasPosted || isEditing) && (
                         <form onSubmit={handlePostSubmit} className="relative">
                             <RichTextEditor
                                                     ref={editorRef}
                                                     content={newPostContent}
                                                     onChange={setNewPostContent}
                                                     placeholder={isPostDeadlineExceeded ? "受付時間を終了しました" : "いまどうしてる？"}
                                                     editable={!isPostDeadlineExceeded && !isSubmitting}
                                                     className={`w-full ${isPostDeadlineExceeded ? 'opacity-50' : ''}`}
                                                />
                             {previewUrls.length > 0 && ( <div className="grid grid-cols-2 gap-2 mt-2"> {previewUrls.map((url, idx) => ( <div key={idx} className="relative group"> <img src={url} alt="preview" className="w-full h-32 object-cover rounded-lg"/> <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"><X className="w-4 h-4"/></button> </div> ))} </div> )}
                   <div className="flex justify-between items-center mt-3">
                       <div className="flex items-center gap-2">
                            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" ref={fileInputRef} disabled={isPostDeadlineExceeded || (previewUrls.length + selectedImages.length >= 4)}/>
                            {contest.allowImages && (
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isPostDeadlineExceeded || (previewUrls.length >= 4)} className={`text-gray-400 hover:text-blue-400 p-2 rounded-full hover:bg-gray-800 transition-colors ${(previewUrls.length >= 4) ? 'opacity-50 cursor-not-allowed' : ''}`}> <ImageIcon className="h-6 w-6" /> </button>
                            )}
                            <button type="button" ref={emojiButtonRef} onClick={()=>setShowEmojiPicker(!showEmojiPicker)} disabled={isPostDeadlineExceeded} className="text-gray-400 hover:text-yellow-400 p-2 rounded-full hover:bg-gray-800 transition-colors"><Smile className="h-6 w-6"/></button>
                       </div>
                       <button type="submit" disabled={(!newPostContent.trim() && previewUrls.length === 0) || isSubmitting} className="bg-yellow-500 text-black font-bold py-2 px-6 rounded-full disabled:bg-gray-600 flex items-center">
                           {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="inline w-4 h-4 mr-2"/>}
                           {isSubmitting ? '送信中...' : (isEditing ? '更新する' : '投稿')}
                       </button>
                   </div>
                             {showEmojiPicker && <div className="absolute z-10 mt-2" ref={emojiPickerRef}><EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} emojiStyle={EmojiStyle.TWITTER} skinTonePickerLocation={SkinTonePickerLocation.PREVIEW} lazyLoadEmojis={true}/></div>}
                         </form>
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
                      {/* --- 修正: 匿名ユーザーのアイコンを追加 (2カラム構成) --- */}
                      <div className="flex-none">
                         <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                         </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-2"><span className="font-bold text-gray-300 text-sm">匿名さん</span><TimeAgo timestamp={post.created_at} /></div>
                        <div className="text-lg text-gray-100 leading-relaxed whitespace-pre-wrap">{post.content}</div>
                        <ImageGrid images={post.images} />
                      </div>
                    </div>
                    {/* 投票UI */}
                    <div className="flex flex-col items-end mt-2">
                      {showVoteUI && (
                        isJudgeMode ? (
                           <>
                             <JudgeVoteSelector postId={post.id} currentScore={votes[post.id] || 0} onSelect={handleVoteChange} disabled={isVoteDeadlineExceeded} maxScore={contest.judgeMaxScore || 10} />
                             <JudgeAwardSelector 
                                postId={post.id}
                                isSelected={judgeAwardSelection.postId === post.id}
                                onSelect={handleJudgeAwardSelect}
                                comment={judgeAwardSelection.comment}
                                onCommentChange={handleJudgeCommentChange}
                                disabled={voteUIDisabled || isVoteDeadlineExceeded}
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
                                     {results.map((result) => (
                                         <ResultPostCard key={result.post_id} post={result} currentUser={user} />
                                     ))}
                                 </div>
              )}

              {resultTab === 'awards' && (
                  <div className="space-y-6 p-6">
                      {judgeAwardsResults.length === 0 && <div className="text-center text-gray-500">審査員賞はありません。</div>}
                      {judgeAwardsResults.map((award, idx) => (
                          <div key={idx} className="p-4 border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                              {/* 審査員ヘッダー */}
                              <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-none pt-1">
                                      <Link href={`/profile/${encodeURIComponent(award.judge.screen_name)}`}>
                                          <img 
                                              src={award.judge.profile_image_url || 'https://via.placeholder.com/40'} 
                                              className="w-10 h-10 rounded-full border border-indigo-500/50 object-cover"
                                              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                                          />
                                      </Link>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                          <Link href={`/profile/${encodeURIComponent(award.judge.screen_name)}`} className="font-bold text-white hover:underline">
                                              {award.judge.name}
                                          </Link>
                                          <span className="inline-flex items-center bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/40">
                                              <Award className="w-3 h-3 mr-1" /> 選出
                                          </span>
                                      </div>
                                      <div className="text-gray-200 text-base whitespace-pre-wrap mb-3">
                                          {award.comment || "（コメントなし）"}
                                      </div>

                                      {/* 引用された投稿 */}
                                      <div className="border border-gray-600 rounded-xl p-3 bg-gray-900/50 text-gray-300 text-sm">
                                                                        {/* 上段: アバター + ユーザー名 */}
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                          
                                                                            <img 
                                                                                src={award.post.user.profile_image_url || ''} 
                                                                                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                                            />
                                                                            <div className="flex items-baseline gap-1 min-w-0">
                                                                              <Link href={`/profile/${encodeURIComponent(award.post.user.screen_name)}`} className="font-bold text-white hover:underline"><span className="font-bold text-white truncate">{award.post.user.name}</span></Link>
                                                                                
                                                                                <span className="text-xs text-gray-500 flex-shrink-0">· {dayjs(award.post.created_at).format('MM/DD')}</span>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* 下段: 本文 + 画像 */}
                                                                        <div className="text-white/90">
                                                                            <p className="whitespace-pre-wrap">{award.post.content}</p>
                                                                            {award.post.images && award.post.images.length > 0 && (
                                                                                <div className="mt-2">
                                                                                    <ImageGrid images={award.post.images} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        )}
      </div>

      {/* 投票確定ボタン */}
      {showVoteUI && ( <div className="mt-8 pb-12"> <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg text-center"> <button onClick={handleSubmitVotes} disabled={isSubmittingVotes} className="w-full max-w-md mx-auto py-3 px-6 rounded-full font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg flex items-center justify-center"> {isSubmittingVotes ? <Loader2 className="animate-spin mr-2"/> : null} {isSubmittingVotes ? '送信中...' : (userHasVoted ? '投票を更新する' : '投票を確定する')} </button> </div> </div> )}
    </div>
  );
}