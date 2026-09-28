import { getContestAccess, getContestTiming } from "@/features/contest-detail/model/contestStatus";
import { reconcilePostOrder, sortPostsByOrder } from "@/features/contest-detail/model/judgeOrder";
import {
  backupVotesToRecord,
  createVoteBackup,
  parseVoteBackup,
} from "@/features/contest-detail/model/voteBackup";
import { buildVotePayload, createInitialVoteState, getJudgeVoteProgress, getVoteValidationMessage, voteEditorReducer } from "@/features/contest-detail/model/voting";
import type { Post } from "@/types/domain";
import { freezeTime } from "@/__tests__/support/time";

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
  it("uses a frozen clock at the posting and voting boundaries", () => {
    const restore = freezeTime(schedule.endTime);
    try {
      expect(getContestTiming(schedule)).toMatchObject({ status: "voting", isPostDeadlineExceeded: true, isVoteDeadlineExceeded: false });
      jest.setSystemTime(new Date(schedule.votingEndTime));
      expect(getContestTiming(schedule)).toMatchObject({ status: "closed", isVoteDeadlineExceeded: true });
    } finally {
      restore();
    }
  });
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

  it.each([0, 5, 10])("allows saving a partial judge score of %s without an award", (score) => {
    expect(buildVotePayload({
      posts: [post(1), post(2)],
      state: { votes: { 1: score }, judgeAward: { postId: null, comment: "" } },
      userId: 99,
      isJudgeMode: true,
      judgeMaxScore: 10,
    })).toEqual({ ok: true, payload: { votes: { 1: score } } });
  });

  it.each(["", "  選評  "])("sends the selected award with its unchanged comment %j even without scores", (comment) => {
    expect(buildVotePayload({
      posts: [post(1), post(2)],
      state: { votes: {}, judgeAward: { postId: 2, comment } },
      userId: 99,
      isJudgeMode: true,
      judgeMaxScore: 10,
    })).toEqual({ ok: true, payload: { votes: {}, judgeAward: { postId: 2, comment } } });
  });

  it("allows saving after clearing all scores and deselecting the saved award", () => {
    let state = createInitialVoteState([
      { ...post(1), myVotes: 5, myJudgeAward: true, myJudgeComment: "選評" },
      post(2),
    ]);
    state = voteEditorReducer(state, { type: "set-vote", postId: 1, score: null });
    state = voteEditorReducer(state, { type: "toggle-judge-award", postId: 1 });
    expect(buildVotePayload({
      posts: [post(1), post(2)],
      state,
      userId: 99,
      isJudgeMode: true,
      judgeMaxScore: 10,
    })).toEqual({ ok: true, payload: { votes: {} } });
  });

  it("rejects out-of-range judge scores", () => {
    const result = buildVotePayload({
      posts: [post(1), post(2)],
      state: { votes: { 1: 11 }, judgeAward: { postId: null, comment: "" } },
      userId: 99,
      isJudgeMode: true,
      judgeMaxScore: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([{ code: "INVALID_JUDGE_SCORE", postId: 1 }]);
    }
  });

  it("rejects self votes, invalid general values and an invalid judge award", () => {
    const posts = [post(1, 10), post(2, 20)];
    const state = { votes: { 1: 1, 2: 2 }, judgeAward: { postId: 1, comment: "" } };
    expect(buildVotePayload({ posts, state, userId: 10, isJudgeMode: false, judgeMaxScore: 10 })).toEqual({
      ok: false,
      errors: [{ code: "SELF_VOTE", postId: 1 }, { code: "INVALID_GENERAL_VOTE", postId: 2 }],
    });
    expect(buildVotePayload({ posts, state, userId: 10, isJudgeMode: true, judgeMaxScore: 10 })).toEqual({
      ok: false,
      errors: [{ code: "SELF_VOTE", postId: 1 }, { code: "INVALID_JUDGE_AWARD", postId: 1 }],
    });
    expect(buildVotePayload({ posts, state: { votes: {}, judgeAward: { postId: 99, comment: "" } }, userId: 10, isJudgeMode: true, judgeMaxScore: 10 })).toEqual({
      ok: false, errors: [{ code: "INVALID_JUDGE_AWARD", postId: 99 }],
    });
  });

  it("fills only unvoted posts and reports judge progress", () => {
    const posts = [post(1, 10), post(2, 20), { ...post(3, 30), hasCommented: true }];
    let state = createInitialVoteState(posts);
    state = voteEditorReducer(state, { type: "set-vote", postId: 2, score: 5 });
    state = voteEditorReducer(state, { type: "fill-unvoted", postIds: [2, 3], score: 0 });
    state = voteEditorReducer(state, { type: "toggle-judge-award", postId: 2 });
    state = voteEditorReducer(state, { type: "set-judge-comment", comment: " 選評 " });
    expect(state.votes).toEqual({ 2: 5, 3: 0 });
    expect(getJudgeVoteProgress(posts, state, 10, new Set([2]))).toEqual({
      total: 2, voted: 2, commented: 2, hasCompleteJudgeAward: true,
    });
    expect(voteEditorReducer(state, { type: "restore", state: createInitialVoteState([]) })).toEqual(createInitialVoteState([]));
  });

  it.each([
    ["SELF_VOTE", "自分の投稿には投票できません。"],
    ["INVALID_GENERAL_VOTE", "一般投票の値が不正です。"],
    ["INVALID_JUDGE_SCORE", "審査員の点数が範囲外です。"],
    ["INVALID_JUDGE_AWARD", "審査員賞の対象が不正です。"],
  ] as const)("maps %s to an error message", (code, message) => {
    expect(getVoteValidationMessage({ code })).toBe(message);
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
