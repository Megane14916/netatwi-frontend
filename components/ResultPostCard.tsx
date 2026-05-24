'use client';

import { useState, useEffect } from 'react';
// import Link from 'next/link'; // エラー回避のため削除
import { Heart, Bookmark, Share2, Award } from 'lucide-react';
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
  currentUser: any; // ログインユーザー情報
  onToggleBookmark?: (post: any) => void;
  contestScoringMethod?: string;
}

export default function ResultPostCard({ post, currentUser, onToggleBookmark, contestScoringMethod }: ResultPostProps) {
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
    const contestName = post.contest?.name || 'ネタツイ大会';
    const rankText = post.rank ? `${post.rank}位` : '';
    const awardsText = post.awards && post.awards.length > 0 ? ` ${post.awards.join(' ')}` : '';
    
    // ツイート本文の構築
    const text = `【${contestName}】\n${rankText}${awardsText}\nユーザー: ${post.user.name} (@${post.user.screen_name})さん\n\n${post.content}\n\n#ネタツイグランプリ`;
    
    // URL
    const url = window.location.href;
    
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // 順位表示のスタイル
  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    
    let badgeStyle = "bg-gray-200 text-gray-600";
    if (rank === 1) badgeStyle = "bg-yellow-400 text-black border border-yellow-500 shadow-sm";
    if (rank === 2) badgeStyle = "bg-gray-300 text-black border border-gray-400 shadow-sm";
    if (rank === 3) badgeStyle = "bg-amber-600 text-white border border-amber-700 shadow-sm";

    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full ${badgeStyle}`}>
        {rank}位
      </span>
    );
  };

return (
    <div className="p-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      {/* 1行目: 順位と審査員賞 (中央揃え) */}
      <div className="flex items-center gap-2 mb-2">
         {getRankBadge(post.rank)}
         
         {/* 審査員賞バッジ */}
         {post.awards && post.awards.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.awards.map((award, i) => (
                <span key={i} className="inline-flex items-center bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2 py-0.5 rounded border border-indigo-500/40">
                  <Award className="w-3 h-3 mr-1" />
                  {award}
                </span>
              ))}
            </div>
         )}
      </div>

      {/* 2行目: メインコンテンツ (アバター + ユーザー情報 + 投稿内容) */}
      <div className="flex items-start gap-3">
        
        {/* アバター (上揃え) */}
        <div className="flex-none">
            <a href={`/profile/${encodeURIComponent(post.user.screen_name)}`} className="hover:opacity-80 transition-opacity block">
                <img 
                  src={post.user.profile_image_url || 'https://via.placeholder.com/40'} 
                  alt={post.user.screen_name} 
                  className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                />
            </a>
        </div>

        {/* コンテンツ本体 */}
        <div className="flex-grow min-w-0">
            
            {/* ユーザー情報 (上揃え: items-start) */}
            <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1 min-w-0 flex-wrap">
                    <a href={`/profile/${encodeURIComponent(post.user.screen_name)}`} className="font-bold text-white hover:underline truncate text-base leading-tight">
                      {post.user.name}
                    </a>
                    <span className="text-sm text-gray-500 truncate" style={{ flexShrink: 1000 }}>@{post.user.screen_name}</span>
                    <span className="text-sm text-gray-600 flex-shrink-0">·</span>
                    <TimeAgo timestamp={post.created_at} />
                </div>
            </div>

            {/* 本文 & 画像 */}
            <div>
              <Twemoji text={post.content} />
              {post.images && post.images.length > 0 && (
                <div className="mt-2">
                  <ImageGrid images={post.images} />
                </div>
              )}
            </div>

            {/* アクションバー (右寄せ: シェア -> ブックマーク -> いいね) */}
            <div className="flex items-center justify-end gap-6 mt-3 text-gray-500">
                {/* 得点/いいね数 */}
                {contestScoringMethod === 'judge' ? (
                  <>
                    <div className="flex items-center group cursor-default text-yellow-500" title="審査員スコア">
                        <div className="p-2 rounded-full bg-yellow-500/10">
                            <Award className="h-5 w-5 fill-current" />
                        </div>
                        <span className="text-sm font-bold ml-1">{post.score}</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                        disabled={!currentUser || isJudgeForThisPost}
                        className={`flex items-center group focus:outline-none ${isJudgeForThisPost ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        title={isJudgeForThisPost ? "審査員はいいねできません" : "いいね"}>
                        <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-pink-500/10 hover:bg-pink-500/20' : 'hover:bg-pink-500/10'}`}>
                            <Heart className={`h-5 w-5 ${isLiked ? 'text-pink-500 fill-current' : 'group-hover:text-pink-500'}`} />
                        </div>
                        <span className={`text-sm font-bold ml-1 ${isLiked ? 'text-pink-500' : 'group-hover:text-pink-500'}`}>{likeCount}</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center group cursor-default" title="得票数">
                      <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
                          <Heart className={`h-5 w-5 ${isLiked ? 'text-pink-500 fill-current' : 'group-hover:text-pink-500'}`} />
                      </div>
                      <span className={`text-sm font-bold ml-1 ${isLiked ? 'text-pink-500' : 'group-hover:text-pink-500'}`}>{post.score}</span>
                  </div>
                )}

                {/* ブックマーク */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                    disabled={!currentUser}
                    className="flex items-center group focus:outline-none"
                    title={currentUser ? (isBookmarked ? 'ブックマークを外す' : 'ブックマーク') : 'ログインが必要です'}
                >
                    <div className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-blue-500' : 'group-hover:bg-blue-500/10 group-hover:text-blue-500'}`}>
                        <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </div>
                    <span className={`text-sm ml-1 ${isBookmarked ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>{bookmarkCount}</span>
                </button>

                {/* シェア (右端) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleShare(); }}
                    className="flex items-center group focus:outline-none"
                    title="Xでシェア"
                >
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                        <Share2 className="h-5 w-5 group-hover:text-green-500" />
                    </div>
                </button>
            </div>

            {/* 投票者リスト */}
            {post.voters && post.voters.length > 0 && (
                <div className="mt-1 border-t border-gray-800/60 text-xs text-gray-500">
                <div className="flex flex-wrap items-center leading-relaxed gap-y-1">
                    <span className="mr-2 font-semibold opacity-70">投票した人:</span>
                    {post.voters.map((voter, vIndex) => (
                    <span key={vIndex} className="inline-flex items-center">
                        {voter.is_judge ? (
                        <span className="bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded mr-1 flex items-center border border-yellow-700/30">
                            <a href={`/profile/${encodeURIComponent(voter.screen_name)}`} className="hover:underline font-bold">
                            {voter.name}
                            </a>
                            <span className="ml-1 font-bold">({voter.count})</span>
                        </span>
                        ) : (
                        <a href={`/profile/${encodeURIComponent(voter.screen_name)}`} className="hover:underline text-gray-400 hover:text-gray-300">
                            {voter.name}
                        </a>
                        )}
                        
                        {vIndex < (post.voters?.length || 0) - 1 && (
                        <span className="mx-1.5 text-gray-700">/</span>
                        )}
                    </span>
                    ))}
                </div>
                </div>
            )}
            
            {/* コメント機能 */}
            <CommentList postId={post.post_id} currentUser={currentUser} contestStatus="closed" />
        </div>
      </div>
    </div>
  );
}