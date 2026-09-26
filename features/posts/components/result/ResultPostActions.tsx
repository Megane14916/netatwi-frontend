import { Bookmark, Heart, MessageSquare, Share2 } from "lucide-react";

interface ResultPostActionsProps {
  isCommentsOpen: boolean;
  hasCommented: boolean;
  commentCount: number;
  onToggleComments: () => void;
  isLiked: boolean;
  likeCount: number;
  onLike: () => void;
  isLikeDisabled: boolean;
  scoringMethod?: string;
  score: number;
  isBookmarked: boolean;
  bookmarkCount: number;
  onBookmark: () => void;
  isLoggedIn: boolean;
  onShare: () => void;
}

export function ResultPostActions({
  isCommentsOpen,
  hasCommented,
  commentCount,
  onToggleComments,
  isLiked,
  likeCount,
  onLike,
  isLikeDisabled,
  scoringMethod,
  score,
  isBookmarked,
  bookmarkCount,
  onBookmark,
  isLoggedIn,
  onShare,
}: ResultPostActionsProps) {
  return (
    <div className="flex items-center justify-between w-full mt-3 text-gray-500 dark:text-gray-400 sm:w-auto sm:justify-end sm:gap-10">
        <button 
            onClick={(e) => { e.stopPropagation(); onToggleComments(); }}
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

        <button 
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            disabled={!isLoggedIn || isLikeDisabled}
            className={`flex items-center group focus:outline-none ${isLikeDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
            title={isLikeDisabled ? "審査員はいいねできません" : "いいね"}>
            <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-pink-500/10 hover:bg-pink-500/20' : 'hover:bg-pink-500/10'}`}>
                <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? 'text-pink-500 fill-current' : 'group-hover:text-pink-500'}`} />
            </div>
            <span className={`text-xs sm:text-sm font-bold ml-1 ${isLiked ? 'text-pink-500' : 'group-hover:text-pink-500'}`}>
                {scoringMethod === 'judge' ? likeCount : score}
            </span>
        </button>

        <button 
            onClick={(e) => { e.stopPropagation(); onBookmark(); }}
            disabled={!isLoggedIn}
            className="flex items-center group focus:outline-none"
            title={isLoggedIn ? (isBookmarked ? 'ブックマークを外す' : 'ブックマーク') : 'ログインが必要です'}
        >
            <div className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-blue-500' : 'group-hover:bg-blue-500/10 group-hover:text-blue-500'}`}>
                <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </div>
            <span className={`text-xs sm:text-sm ml-1 ${isBookmarked ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>{bookmarkCount}</span>
        </button>

        <button 
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="flex items-center group focus:outline-none"
            title="Xでシェア"
        >
            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 group-hover:text-green-500" />
            </div>
        </button>
    </div>
  );
}
