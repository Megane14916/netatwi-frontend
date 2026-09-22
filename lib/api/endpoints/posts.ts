import { mapPost } from "@/lib/mappers/api";
import type { Post } from "@/types/domain";
import type { PostDto } from "@/types/api";
import { browserRequest } from "../browser";
import { validateBooleanCountResponse, validatePostDto } from "../validation";

export interface BookmarkState {
  isBookmarked: boolean;
  bookmarkCount: number;
}

export interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

export const setPostBookmark = async (postId: number, enabled: boolean): Promise<BookmarkState> => {
  const response = await browserRequest<unknown>(`/api/posts/${postId}/bookmark`, {
    method: enabled ? "PUT" : "DELETE",
  });
  const validated = validateBooleanCountResponse(response, "isBookmarked", "bookmarkCount");
  return {
    isBookmarked: validated.isBookmarked,
    bookmarkCount: validated.bookmarkCount,
  };
};

export const setPostLike = async (postId: number, enabled: boolean): Promise<LikeState> => {
  const response = await browserRequest<unknown>(`/api/posts/${postId}/like`, {
    method: enabled ? "PUT" : "DELETE",
  });
  const validated = validateBooleanCountResponse(response, "isLiked", "likeCount");
  return {
    isLiked: validated.isLiked,
    likeCount: validated.likeCount,
  };
};

const savePost = async (
  contestId: number,
  formData: FormData,
  userId: number,
  postId?: number,
): Promise<Post> => {
  const path = postId
    ? `/api/contests/${contestId}/posts/${postId}`
    : `/api/contests/${contestId}/posts`;
  const dto = await browserRequest<PostDto>(path, {
    method: postId ? "PUT" : "POST",
    body: formData,
    validate: validatePostDto,
  });
  return mapPost({ ...dto, user_id: dto.user_id ?? userId });
};

export const createPost = (contestId: number, formData: FormData, userId: number) =>
  savePost(contestId, formData, userId);

export const updatePost = (contestId: number, postId: number, formData: FormData, userId: number) =>
  savePost(contestId, formData, userId, postId);

export const deletePost = (contestId: number, postId: number): Promise<void> =>
  browserRequest<void>(`/api/contests/${contestId}/posts/${postId}`, {
    method: "DELETE",
  });
