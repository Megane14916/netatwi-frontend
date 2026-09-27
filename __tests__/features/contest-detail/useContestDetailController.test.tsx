import { act, renderHook } from "@testing-library/react";
import { useContestDetailController } from "@/features/contest-detail/hooks/useContestDetailController";
import { useContest, useContestPosts, useContestResults } from "@/hooks/api/useContests";
import { submitContestVotes } from "@/lib/api/endpoints/votes";
import type { Contest, ContestPosts, Post } from "@/types/domain";

const mockAuth = {
  user: { id: 10, name: "投票者", screenName: "voter", profileImageUrl: null, isAdmin: false },
  judgeContests: [] as number[],
  refetchUser: jest.fn(),
};
jest.mock("@/context/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock("next/navigation", () => ({ useParams: () => ({ id: "1" }) }));
jest.mock("@/hooks/api/useContests", () => ({ useContest: jest.fn(), useContestPosts: jest.fn(), useContestResults: jest.fn() }));
jest.mock("@/lib/api/endpoints/votes", () => ({ submitContestVotes: jest.fn() }));
jest.mock("@/features/posts/hooks/usePrefetchedComments", () => ({ usePrefetchedComments: () => ({}) }));

const contest: Contest = {
  id: 1, name: "大会", theme: null, hasTheme: false, hasQualifier: false,
  type: "daily", parentContestId: null,
  startTime: "2026-01-01T00:00:00Z", endTime: "2026-01-02T00:00:00Z", votingEndTime: "2099-01-01T00:00:00Z",
  totalPosters: 2, totalVoters: 0, totalJudges: 0,
  scoringMethod: "both", imageRule: "optional", isVotingVisible: true,
  advancementNumerator: null, advancementDenominator: null, judgeAwardAdvancement: false,
  generalVoteWeight: 1, judgeMaxScore: 10, isAdvancedToFinal: null,
  resultCommentTop: null, resultCommentBottom: null, postCount: 2,
};
const post = (id: number): Post => ({
  id, userId: id + 20, content: `投稿${id}`, images: [], createdAt: "2026-01-01T00:00:00Z",
  myVotes: null, myJudgeAward: false, myJudgeComment: null, hasCommented: false, commentCount: 0,
});
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => { resolve = resolvePromise; });
  return { promise, resolve };
};
const mockMutatePosts = jest.fn();
const setPosts = (data: ContestPosts) => jest.mocked(useContestPosts).mockReturnValue({
  data, error: undefined, isLoading: false, isValidating: false, mutate: mockMutatePosts,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-27T00:00:00Z"));
  window.localStorage.clear();
  mockAuth.judgeContests = [];
  mockMutatePosts.mockReset();
  jest.mocked(useContest).mockReturnValue({ data: contest, error: undefined, isLoading: false, isValidating: false, mutate: jest.fn() });
  jest.mocked(useContestResults).mockReturnValue({ data: undefined, error: undefined, isLoading: false, isValidating: false, mutate: jest.fn() });
  setPosts({ posts: [post(1), post(2)], userHasVotedInContest: false, totalPosters: 2 });
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

it("keeps general vote edits made during submission and sends them on the next save", async () => {
  const submission = deferred<void>();
  const saved: ContestPosts = { posts: [{ ...post(1), myVotes: 1 }, post(2)], userHasVotedInContest: true, totalPosters: 2 };
  jest.mocked(submitContestVotes).mockReturnValueOnce(submission.promise).mockResolvedValueOnce(undefined);
  mockMutatePosts.mockResolvedValue(saved);
  const { result, rerender } = renderHook(() => useContestDetailController());
  act(() => result.current.handleVoteChange(1, 1));
  act(() => result.current.handleVoteClick());
  expect(result.current.isSubmittingVotes).toBe(true);
  expect(submitContestVotes).toHaveBeenNthCalledWith(1, 1, { votes: { 1: 1 } });
  act(() => {
    result.current.handleVoteChange(1, null);
    result.current.handleVoteChange(2, 1);
  });
  setPosts(saved);
  rerender();
  await act(async () => submission.resolve());
  expect(result.current.isSubmittingVotes).toBe(false);
  expect(result.current.showSuccessBanner).toBe(true);
  expect(result.current.votes).toEqual({ 2: 1 });
  await act(async () => result.current.handleVoteClick());
  expect(submitContestVotes).toHaveBeenNthCalledWith(2, 1, { votes: { 2: 1 } });
});

it.each(["submission", "refresh"])("keeps judge scores, award and comment edited during %s", async (phase) => {
  mockAuth.judgeContests = [1];
  const submission = deferred<void>();
  const refresh = deferred<ContestPosts>();
  const saved: ContestPosts = {
    posts: [{ ...post(1), myVotes: 5, myJudgeAward: true, myJudgeComment: "送信済みの選評" }, post(2)],
    userHasVotedInContest: true, totalPosters: 2,
  };
  jest.mocked(submitContestVotes).mockReturnValueOnce(submission.promise).mockResolvedValueOnce(undefined);
  mockMutatePosts.mockReturnValue(refresh.promise);
  const { result, rerender } = renderHook(() => useContestDetailController());
  act(() => {
    result.current.handleVoteChange(1, 5);
    result.current.handleJudgeAwardSelect(1);
    result.current.handleJudgeCommentChange("送信済みの選評");
  });
  act(() => result.current.handleVoteClick());
  expect(submitContestVotes).toHaveBeenNthCalledWith(1, 1, {
    votes: { 1: 5 }, judgeAward: { postId: 1, comment: "送信済みの選評" },
  });
  if (phase === "refresh") {
    await act(async () => submission.resolve());
    expect(mockMutatePosts).toHaveBeenCalledTimes(1);
  }
  expect(result.current.isSubmittingVotes).toBe(true);
  act(() => {
    result.current.handleVoteChange(1, 7);
    result.current.handleVoteChange(2, 0);
    result.current.handleJudgeAwardSelect(2);
    result.current.handleJudgeCommentChange("編集中の選評");
  });
  if (phase === "submission") await act(async () => submission.resolve());
  setPosts(saved);
  rerender();
  await act(async () => refresh.resolve(saved));
  expect(result.current.isSubmittingVotes).toBe(false);
  expect(result.current.votes).toEqual({ 1: 7, 2: 0 });
  expect(result.current.judgeAwardSelection).toEqual({ postId: 2, comment: "編集中の選評" });
  await act(async () => result.current.handleVoteClick());
  expect(submitContestVotes).toHaveBeenNthCalledWith(2, 1, {
    votes: { 1: 7, 2: 0 }, judgeAward: { postId: 2, comment: "編集中の選評" },
  });
});
