import dayjs from "dayjs";
import RippleLink from "@/components/RippleLink";
import type { ContestStatus, ContestSummary } from "@/types/domain";

const STATUS_CONFIG: Record<ContestStatus, { label: string; background: string }> = {
  upcoming: { label: "準備中", background: "bg-gray-500" },
  ongoing: { label: "投稿期間", background: "bg-[#1DA1F2]" },
  voting: { label: "投票期間", background: "bg-green-500" },
  closed: { label: "結果発表", background: "bg-yellow-400" },
};

const getTimeText = (contest: ContestSummary, status?: ContestStatus): string => {
  if (status === "upcoming") return `投稿開始: ${dayjs(contest.startTime).format("YYYY年MM月DD日 HH:mm")}`;
  if (status === "ongoing") return `投稿締切: ${dayjs(contest.endTime).format("YYYY年MM月DD日 HH:mm")}`;
  if (status === "voting") return `投票締切: ${dayjs(contest.votingEndTime).format("YYYY年MM月DD日 HH:mm")}`;
  return `開催日時：${dayjs(contest.startTime).format("YYYY年MM月DD日 HH:mm")}`;
};

interface ContestCardProps {
  contest: ContestSummary;
  status?: ContestStatus;
  countSuffix?: "人" | "件";
  muted?: boolean;
  compactTitle?: boolean;
}

export function ContestCard({
  contest,
  status,
  countSuffix = "件",
  muted = false,
  compactTitle = false,
}: ContestCardProps) {
  const config = status ? STATUS_CONFIG[status] : null;
  return (
    <RippleLink
      href={`/venue/${contest.id}`}
      prefetch={false}
      className={`block group relative overflow-hidden ${muted ? "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700" : "bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800"} py-6 px-3 md:p-8 transition-colors duration-300`}
    >
      <div className="relative z-10 flex flex-row items-center justify-between gap-2 md:gap-4">
        <div className="min-w-0 flex-1">
          {config && (
            <div className="mb-1 md:mb-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] md:px-3 md:py-1 md:text-xs font-bold text-white ${config.background}`}>
                {config.label}
              </span>
            </div>
          )}
          <h4 className={`truncate text-base font-bold text-black dark:text-white ${compactTitle ? "md:text-xl" : "md:text-2xl"}`}>
            {contest.name}
          </h4>
          <p className="mt-0.5 md:mt-1 truncate text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
            {getTimeText(contest, status)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-8">
          <div className="flex flex-col items-end md:items-start">
            <span className="text-[10px] md:text-xs font-medium text-black/60 dark:text-white/60">投稿数</span>
            <span className={`${compactTitle ? "text-base md:text-lg" : "text-base md:text-xl"} font-bold text-black dark:text-white`}>
              {contest.totalPosters ?? 0}{countSuffix}
            </span>
          </div>
        </div>
      </div>
    </RippleLink>
  );
}
