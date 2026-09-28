import type { Comment, Contest, Post, ResultPost, User } from "@/types/domain";

export const userFactory = (overrides: Partial<User> = {}): User => ({
  id: 10,
  name: "Test User",
  screenName: "test_user",
  profileImageUrl: null,
  isAdmin: false,
  ...overrides,
});

export const contestFactory = (overrides: Partial<Contest> = {}): Contest => ({
  id: 1,
  name: "Test Contest",
  theme: null,
  hasTheme: false,
  hasQualifier: false,
  type: "daily",
  parentContestId: null,
  startTime: "2026-01-01T10:00:00.000Z",
  endTime: "2026-01-01T11:00:00.000Z",
  votingEndTime: "2026-01-01T12:00:00.000Z",
  totalPosters: 0,
  totalVoters: 0,
  totalJudges: 0,
  scoringMethod: "general",
  imageRule: "optional",
  isVotingVisible: true,
  advancementNumerator: null,
  advancementDenominator: null,
  judgeAwardAdvancement: false,
  generalVoteWeight: 1,
  judgeMaxScore: 10,
  isAdvancedToFinal: null,
  resultCommentTop: null,
  resultCommentBottom: null,
  postCount: 0,
  ...overrides,
});

export const postFactory = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  userId: 20,
  content: "Test post",
  images: [],
  createdAt: "2026-01-01T10:30:00.000Z",
  myVotes: null,
  myJudgeAward: false,
  myJudgeComment: null,
  hasCommented: false,
  commentCount: 0,
  ...overrides,
});

export const resultPostFactory = (overrides: Partial<ResultPost> = {}): ResultPost => ({
  ...postFactory(),
  score: 0,
  rank: null,
  user: userFactory(),
  voters: [],
  bookmarkCount: 0,
  isBookmarked: false,
  awards: [],
  isAdvanced: false,
  ...overrides,
});

export const commentFactory = (overrides: Partial<Comment> = {}): Comment => ({
  id: 1,
  userId: 20,
  postId: 1,
  content: "Test comment",
  isJudge: false,
  createdAt: "2026-01-01T10:30:00.000Z",
  updatedAt: "2026-01-01T10:30:00.000Z",
  user: userFactory({ id: 20 }),
  ...overrides,
});
