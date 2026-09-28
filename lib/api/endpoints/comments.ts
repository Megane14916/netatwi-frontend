import { mapComment } from "@/lib/mappers/api";
import type { Comment } from "@/types/domain";
import { browserRequest } from "../browser";
import { asRecord, validateComments, validateCommentsByPost } from "../validation";

export const commentKeys = {
  forPost: (postId: number) => `/api/posts/${postId}/comments`,
  forPosts: (postIds: number[]) => `/api/comments?postIds=${postIds.join(",")}`,
} as const;

export const getPostComments = async (postId: number): Promise<Comment[]> =>
  (await browserRequest(commentKeys.forPost(postId), { validate: validateComments })).map(mapComment);

export const getCommentsByPostIds = async (
  postIds: number[],
): Promise<Record<number, Comment[]>> => {
  if (postIds.length === 0) return {};
  const response = await browserRequest(commentKeys.forPosts(postIds), {
    validate: validateCommentsByPost,
  });
  return Object.fromEntries(
    Object.entries(response).map(([postId, comments]) => [postId, comments.map(mapComment)]),
  );
};

export const createComment = async (postId: number, content: string): Promise<number> => {
  const response = await browserRequest<unknown>(commentKeys.forPost(postId), {
    method: "POST",
    json: { content },
  });
  const record = asRecord(response, "create comment response");
  if (typeof record.id !== "number") throw new Error("comment id must be a number");
  return record.id;
};

export const updateComment = (commentId: number, content: string): Promise<unknown> =>
  browserRequest(`/api/comments/${commentId}`, {
    method: "PUT",
    json: { content },
  });

export const deleteComment = (commentId: number): Promise<unknown> =>
  browserRequest(`/api/comments/${commentId}`, { method: "DELETE" });
