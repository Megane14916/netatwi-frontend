import type { UserSummary } from "./user";

export interface Post {
  id: number;
  content: string;
  images: string[];
  createdAt: string;
  userId: number;
  myVotes: number | null;
  myJudgeAward: boolean;
  myJudgeComment: string | null;
  hasCommented: boolean;
  commentCount: number;
}

export interface ResultPostVoter extends UserSummary {
  count: number;
  isJudge: boolean;
}

export interface ResultPost {
  id: number;
  content: string;
  images: string[];
  createdAt: string;
  score: number;
  rank: number | null;
  commentCount: number;
  hasCommented: boolean;
  user: UserSummary;
  voters: ResultPostVoter[];
  bookmarkCount: number;
  isBookmarked: boolean;
  awards: string[];
  contest?: {
    id: number;
    name: string;
    theme: string | null;
    scoringMethod?: string;
  };
  myVotes: number | null;
  isAdvanced: boolean;
}

export interface JudgeAward {
  judge: UserSummary;
  comment: string | null;
  post: Omit<ResultPost, "score" | "rank" | "commentCount" | "hasCommented" | "voters" | "bookmarkCount" | "isBookmarked" | "awards" | "myVotes" | "isAdvanced">;
}

export interface ContestPosts {
  posts: Post[];
  userHasVotedInContest: boolean;
  totalPosters: number;
}

export interface ContestResults {
  results: ResultPost[];
  judgeAwards: JudgeAward[];
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}
