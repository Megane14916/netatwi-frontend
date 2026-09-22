import { browserRequest } from "../browser";

export interface JudgeAwardSelection {
  postId: number | null;
  comment: string;
}

export interface VotePayload {
  votes: Record<number, number>;
  judgeAward?: JudgeAwardSelection;
}

export const submitContestVotes = (contestId: number, payload: VotePayload): Promise<void> =>
  browserRequest<void>(`/api/contests/${contestId}/vote`, {
    method: "POST",
    json: payload,
  });
