"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ContestCard } from "@/features/contests/components/ContestCard";
import { flattenContests, getVisibleDailyContests } from "@/features/contests/model/contestPresentation";
import type { ContestsByStatus } from "@/types/domain";

export function HomeDailySection({
  contests,
  isLoading,
}: {
  contests: ContestsByStatus | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="relative z-20 pt-12 pb-20 animate-pulse">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-6"><div className="h-6 w-64 rounded-md bg-gray-200 dark:bg-gray-800 md:h-8"></div></div>
          <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
            {[1, 2, 3].map((index) => (
              <div key={index} className="py-6 px-3 md:p-8 flex flex-row items-center justify-between gap-2 md:gap-4">
                <div className="min-w-0">
                  <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-1 md:h-6 md:w-24 md:mb-2"></div>
                  <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-800 md:h-8 md:w-48"></div>
                  <div className="mt-1 h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-800 md:mt-2 md:h-4 md:w-32"></div>
                </div>
                <div className="shrink-0 flex flex-col items-end md:items-start">
                  <div className="h-3 w-8 rounded-md bg-gray-200 dark:bg-gray-800 mb-1 md:w-10"></div>
                  <div className="h-5 w-10 rounded-md bg-gray-200 dark:bg-gray-800 md:h-6 md:w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (!contests) return null;
  const visibleDailies = getVisibleDailyContests(flattenContests(contests), 3);
  if (visibleDailies.length === 0) return null;

  return (
    <section className="relative z-20 pt-12 pb-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-6 text-left">
          <h3 className="text-2xl font-bold text-black dark:text-white md:text-[40px]">デイリー</h3>
        </div>
        <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
          {visibleDailies.map(({ contest, status }) => (
            <ContestCard key={contest.id} contest={contest} status={status} />
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Link href="/venue" className="inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]">
            全ての大会を見る <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
