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
