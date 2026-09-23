"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ResultPost } from "@/types/domain";

export function ResultVoters({ post, scoringMethod }: { post: ResultPost; scoringMethod?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayVoters = scoringMethod === 'judge' 
    ? post.voters.filter(v => v.isJudge)
    : (post.voters || []);
  if (displayVoters.length === 0) return null;

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-black/50 dark:text-white/50 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className={`leading-relaxed ${isExpanded ? '' : 'line-clamp-1 break-all'}`}>
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
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
