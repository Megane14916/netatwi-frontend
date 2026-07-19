'use client';

import { useState, useEffect } from 'react';
// import Link from 'next/link'; // エラー回避のため削除
import { Heart, Bookmark, Share2, Award, Crown, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import ImageGrid from './ImageGrid';
import TimeAgo from './TimeAgo';
import Twemoji from './Twemoji';
import CommentList from './CommentList';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ja';

dayjs.extend(relativeTime);
dayjs.locale('ja');

// --- 型定義 ---
export interface ResultPostProps {
  post: {
    post_id: number;
    content: string;
    images?: string[];
    created_at: string;
    score: number;
    rank: number | null;
    commentCount?: number;
    hasCommented?: boolean;
    user: {
      screen_name: string;
      name: string;
      profile_image_url: string | null;
    };
    voters?: {
      screen_name: string;
      name: string;
      count: number;
      is_judge: boolean;
    }[];
    bookmarkCount: number;
    isBookmarked: boolean;
    awards?: string[]; // 審査員賞など
    contest?: {
        name: string;
        id: number;
    };
    myVotes?: number;
  };
  currentUser: { id: number; name: string; screen_name: string; profile_image_url: string | null } | null;
  onToggleBookmark?: (post: any) => void;
  contestScoringMethod?: string;
  hideVotersAndComments?: boolean;
}

export default function ResultPostCard({ post, currentUser, onToggleBookmark, contestScoringMethod, hideVotersAndComments = false }: ResultPostProps) {
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount);

  const initialIsLiked = (post.myVotes !== undefined && post.myVotes > 0) ||
    (currentUser && post.voters?.some(v => v.screen_name === currentUser.screen_name && !v.is_judge));
    
  const isJudgeForThisPost = currentUser && post.voters?.some(v => v.screen_name === currentUser.screen_name && v.is_judge);

  const initialLikeCount = contestScoringMethod === 'judge' 
    ? (post.voters?.filter(v => !v.is_judge).reduce((sum, v) => sum + v.count, 0) || 0)
    : post.score;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isVotersExpanded, setIsVotersExpanded] = useState(false);

  // 親から渡されたデータが変わったら同期
  useEffect(() => {
    setIsBookmarked(post.isBookmarked);
    setBookmarkCount(post.bookmarkCount);
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [post.isBookmarked, post.bookmarkCount, post.score, post.voters, currentUser]);

  // ブックマーク処理
  const handleBookmark = async () => {
    if (!currentUser) {
      alert('ブックマークするにはログインが必要です。');
      return;
    }

    if (onToggleBookmark) {
        onToggleBookmark(post);
        return;
    }

    // 楽観的更新
    const prevIsBookmarked = isBookmarked;
    const prevCount = bookmarkCount;
    
    setIsBookmarked(!prevIsBookmarked);
    setBookmarkCount(prevIsBookmarked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.post_id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed');
      
      const data = await res.json();
      // サーバーの正確な値で補正
      setIsBookmarked(data.isBookmarked);
      setBookmarkCount(data.bookmarkCount);
    } catch (e) {
      // エラー時はロールバック
      setIsBookmarked(prevIsBookmarked);
      setBookmarkCount(prevCount);
      console.error(e);
    }
  };

  const handleLike = async () => {
    if (!currentUser || contestScoringMethod !== 'judge') return;
    const prevIsLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevIsLiked);
    setLikeCount(prevIsLiked ? prevCount - 1 : prevCount + 1);
    try {
      const res = await fetch(`/api/posts/${post.post_id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      } else {
        const errData = await res.json();
        alert(errData.error || "いいねに失敗しました");
        setIsLiked(prevIsLiked);
        setLikeCount(prevCount);
      }
    } catch {
      alert("いいねに失敗しました");
      setIsLiked(prevIsLiked);
      setLikeCount(prevCount);
    }
  };

  // シェア機能
  const handleShare = () => {
    const contestName = post.contest?.name || 'ネタツイグランプリ';
    const rankText = post.rank ? `${post.rank}位　` : '';
    
    const url = window.location.href;
    const text = `${contestName}\n${rankText}${post.user.name}\n\n${post.content}\n\n結果はこちらから\n${url}\n\n#ネタツイグランプリ`;
    
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // 順位表示のスタイル
  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    
    if (rank === 1) return <div className="flex items-center text-yellow-500 font-bold text-xl"><Crown className="w-6 h-6 mr-1.5 fill-current" /> 1位</div>;
    if (rank === 2) return <div className="flex items-center text-gray-400 dark:text-gray-600 font-bold text-xl"><Crown className="w-6 h-6 mr-1.5 fill-current" /> 2位</div>;
    if (rank === 3) return <div className="flex items-center text-amber-600 font-bold text-xl"><Crown className="w-6 h-6 mr-1.5 fill-current" /> 3位</div>;

    return (
      <div className="flex items-center text-gray-600 dark:text-gray-400 font-bold text-xl">
        {rank}位
      </div>
    );
  };

return (
    <div className="p-4 sm:p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
      {/* 1行目: 順位と審査員賞 (中央揃え) */}
      <div className="flex items-center gap-3 mb-3">
         {getRankBadge(post.rank)}
         <span className="text-lg font-bold text-gray-600 dark:text-gray-400 ml-1">{post.score}pt</span>
      </div>

      {/* 2行目: メインコンテンツ (アバター + ユーザー情報 + 投稿内容) */}
      <div className="flex items-start gap-3">
        
        {/* アバター (上揃え) */}
        <div className="flex-none">
            <a href={`/profile/${encodeURIComponent(post.user.screen_name)}`} className="hover:opacity-80 transition-opacity block">
                <img 
                  src={post.user.profile_image_url || 'https://via.placeholder.com/40'} 
                  alt={post.user.screen_name} 
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover bg-white dark:bg-black"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                />
            </a>
        </div>

        {/* コンテンツ本体 */}
        <div className="flex-grow min-w-0">
            
            {/* ユーザー情報 (上揃え: items-start) */}
            <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1 min-w-0 flex-nowrap whitespace-nowrap">
                    <a href={`/profile/${encodeURIComponent(post.user.screen_name)}`} className="font-bold text-black dark:text-white hover:underline truncate text-base leading-tight">
                      {post.user.name}
                    </a>
                    <span className="text-sm text-black/50 dark:text-white/50 truncate" style={{ flexShrink: 1000 }}>@{post.user.screen_name}</span>
                    <span className="text-sm text-black/30 dark:text-white/30 flex-shrink-0">·</span>
                    <span className="text-sm text-black/50 dark:text-white/50"><TimeAgo timestamp={post.created_at} /></span>
                </div>
            </div>

            {/* 本文 & 画像 */}
            <div className="text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap break-all">
              <Twemoji text={post.content} />
              {post.images && post.images.length > 0 && (
                <div className="mt-2">
                  <ImageGrid images={post.images} />
                </div>
              )}
            </div>

            {/* アクションバー */}
            <div className="flex items-center justify-between w-full mt-3 text-gray-500 dark:text-gray-400 sm:w-auto sm:justify-end sm:gap-10">
                {/* コメント */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(!isCommentsOpen); }}
                    className="flex items-center group focus:outline-none" 
                    title="コメント"
                >
                    <div className={`p-2 rounded-full transition-colors ${post.hasCommented || isCommentsOpen ? 'bg-[#1DA1F2]/10' : 'group-hover:bg-[#1DA1F2]/10'}`}>
                        <MessageSquare className={`h-4 w-4 sm:h-5 sm:w-5 ${post.hasCommented || isCommentsOpen ? 'text-[#1DA1F2] fill-current' : 'group-hover:text-[#1DA1F2]'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-bold ml-1 ${post.hasCommented || isCommentsOpen ? 'text-[#1DA1F2]' : 'group-hover:text-[#1DA1F2]'}`}>{post.commentCount || 0}</span>
                </button>

                {/* いいね */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleLike(); }}
                    disabled={!currentUser || Boolean(contestScoringMethod === 'judge' && isJudgeForThisPost)}
                    className={`flex items-center group focus:outline-none ${(contestScoringMethod === 'judge' && isJudgeForThisPost) ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    title={(contestScoringMethod === 'judge' && isJudgeForThisPost) ? "審査員はいいねできません" : "いいね"}>
                    <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-pink-500/10 hover:bg-pink-500/20' : 'hover:bg-pink-500/10'}`}>
                        <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? 'text-pink-500 fill-current' : 'group-hover:text-pink-500'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-bold ml-1 ${isLiked ? 'text-pink-500' : 'group-hover:text-pink-500'}`}>
                        {contestScoringMethod === 'judge' ? likeCount : post.score}
                    </span>
                </button>

                {/* ブックマーク */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                    disabled={!currentUser}
                    className="flex items-center group focus:outline-none"
                    title={currentUser ? (isBookmarked ? 'ブックマークを外す' : 'ブックマーク') : 'ログインが必要です'}
                >
                    <div className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-blue-500' : 'group-hover:bg-blue-500/10 group-hover:text-blue-500'}`}>
                        <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </div>
                    <span className={`text-xs sm:text-sm ml-1 ${isBookmarked ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>{bookmarkCount}</span>
                </button>

                {/* シェア (右端) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleShare(); }}
                    className="flex items-center group focus:outline-none"
                    title="Xでシェア"
                >
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 group-hover:text-green-500" />
                    </div>
                </button>
            </div>

            {/* 投票者リスト */}
            {!hideVotersAndComments && (() => {
                const displayVoters = contestScoringMethod === 'judge' 
                    ? (post.voters || []).filter(v => v.is_judge) 
                    : (post.voters || []);
                
                if (displayVoters.length === 0) return null;
                
                return (
                  <div 
                    onClick={() => setIsVotersExpanded(!isVotersExpanded)}
                    className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-black/50 dark:text-white/50 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`leading-relaxed ${isVotersExpanded ? '' : 'line-clamp-1 break-all'}`}>
                          <span className="mr-2 font-semibold inline">投票:</span>
                          {displayVoters.map((voter, vIndex) => (
                          <span key={vIndex} className="inline">
                            {voter.is_judge ? (
                            <span className="inline mr-1">
                                <a href={`/profile/${encodeURIComponent(voter.screen_name)}`} className="hover:underline text-black/60 dark:text-white/60 hover:text-black/80 inline" onClick={(e) => e.stopPropagation()}>
                                {voter.name}
                                </a>
                                <span className="ml-1 text-black/60 dark:text-white/60 inline">({voter.count})</span>
                            </span>
                            ) : (
                            <a href={`/profile/${encodeURIComponent(voter.screen_name)}`} className="hover:underline text-black/60 dark:text-white/60 hover:text-black/80 inline" onClick={(e) => e.stopPropagation()}>
                                {voter.name}
                            </a>
                            )}
                            
                            {vIndex < displayVoters.length - 1 && (
                            <span className="mx-1.5 text-black/30 dark:text-white/30 inline">/</span>
                            )}
                        </span>
                        ))}
                      </div>
                      <div className="flex-none ml-2 pt-0.5 text-black/30 dark:text-white/30 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors">
                        {isVotersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                );
            })()}
            
            {/* コメント機能 */}
            {!hideVotersAndComments && (
                <CommentList 
                    postId={post.post_id} 
                    currentUser={currentUser} 
                    contestStatus="closed" 
                    isOpenProp={isCommentsOpen}
                    onClose={() => setIsCommentsOpen(false)}
                />
            )}
        </div>
      </div>
    </div>
  );
}