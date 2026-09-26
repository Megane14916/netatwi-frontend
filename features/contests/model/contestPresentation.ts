import type {
  ContestStatus,
  ContestSummary,
  ContestType,
  ContestsByStatus,
} from "@/types/domain";

export type GrandPrixStep = 0 | 1 | 2 | 3 | 4;

export const GRAND_PRIX_STEPS = [
  "予選投稿",
  "予選投票",
  "決勝投稿",
  "決勝投票",
  "決勝結果",
] as const;

export const flattenContests = (contests: ContestsByStatus): ContestSummary[] => [
  ...contests.ongoing,
  ...contests.voting,
  ...contests.upcoming,
  ...contests.closed,
];

const isBefore = (value: string | null, now: Date): boolean =>
  value !== null && now.getTime() < new Date(value).getTime();

export const getContestStatus = (
  contest: ContestSummary,
  now = new Date(),
): ContestStatus => {
  if (isBefore(contest.startTime, now)) return "upcoming";
  if (isBefore(contest.endTime, now)) return "ongoing";
  if (isBefore(contest.votingEndTime, now)) return "voting";
  return "closed";
};

export const getGrandPrixStep = (
  finals: ContestSummary,
  qualifier: ContestSummary | null | undefined,
  now = new Date(),
): GrandPrixStep => {
  if (qualifier) {
    if (isBefore(qualifier.endTime, now)) return 0;
    if (isBefore(qualifier.votingEndTime, now)) return 1;
  }
  if (isBefore(finals.endTime, now)) return 2;
  if (isBefore(finals.votingEndTime, now)) return 3;
  return 4;
};

export interface GrandPrixProgress {
  finals: ContestSummary;
  qualifier?: ContestSummary;
  displayContest: ContestSummary;
  step: GrandPrixStep;
  isBeforeStart: boolean;
}

export const getGrandPrixProgress = (
  contests: ContestSummary[],
  now = new Date(),
): GrandPrixProgress | null => {
  const finals =
    contests.find(
      (contest) => contest.type === "grandprix" && contest.parentContestId !== null,
    ) ?? contests.find((contest) => contest.hasQualifier);
  if (!finals) return null;

  const qualifier = finals.parentContestId
    ? contests.find((contest) => contest.id === finals.parentContestId)
    : undefined;
  const step = getGrandPrixStep(finals, qualifier, now);
  const displayContest = step <= 1 && qualifier ? qualifier : finals;
  const firstStart = qualifier?.startTime ?? finals.startTime;
  return {
    finals,
    qualifier,
    displayContest,
    step,
    isBeforeStart: isBefore(firstStart, now),
  };
};

export const isContestType = (contest: ContestSummary, type: ContestType): boolean => {
  if (contest.type) return contest.type === type;
  return type === "daily" ? contest.name.includes("デイリー") : !contest.name.includes("デイリー");
};

export const sortContestsNewestFirst = (contests: ContestSummary[]): ContestSummary[] =>
  [...contests].sort(
    (left, right) =>
      new Date(right.startTime ?? 0).getTime() - new Date(left.startTime ?? 0).getTime(),
  );

export interface CategorizedContest {
  contest: ContestSummary;
  status: ContestStatus;
}

export const getVisibleDailyContests = (
  contests: ContestSummary[],
  limit: number,
  now = new Date(),
): CategorizedContest[] => {
  const oneHour = 60 * 60 * 1000;
  const grouped: Record<ContestStatus, ContestSummary[]> = {
    upcoming: [],
    ongoing: [],
    voting: [],
    closed: [],
  };
  for (const contest of contests) {
    if (!isContestType(contest, "daily")) continue;
    if (
      contest.startTime &&
      isBefore(contest.startTime, now) &&
      new Date(contest.startTime).getTime() - now.getTime() > oneHour
    ) continue;
    grouped[getContestStatus(contest, now)].push(contest);
  }
  return (["upcoming", "ongoing", "voting", "closed"] as const)
    .flatMap((status) =>
      sortContestsNewestFirst(grouped[status]).map((contest) => ({ contest, status })),
    )
    .slice(0, limit);
};

export const getContestTitleParts = (name: string): string[] => {
  const keyword = "ネタツイグランプリ";
  if (!name.includes(keyword)) return [name];
  const [before, after] = name.split(keyword);
  return [before, keyword, after].filter(Boolean);
};
