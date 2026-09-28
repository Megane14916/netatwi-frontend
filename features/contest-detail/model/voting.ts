import type { VotePayload, JudgeAwardSelection } from "@/lib/api/endpoints/votes";
import type { Post } from "@/types/domain";

export interface VoteEditorState {
  votes: Record<number, number>;
  judgeAward: JudgeAwardSelection;
}

export type VoteEditorAction =
  | { type: "set-vote"; postId: number; score: number | null }
  | { type: "toggle-judge-award"; postId: number }
  | { type: "set-judge-comment"; comment: string }
  | { type: "fill-unvoted"; postIds: number[]; score: number }
  | { type: "restore"; state: VoteEditorState };

export const createInitialVoteState = (posts: Post[]): VoteEditorState => {
  const votes: Record<number, number> = {};
  let judgeAward: JudgeAwardSelection = { postId: null, comment: "" };

  for (const post of posts) {
    if (post.myVotes !== null) votes[post.id] = post.myVotes;
    if (post.myJudgeAward) {
      judgeAward = {
        postId: post.id,
        comment: post.myJudgeComment ?? "",
      };
    }
  }

  return { votes, judgeAward };
};

export const voteEditorReducer = (
  state: VoteEditorState,
  action: VoteEditorAction,
): VoteEditorState => {
  switch (action.type) {
    case "set-vote": {
      const votes = { ...state.votes };
      if (action.score === null) delete votes[action.postId];
      else votes[action.postId] = action.score;
      return { ...state, votes };
    }
    case "toggle-judge-award":
      return {
        ...state,
        judgeAward:
          state.judgeAward.postId === action.postId
            ? { postId: null, comment: "" }
            : { postId: action.postId, comment: "" },
      };
    case "set-judge-comment":
      return {
        ...state,
        judgeAward: { ...state.judgeAward, comment: action.comment },
      };
    case "fill-unvoted": {
      const votes = { ...state.votes };
      for (const postId of action.postIds) {
        if (votes[postId] === undefined) votes[postId] = action.score;
      }
      return { ...state, votes };
    }
    case "restore":
      return action.state;
  }
};

export type VoteValidationCode =
  | "SELF_VOTE"
  | "INVALID_GENERAL_VOTE"
  | "INVALID_JUDGE_SCORE"
  | "INVALID_JUDGE_AWARD";

export interface VoteValidationError {
  code: VoteValidationCode;
  postId?: number;
}

interface BuildVotePayloadInput {
  posts: Post[];
  state: VoteEditorState;
  userId: number | null;
  isJudgeMode: boolean;
  judgeMaxScore: number;
}

export type VotePayloadResult =
  | { ok: true; payload: VotePayload }
  | { ok: false; errors: VoteValidationError[] };

export const buildVotePayload = ({
  posts,
  state,
  userId,
  isJudgeMode,
  judgeMaxScore,
}: BuildVotePayloadInput): VotePayloadResult => {
  const errors: VoteValidationError[] = [];
  const postsById = new Map(posts.map((post) => [post.id, post]));

  for (const [postIdText, score] of Object.entries(state.votes)) {
    const postId = Number(postIdText);
    const post = postsById.get(postId);
    if (!post) continue;
    if (post.userId === userId) {
      errors.push({ code: "SELF_VOTE", postId });
      continue;
    }
    if (isJudgeMode) {
      if (!Number.isFinite(score) || score < 0 || score > judgeMaxScore) {
        errors.push({ code: "INVALID_JUDGE_SCORE", postId });
      }
    } else if (score !== 1) {
      errors.push({ code: "INVALID_GENERAL_VOTE", postId });
    }
  }

  if (isJudgeMode && state.judgeAward.postId) {
    const awardPost = postsById.get(state.judgeAward.postId);
    if (!awardPost || awardPost.userId === userId) {
      errors.push({ code: "INVALID_JUDGE_AWARD", postId: state.judgeAward.postId });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const { votes, judgeAward: judgeAwardSelection } = state;
  const payload: VotePayload = { votes };
  if (isJudgeMode && judgeAwardSelection.postId)
    payload.judgeAward = judgeAwardSelection;
  return { ok: true, payload };
};

export const getVoteValidationMessage = (error: VoteValidationError): string => {
  switch (error.code) {
    case "SELF_VOTE":
      return "自分の投稿には投票できません。";
    case "INVALID_GENERAL_VOTE":
      return "一般投票の値が不正です。";
    case "INVALID_JUDGE_SCORE":
      return "審査員の点数が範囲外です。";
    case "INVALID_JUDGE_AWARD":
      return "審査員賞の対象が不正です。";
  }
};

export const getJudgeVoteProgress = (
  posts: Post[],
  state: VoteEditorState,
  userId: number | null,
  commentedPostIds: Set<number>,
) => {
  const votablePosts = posts.filter((post) => post.userId !== userId);
  return {
    total: votablePosts.length,
    voted: votablePosts.filter((post) => state.votes[post.id] !== undefined).length,
    commented: votablePosts.filter(
      (post) => post.hasCommented || commentedPostIds.has(post.id),
    ).length,
    hasCompleteJudgeAward: Boolean(
      state.judgeAward.postId && state.judgeAward.comment.trim(),
    ),
  };
};
