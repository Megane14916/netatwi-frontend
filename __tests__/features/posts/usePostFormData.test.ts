import { act, renderHook } from "@testing-library/react";
import { usePostFormData } from "@/features/posts/hooks/usePostFormData";
import { getContest, getContestPosts } from "@/lib/api/endpoints/contests";
import type { Contest, ContestPosts } from "@/types/domain";

jest.mock("@/lib/api/endpoints/contests", () => ({ getContest: jest.fn(), getContestPosts: jest.fn() }));

const contest: Contest = {
  id: 1, name: "大会", theme: null, hasTheme: false, hasQualifier: false,
  type: "grandprix", parentContestId: 2,
  startTime: "2026-01-01T00:00:00Z", endTime: "2026-01-02T00:00:00Z", votingEndTime: "2026-01-03T00:00:00Z",
  totalPosters: 1, totalVoters: 0, totalJudges: 0,
  scoringMethod: "general", imageRule: "required", isVotingVisible: true,
  advancementNumerator: null, advancementDenominator: null, judgeAwardAdvancement: false,
  generalVoteWeight: 1, judgeMaxScore: 10, isAdvancedToFinal: false,
  resultCommentTop: null, resultCommentBottom: null, postCount: 1,
};

it("stores the contest before fetching posts and preserves its constraints on posts failure", async () => {
  let resolveContest!: (value: Contest) => void;
  let rejectPosts!: (error: Error) => void;
  const contestRequest = new Promise<Contest>(resolve => { resolveContest = resolve; });
  const postsRequest = new Promise<ContestPosts>((_, reject) => { rejectPosts = reject; });
  jest.mocked(getContest).mockReturnValueOnce(contestRequest);
  jest.mocked(getContestPosts).mockReturnValueOnce(postsRequest);
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  try {
    const { result } = renderHook(() => usePostFormData({ contestId: 1, userId: 10 }));
    await act(async () => resolveContest(contest));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.contestInfo).toMatchObject({
      id: 1, imageRule: "required", endTime: contest.endTime, isAdvancedToFinal: false, parentContestId: 2,
    });
    await act(async () => rejectPosts(new Error("posts failed")));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.contestInfo).toMatchObject({
      imageRule: "required", endTime: contest.endTime, isAdvancedToFinal: false, parentContestId: 2,
    });
    expect(result.current.myPost).toBeNull();
  } finally {
    consoleError.mockRestore();
  }
});
