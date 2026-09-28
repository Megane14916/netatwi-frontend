import type { Contest, ContestStatus, ScoringMethod } from "@/types/domain";

type ContestSchedule = Pick<Contest, "startTime" | "endTime" | "votingEndTime">;

export interface ContestTiming {
  status: ContestStatus;
  isPostDeadlineExceeded: boolean;
  isVoteDeadlineExceeded: boolean;
}

export const getContestTiming = (
  contest: ContestSchedule,
  now: Date = new Date(),
): ContestTiming => {
  const currentTime = now.getTime();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();
  const votingEndTime = new Date(contest.votingEndTime).getTime();

  let status: ContestStatus = "closed";
  if (currentTime < startTime) status = "upcoming";
  else if (currentTime < endTime) status = "ongoing";
  else if (currentTime < votingEndTime) status = "voting";

  return {
    status,
    isPostDeadlineExceeded: currentTime >= endTime,
    isVoteDeadlineExceeded: currentTime >= votingEndTime,
  };
};

interface ContestAccessInput {
  status: ContestStatus;
  scoringMethod: ScoringMethod;
  isVotingVisible: boolean;
  isAuthenticated: boolean;
  isJudge: boolean;
}

export interface ContestAccess {
  canSubmitPost: boolean;
  canViewVotingPosts: boolean;
  canVote: boolean;
  canJudgeLogin: boolean;
}

export const getContestAccess = ({
  status,
  scoringMethod,
  isVotingVisible,
  isAuthenticated,
  isJudge,
}: ContestAccessInput): ContestAccess => ({
  canSubmitPost: status === "ongoing" && isAuthenticated,
  canViewVotingPosts: status === "voting" && (isVotingVisible || isJudge),
  canVote:
    status === "voting" &&
    ((scoringMethod !== "judge" && isAuthenticated) || isJudge),
  canJudgeLogin:
    status === "voting" && scoringMethod !== "user" && !isJudge,
});
