import type { ContestType, ImageRule, ScoringMethod } from "@/types/domain";

export interface AdminContestPayload {
  name: string;
  theme: string | null;
  hasTheme: boolean;
  type: ContestType;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  scoringMethod: ScoringMethod;
  imageRule: ImageRule;
  isVotingVisible: boolean;
  generalVoteWeight: number;
  judgeMaxScore: number;
  hasQualifier?: boolean;
  qualifierStartTime?: string | null;
  qualifierEndTime?: string | null;
  qualifierVotingEndTime?: string | null;
  advancementNumerator?: number | null;
  advancementDenominator?: number | null;
  judgeAwardAdvancement?: boolean;
  judgePassword?: string;
  resultCommentTop?: string | null;
  resultCommentBottom?: string | null;
}

export type UpdateContestPayload = Partial<AdminContestPayload>;

export interface AdminCreateContestPayload {
  name: string;
  type: ContestType;
  hasQualifier: boolean;
  advancementNumerator: number;
  advancementDenominator: number;
  qualifierJudgeAwardAdvancement: boolean;
  hasTheme: boolean;
  theme: string;
  scoringMethod: ScoringMethod;
  imageRule: ImageRule;
  isVotingVisible: boolean;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  judgePassword: string;
  generalVoteWeight: number;
  judgeMaxScore: number;
  qualifierHasTheme: boolean;
  qualifierTheme: string;
  qualifierScoringMethod: ScoringMethod;
  qualifierImageRule: ImageRule;
  qualifierIsVotingVisible: boolean;
  qualifierStartTime: string;
  qualifierEndTime: string;
  qualifierVotingEndTime: string;
  qualifierJudgePassword: string;
  qualifierGeneralVoteWeight: number;
  qualifierJudgeMaxScore: number;
}

export interface AdminManagedContest {
  id: number;
  name: string;
  theme: string | null;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  judgePassword?: string | null;
  type: ContestType;
  scoringMethod: ScoringMethod;
  imageRule: ImageRule;
  generalVoteWeight: number;
  judgeMaxScore: number;
  isVotingVisible: boolean;
  advancementNumerator: number | null;
  advancementDenominator: number | null;
  judgeAwardAdvancement: boolean;
  resultCommentTop: string | null;
  resultCommentBottom: string | null;
}

export type AdminUpdateContestPayload = Omit<AdminManagedContest, "id">;
