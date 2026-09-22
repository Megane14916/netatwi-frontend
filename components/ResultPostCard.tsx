'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, Bookmark, Share2, Crown, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import ImageGrid from './ImageGrid';
import TimeAgo from './TimeAgo';
import Twemoji from './Twemoji';
import CommentList from './CommentList';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ja';
import { useToast } from "@/components/ui/use-toast";
import type { Comment, ResultPost, User } from '@/types/domain';
import { setPostBookmark, setPostLike } from '@/lib/api/endpoints/posts';

dayjs.extend(relativeTime);
dayjs.locale('ja');

// --- 型定義 ---
export interface ResultPostProps {
  post: ResultPost;
  currentUser: User | null;
  onToggleBookmark?: (post: ResultPost) => void;
  contestScoringMethod?: string;
  hideVotersAndComments?: boolean;
  initialComments?: Comment[];
}

export default function ResultPostCard({ post, currentUser, onToggleBookmark, contestScoringMethod, hideVotersAndComments = false, initialComments }: ResultPostProps) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount);

  const initialIsLiked = useMemo(
    () => Boolean(
      (post.myVotes !== null && post.myVotes > 0) ||
      (currentUser && post.voters.some(v => v.screenName === currentUser.screenName && !v.isJudge)),
    ),
    [currentUser, post.myVotes, post.voters],
  );
    
  const isJudgeForThisPost = currentUser && post.voters.some(v => v.screenName === currentUser.screenName && v.isJudge);

  const initialLikeCount = useMemo(
    () => contestScoringMethod === 'judge'
      ? (post.voters.filter(v => !v.isJudge).reduce((sum, v) => sum + v.count, 0) || 0)
      : post.score,
    [contestScoringMethod, post.score, post.voters],
  );

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isVotersExpanded, setIsVotersExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [hasCommented, setHasCommented] = useState(post.hasCommented || false);
  const bookmarkTargetRef = useRef(post.isBookmarked);
  const bookmarkConfirmedRef = useRef(post.isBookmarked);
  const bookmarkConfirmedCountRef = useRef(post.bookmarkCount);
  const bookmarkProcessingRef = useRef(false);
  const likeTargetRef = useRef(Boolean(initialIsLiked));
  const likeConfirmedRef = useRef(Boolean(initialIsLiked));
  const likeProcessingRef = useRef(false);

  // 親から渡されたデータが変わったら同期
  useEffect(() => {
    if (!bookmarkProcessingRef.current) {
      bookmarkTargetRef.current = post.isBookmarked;
      bookmarkConfirmedRef.current = post.isBookmarked;
      bookmarkConfirmedCountRef.current = post.bookmarkCount;
    }
    if (!likeProcessingRef.current) {
      likeTargetRef.current = Boolean(initialIsLiked);
      likeConfirmedRef.current = Boolean(initialIsLiked);
    }
    setIsBookmarked(post.isBookmarked);
    setBookmarkCount(post.bookmarkCount);
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
    setCommentCount(post.commentCount);
    setHasCommented(post.hasCommented || false);
  }, [post.isBookmarked, post.bookmarkCount, post.commentCount, post.hasCommented, initialIsLiked, initialLikeCount]);

  // ブックマーク処理
  const processBookmarkQueue = async () => {
    if (bookmarkProcessingRef.current) return;
    bookmarkProcessingRef.current = true;

    try {
      while (true) {
        const requestedState = bookmarkTargetRef.current;
        const data = await setPostBookmark(post.id, requestedState);
        bookmarkConfirmedRef.current = data.isBookmarked;
        bookmarkConfirmedCountRef.current = Math.max(0, data.bookmarkCount);
        setIsBookmarked(data.isBookmarked);
        setBookmarkCount(bookmarkConfirmedCountRef.current);

        // 通信中に状態が変わっていた場合は、最新の希望状態だけを送る
        if (bookmarkTargetRef.current === requestedState) break;
      }
    } catch (e) {
      bookmarkTargetRef.current = bookmarkConfirmedRef.current;
      setIsBookmarked(bookmarkConfirmedRef.current);
      setBookmarkCount(bookmarkConfirmedCountRef.current);
      console.error(e);
    } finally {
      bookmarkProcessingRef.current = false;
    }
  };

  const handleBookmark = () => {
    if (!currentUser) {
      toast({ title: "エラー", description: "ブックマークするにはログインが必要です。", variant: "destructive" });
      return;
    }

    if (onToggleBookmark) {
        onToggleBookmark(post);
        return;
    }

    const nextState = !bookmarkTargetRef.current;
    bookmarkTargetRef.current = nextState;
    setIsBookmarked(nextState);
    setBookmarkCount(prev => Math.max(0, prev + (nextState ? 1 : -1)));
    void processBookmarkQueue();
  };

  const processLikeQueue = async () => {
    if (likeProcessingRef.current) return;
    likeProcessingRef.current = true;

    try {
      while (true) {
        const requestedState = likeTargetRef.current;
        const data = await setPostLike(post.id, requestedState);
        likeConfirmedRef.current = data.isLiked;
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
        if (likeTargetRef.current === requestedState) break;
      }
    } catch (error) {
      likeTargetRef.current = likeConfirmedRef.current;
      setIsLiked(likeConfirmedRef.current);
      toast({ title: "エラー", description: error instanceof Error ? error.message : "いいねに失敗しました", variant: "destructive" });
    } finally {
      likeProcessingRef.current = false;
    }
  };

  const handleLike = () => {
    if (!currentUser || contestScoringMethod !== 'judge') return;
    const nextState = !likeTargetRef.current;
    likeTargetRef.current = nextState;
    setIsLiked(nextState);
    setLikeCount(prev => Math.max(0, prev + (nextState ? 1 : -1)));
    void processLikeQueue();
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
    <div className="py-4 px-3 sm:p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
      {/* 1行目: 順位と審査員賞 (中央揃え) */}
      <div className="flex items-center gap-3 mb-3">
         {getRankBadge(post.rank)}
         <span className="text-lg font-bold text-gray-600 dark:text-gray-400 ml-1">{post.score}pt</span>
      </div>

      {/* 2行目: メインコンテンツ (アバター + ユーザー情報 + 投稿内容) */}
      <div className="flex items-start gap-2 md:gap-3">
        
        {/* アバター (上揃え) */}
        <div className="flex-none">
            <a href={`/profile/${encodeURIComponent(post.user.screenName)}`} className="hover:opacity-80 transition-opacity block">
                <img 
                  src={post.user.profileImageUrl || 'https://via.placeholder.com/40'}
                  alt={post.user.screenName}
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
                    <a href={`/profile/${encodeURIComponent(post.user.screenName)}`} className="font-bold text-black dark:text-white hover:underline truncate text-base leading-tight">
                      {post.user.name}
                    </a>
                    <span className="text-sm text-black/50 dark:text-white/50 truncate" style={{ flexShrink: 1000 }}>@{post.user.screenName}</span>
                    <span className="text-sm text-black/30 dark:text-white/30 flex-shrink-0">·</span>
                    <span className="text-sm text-black/50 dark:text-white/50"><TimeAgo timestamp={post.createdAt} /></span>
                </div>
            </div>

            {/* 本文 & 画像 */}
            <div className="text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere]">
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
                    <div className={`p-2 rounded-full transition-colors ${hasCommented || isCommentsOpen ? 'bg-[#1DA1F2]/10' : 'group-hover:bg-[#1DA1F2]/10'}`}>
                        <MessageSquare className={`h-4 w-4 sm:h-5 sm:w-5 ${hasCommented || isCommentsOpen ? 'text-[#1DA1F2] fill-current' : 'group-hover:text-[#1DA1F2]'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-bold ml-1 ${hasCommented || isCommentsOpen ? 'text-[#1DA1F2]' : 'group-hover:text-[#1DA1F2]'}`}>
                      {commentCount}
                    </span>
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
                    ? post.voters.filter(v => v.isJudge)
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
                            {voter.isJudge ? (
                            <span className="inline mr-1">
                                <a href={`/profile/${encodeURIComponent(voter.screenName)}`} className="hover:underline text-black/60 dark:text-white/60 hover:text-black/80 inline" onClick={(e) => e.stopPropagation()}>
                                {voter.name}
                                </a>
                                <span className="ml-1 text-black/60 dark:text-white/60 inline">({voter.count})</span>
                            </span>
                            ) : (
                            <a href={`/profile/${encodeURIComponent(voter.screenName)}`} className="hover:underline text-black/60 dark:text-white/60 hover:text-black/80 inline" onClick={(e) => e.stopPropagation()}>
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
                    postId={post.id}
                    currentUser={currentUser}
                    contestStatus="closed"
                    isOpenProp={isCommentsOpen}
                    initialComments={initialComments}
                    onClose={() => setIsCommentsOpen(false)}
                    onCommentAdded={() => {
                      setHasCommented(true);
                      setCommentCount(prev => prev + 1);
                    }}
                    onCommentDeleted={() => {
                      setHasCommented(false);
                      setCommentCount(prev => Math.max(0, prev - 1));
                    }}
                />
            )}
        </div>
      </div>
    </div>
  );
}
