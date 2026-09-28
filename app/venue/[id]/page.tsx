"use client";

import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/core";
import { ContestHeaderSection } from "@/features/contest-detail/components/ContestHeaderSection";
import { ContestPostingSection } from "@/features/contest-detail/components/ContestPostingSection";
import { ContestRestoreDialog } from "@/features/contest-detail/components/ContestRestoreDialog";
import { ContestResultsSection } from "@/features/contest-detail/components/ContestResultsSection";
import { ContestVoteFooter } from "@/features/contest-detail/components/ContestVoteFooter";
import { ContestVotingSection } from "@/features/contest-detail/components/ContestVotingSection";
import { useContestDetailController } from "@/features/contest-detail/hooks/useContestDetailController";

export default function VenueDetailPage() {
  const controller = useContestDetailController();
  const { loading, contestError, error, contest } = controller;

  if (loading)
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-black dark:text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
      </div>
    );
  if (contestError instanceof ApiError && contestError.status === 404) {
    return notFound();
  }
  if (error)
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  if (!contest)
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-black dark:text-white">
        大会が見つかりません。
      </div>
    );

  return (
    <div className="relative min-h-[100dvh] bg-white dark:bg-black text-black dark:text-white flex flex-col overflow-x-clip">
      {/* Top Parallel Background */}
      <div className="absolute left-0 top-0 w-full h-[280px] md:h-[320px] overflow-hidden z-0 select-none pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(15deg,#1DA1F2,#70c8f7)] overflow-hidden flex items-center justify-center">
          <div className="absolute w-[350%] h-[400%] md:w-[200%] md:h-[300%] -rotate-[15deg] opacity-[0.07] text-white font-black text-5xl md:text-7xl tracking-widest flex flex-col justify-center gap-0">
            {Array.from({ length: 14 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className={`h-10 md:h-16 flex items-center whitespace-nowrap gap-8 leading-none ${
                  rowIndex % 2 === 0
                    ? "translate-x-0"
                    : "translate-x-16 scale-y-[-1] scale-x-[-1] mt-2 md:mt-4"
                }`}
              >
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <span key={colIndex}>NETATWEET GRANDPRIX</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-10 relative z-20">
        <ContestHeaderSection controller={controller} />
        <ContestPostingSection controller={controller} />
        <ContestVotingSection controller={controller} />
        <ContestResultsSection controller={controller} />
      </div>

      <ContestVoteFooter controller={controller} />
      <ContestRestoreDialog controller={controller} />
    </div>
  );
}
