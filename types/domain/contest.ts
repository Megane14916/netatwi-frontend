export type ContestType = "grandprix" | "daily";
export type ContestStatus = "upcoming" | "ongoing" | "voting" | "closed";
export type ScoringMethod = "general" | "judge" | "both";
export type ImageRule = "required" | "optional" | "forbidden";

export interface ContestSummary {
  id: number;
  name: string;
  theme: string | null;
  hasTheme: boolean;
  hasQualifier: boolean;
  type: ContestType;
  parentContestId: number | null;
  startTime: string | null;
  endTime: string | null;
  votingEndTime: string | null;
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

export interface Contest extends ContestSummary {
  scoringMethod: ScoringMethod;
  imageRule: ImageRule;
  isVotingVisible: boolean;
  advancementNumerator: number | null;
  advancementDenominator: number | null;
  judgeAwardAdvancement: boolean;
  generalVoteWeight: number;
  judgeMaxScore: number;
  isAdvancedToFinal: boolean | null;
  resultCommentTop: string | null;
  resultCommentBottom: string | null;
  postCount: number;
}

export interface LatestContestResult {
  contestId: number;
  contestName: string;
  theme: string | null;
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

export interface ContestsByStatus {
  ongoing: ContestSummary[];
  voting: ContestSummary[];
  upcoming: ContestSummary[];
  closed: ContestSummary[];
  latestResult: LatestContestResult | null;
}
