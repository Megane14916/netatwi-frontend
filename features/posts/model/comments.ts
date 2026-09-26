import type { Comment, ContestStatus } from "@/types/domain";

export const mergeComments = (
  remoteComments: Comment[],
  localComments: Comment[],
  deletedCommentIds: ReadonlySet<number>,
): Comment[] => {
  const localById = new Map(localComments.map((comment) => [comment.id, comment]));
  const merged = new Map<number, Comment>();
  for (const comment of remoteComments) {
    if (!deletedCommentIds.has(comment.id)) {
      merged.set(comment.id, localById.get(comment.id) ?? comment);
    }
  }
  for (const comment of localComments) {
    if (!deletedCommentIds.has(comment.id)) merged.set(comment.id, comment);
  }
  return Array.from(merged.values()).sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
};

export const getVisibleComments = (
  comments: Comment[],
  contestStatus: ContestStatus,
  currentUserId: number | null,
): Comment[] =>
  contestStatus === "closed"
    ? comments
    : comments.filter((comment) => comment.userId === currentUserId);
