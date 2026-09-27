'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import type { Comment, ResultPost, User } from '@/types/domain';
import { setPostBookmark, setPostLike } from '@/lib/api/endpoints/posts';
import { useQueuedToggle } from '@/features/posts/hooks/useQueuedToggle';
import { ResultComments } from '@/features/posts/components/result/ResultComments';
import { ResultPostActions } from '@/features/posts/components/result/ResultPostActions';
import { ResultPostBody } from '@/features/posts/components/result/ResultPostBody';
import { ResultRank } from '@/features/posts/components/result/ResultRank';
import { ResultVoters } from '@/features/posts/components/result/ResultVoters';

// --- 型定義 ---
export interface ResultPostProps {
  post: ResultPost;
  currentUser: User | null;
  onToggleBookmark?: (post: ResultPost) => void;
  onBookmarkChange?: (postId: number, isBookmarked: boolean, bookmarkCount: number) => void;
  contestScoringMethod?: string;
  hideVotersAndComments?: boolean;
  initialComments?: Comment[];
}

export default function ResultPostCard({ post, currentUser, onToggleBookmark, onBookmarkChange, contestScoringMethod, hideVotersAndComments = false, initialComments }: ResultPostProps) {
  const { toast } = useToast();

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

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [hasCommented, setHasCommented] = useState(post.hasCommented || false);
  const {
    enabled: localIsBookmarked,
    count: localBookmarkCount,
    toggle: toggleBookmark,
  } = useQueuedToggle({
    initialEnabled: post.isBookmarked,
    initialCount: post.bookmarkCount,
    request: async (enabled) => {
      const response = await setPostBookmark(post.id, enabled);
      return { enabled: response.isBookmarked, count: response.bookmarkCount };
    },
    onChange: ({ enabled, count }) => onBookmarkChange?.(post.id, enabled, count),
    onError: (error) => {
      console.error(error);
      toast({ title: "エラー", description: "ブックマークの更新に失敗しました", variant: "destructive" });
    },
  });
  const isBookmarked = onToggleBookmark ? post.isBookmarked : localIsBookmarked;
  const bookmarkCount = onToggleBookmark ? post.bookmarkCount : localBookmarkCount;
  const {
    enabled: isLiked,
    count: likeCount,
    toggle: toggleLike,
  } = useQueuedToggle({
    initialEnabled: initialIsLiked,
    initialCount: initialLikeCount,
    request: async (enabled) => {
      const response = await setPostLike(post.id, enabled);
      return { enabled: response.isLiked, count: response.likeCount };
    },
    onError: (error) => {
      toast({ title: "エラー", description: error instanceof Error ? error.message : "いいねに失敗しました", variant: "destructive" });
    },
  });

  // 親から渡されたデータが変わったら同期
  useEffect(() => {
    setCommentCount(post.commentCount);
    setHasCommented(post.hasCommented || false);
  }, [post.commentCount, post.hasCommented]);

  const handleBookmark = () => {
    if (!currentUser) {
      toast({ title: "エラー", description: "ブックマークするにはログインが必要です。", variant: "destructive" });
      return;
    }

    if (onToggleBookmark) {
      onToggleBookmark(post);
      return;
    }

    toggleBookmark();
  };

  const handleLike = () => {
    if (!currentUser || contestScoringMethod !== 'judge') return;
    toggleLike();
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

return (
    <div className="py-4 px-3 sm:p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
      <ResultRank rank={post.rank} score={post.score} />
      <ResultPostBody post={post}>
        <ResultPostActions
          isCommentsOpen={isCommentsOpen}
          hasCommented={hasCommented}
          commentCount={commentCount}
          onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
          isLiked={isLiked}
          likeCount={likeCount}
          onLike={handleLike}
          isLikeDisabled={Boolean(contestScoringMethod === 'judge' && isJudgeForThisPost)}
          scoringMethod={contestScoringMethod}
          score={post.score}
          isBookmarked={isBookmarked}
          bookmarkCount={bookmarkCount}
          onBookmark={handleBookmark}
          isLoggedIn={Boolean(currentUser)}
          onShare={handleShare}
        />
        {!hideVotersAndComments && <ResultVoters post={post} scoringMethod={contestScoringMethod} />}
        {!hideVotersAndComments && (
          <ResultComments
            postId={post.id}
            currentUser={currentUser}
            isOpen={isCommentsOpen}
            initialComments={initialComments}
            onClose={() => setIsCommentsOpen(false)}
            onAdded={() => {
              setHasCommented(true);
              setCommentCount(prev => prev + 1);
            }}
            onDeleted={() => {
              setHasCommented(false);
              setCommentCount(prev => Math.max(0, prev - 1));
            }}
          />
        )}
      </ResultPostBody>
    </div>
  );
}
