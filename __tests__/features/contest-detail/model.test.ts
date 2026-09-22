import { getContestAccess, getContestTiming } from "@/features/contest-detail/model/contestStatus";
import { reconcilePostOrder, sortPostsByOrder } from "@/features/contest-detail/model/judgeOrder";
import {
  backupVotesToRecord,
  createVoteBackup,
  parseVoteBackup,
} from "@/features/contest-detail/model/voteBackup";
import { buildVotePayload, createInitialVoteState } from "@/features/contest-detail/model/voting";
import type { Post } from "@/types/domain";

const post = (id: number, userId = id): Post => ({
  id,
  userId,
  content: `post-${id}`,
  images: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  myVotes: null,
  myJudgeAward: false,
  myJudgeComment: null,
  hasCommented: false,
  commentCount: 0,
});

const schedule = {
  startTime: "2026-01-01T10:00:00.000Z",
  endTime: "2026-01-01T11:00:00.000Z",
  votingEndTime: "2026-01-01T12:00:00.000Z",
};

describe("contest detail model", () => {
  it.each([
    ["2026-01-01T09:59:00.000Z", "upcoming"],
    ["2026-01-01T10:30:00.000Z", "ongoing"],
    ["2026-01-01T11:30:00.000Z", "voting"],
    ["2026-01-01T12:00:00.000Z", "closed"],
  ] as const)("derives %s as %s", (now, expected) => {
    expect(getContestTiming(schedule, new Date(now)).status).toBe(expected);
  });

  it("derives voting permissions for users and judges", () => {
    expect(
      getContestAccess({
        status: "voting",
        scoringMethod: "judge",
        isVotingVisible: false,
        isAuthenticated: true,
        isJudge: false,
      }),
    ).toMatchObject({ canViewVotingPosts: false, canVote: false, canJudgeLogin: true });

    expect(
      getContestAccess({
        status: "voting",
        scoringMethod: "judge",
        isVotingVisible: false,
        isAuthenticated: true,
        isJudge: true,
      }),
    ).toMatchObject({ canViewVotingPosts: true, canVote: true, canJudgeLogin: false });
  });

  it("only allows authenticated posting during the ongoing phase", () => {
    expect(
      getContestAccess({
        status: "ongoing",
        scoringMethod: "general",
        isVotingVisible: true,
        isAuthenticated: true,
        isJudge: false,
      }).canSubmitPost,
    ).toBe(true);
    expect(
      getContestAccess({
        status: "upcoming",
        scoringMethod: "general",
        isVotingVisible: true,
        isAuthenticated: true,
        isJudge: false,
      }).canSubmitPost,
    ).toBe(false);
  });

  it("builds a valid general vote payload", () => {
    const result = buildVotePayload({
      posts: [post(1, 10), post(2, 20)],
      state: { votes: { 2: 1 }, judgeAward: { postId: null, comment: "" } },
      userId: 10,
      isJudgeMode: false,
      judgeMaxScore: 10,
    });
    expect(result).toEqual({ ok: true, payload: { votes: { 2: 1 } } });
  });

  it("rejects incomplete judge scoring and judge award data", () => {
    const result = buildVotePayload({
      posts: [post(1), post(2)],
      state: { votes: { 1: 11 }, judgeAward: { postId: null, comment: "" } },
      userId: 99,
      isJudgeMode: true,
      judgeMaxScore: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map(({ code }) => code)).toEqual(
        expect.arrayContaining([
          "INVALID_JUDGE_SCORE",
          "MISSING_JUDGE_SCORE",
          "MISSING_JUDGE_AWARD",
        ]),
      );
    }
  });

  it("creates initial vote state from server values", () => {
    const posts = [
      { ...post(1), myVotes: 4, myJudgeAward: true, myJudgeComment: "選評" },
    ];
    expect(createInitialVoteState(posts)).toEqual({
      votes: { 1: 4 },
      judgeAward: { postId: 1, comment: "選評" },
    });
  });

  it("reconciles persisted judge order with current posts", () => {
    const order = reconcilePostOrder([2, 99, 2], [1, 2, 3], () => 0);
    expect(order).toEqual([2, 3, 1]);
    expect(sortPostsByOrder([post(1), post(2), post(3)], order).map(({ id }) => id)).toEqual(order);
  });

  it("requires matching version and contest id for backups", () => {
    const posts = [post(1), post(2)];
    const backup = createVoteBackup(7, { 1: 5 }, posts, { postId: 2, comment: "賞" });
    expect(parseVoteBackup(backup, 8)).toBeNull();
    expect(parseVoteBackup({ ...backup, version: 2 }, 7)).toBeNull();
    const parsed = parseVoteBackup(backup, 7);
    expect(parsed && backupVotesToRecord(parsed)).toEqual({ 1: 5 });
  });
});
