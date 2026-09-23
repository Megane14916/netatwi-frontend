import type { JudgeAwardSelection } from "@/lib/api/endpoints/votes";
import type { Post } from "@/types/domain";

export const VOTE_BACKUP_VERSION = 1 as const;

export interface VoteBackup {
  version: typeof VOTE_BACKUP_VERSION;
  contestId: number;
  votes: Array<{ id: number; score: number; content: string }>;
  judgeAwardSelection: JudgeAwardSelection;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createVoteBackup = (
  contestId: number,
  votes: Record<number, number>,
  posts: Post[],
  judgeAwardSelection: JudgeAwardSelection,
): VoteBackup => ({
  version: VOTE_BACKUP_VERSION,
  contestId,
  votes: Object.entries(votes).map(([postId, score]) => ({
    id: Number(postId),
    score,
    content: posts.find((post) => post.id === Number(postId))?.content ?? "",
  })),
  judgeAwardSelection,
});

export const parseVoteBackup = (
  value: unknown,
  expectedContestId: number,
): VoteBackup | null => {
  if (!isRecord(value)) return null;
  if (value.version !== VOTE_BACKUP_VERSION || value.contestId !== expectedContestId) return null;
  if (!Array.isArray(value.votes) || !isRecord(value.judgeAwardSelection)) return null;

  const votes: VoteBackup["votes"] = [];
  const seen = new Set<number>();
  for (const item of value.votes) {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.id) ||
      seen.has(item.id as number) ||
      typeof item.score !== "number" ||
      !Number.isFinite(item.score) ||
      typeof item.content !== "string"
    ) {
      return null;
    }
    seen.add(item.id as number);
    votes.push({ id: item.id as number, score: item.score, content: item.content });
  }

  const selection = value.judgeAwardSelection;
  if (
    (selection.postId !== null && !Number.isInteger(selection.postId)) ||
    typeof selection.comment !== "string"
  ) {
    return null;
  }

  return {
    version: VOTE_BACKUP_VERSION,
    contestId: expectedContestId,
    votes,
    judgeAwardSelection: {
      postId: selection.postId as number | null,
      comment: selection.comment,
    },
  };
};

export const backupVotesToRecord = (backup: VoteBackup): Record<number, number> =>
  Object.fromEntries(backup.votes.map(({ id, score }) => [id, score]));
