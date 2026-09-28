import type { ReactNode } from "react";
import ImageGrid from "@/components/ImageGrid";
import TimeAgo from "@/components/TimeAgo";
import Twemoji from "@/components/Twemoji";
import type { ResultPost } from "@/types/domain";

export function ResultPostBody({ post, children }: { post: ResultPost; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 md:gap-3">
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

      <div className="flex-grow min-w-0">
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

          <div className="text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere]">
            <Twemoji text={post.content} />
            {post.images && post.images.length > 0 && (
              <div className="mt-2">
                <ImageGrid images={post.images} />
              </div>
            )}
          </div>
          {children}
      </div>
    </div>
  );
}
