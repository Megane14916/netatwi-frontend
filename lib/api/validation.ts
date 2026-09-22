import type {
  CommentDto,
  CommentsByPostDto,
  ContestDto,
  ContestPostsResponseDto,
  ContestResultsResponseDto,
  ContestsResponseDto,
  CurrentUserResponseDto,
  NewsItemDto,
  NotificationDto,
  PostDto,
  ProfileResponseDto,
  UsersResponseDto,
} from "@/types/api";

export const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

export const asArray = (value: unknown, label: string): unknown[] => {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
};

const requireNumber = (record: Record<string, unknown>, key: string, label: string) => {
  if (typeof record[key] !== "number") throw new Error(`${label}.${key} must be a number`);
};

const requireString = (record: Record<string, unknown>, key: string, label: string) => {
  if (typeof record[key] !== "string") throw new Error(`${label}.${key} must be a string`);
};

export const validateCurrentUserResponse = (value: unknown): CurrentUserResponseDto => {
  const record = asRecord(value, "current user response");
  if (typeof record.logged_in !== "boolean") throw new Error("logged_in must be a boolean");
  if (record.logged_in) {
    const user = asRecord(record.user, "current user");
    requireNumber(user, "id", "current user");
    requireString(user, "screen_name", "current user");
  }
  if (record.judge_contests !== undefined) asArray(record.judge_contests, "judge_contests");
  return value as CurrentUserResponseDto;
};

export const validateContestDto = (value: unknown): ContestDto => {
  const record = asRecord(value, "contest");
  requireNumber(record, "id", "contest");
  requireString(record, "name", "contest");
  return value as ContestDto;
};

export const validateContestsResponse = (value: unknown): ContestsResponseDto => {
  const record = asRecord(value, "contests response");
  for (const status of ["ongoing", "voting", "upcoming", "closed"] as const) {
    asArray(record[status], `contests response.${status}`);
  }
  return value as unknown as ContestsResponseDto;
};

export const validateContestPostsResponse = (value: unknown): ContestPostsResponseDto => {
  const record = asRecord(value, "contest posts response");
  asArray(record.posts, "contest posts response.posts");
  if (typeof record.userHasVotedInContest !== "boolean") {
    throw new Error("userHasVotedInContest must be a boolean");
  }
  return value as unknown as ContestPostsResponseDto;
};

export const validateContestResultsResponse = (value: unknown): ContestResultsResponseDto => {
  const record = asRecord(value, "contest results response");
  asArray(record.results, "contest results response.results");
  asArray(record.judgeAwards, "contest results response.judgeAwards");
  return value as unknown as ContestResultsResponseDto;
};

export const validateProfileResponse = (value: unknown): ProfileResponseDto => {
  const record = asRecord(value, "profile response");
  asRecord(record.user, "profile response.user");
  asArray(record.posts, "profile response.posts");
  asArray(record.bookmarks, "profile response.bookmarks");
  asArray(record.likes, "profile response.likes");
  return value as unknown as ProfileResponseDto;
};

export const validateUsersResponse = (value: unknown): UsersResponseDto => {
  const record = asRecord(value, "users response");
  asArray(record.users, "users response.users");
  requireNumber(record, "page", "users response");
  requireNumber(record, "total_pages", "users response");
  return value as unknown as UsersResponseDto;
};

export const validateComments = (value: unknown): CommentDto[] =>
  asArray(value, "comments") as CommentDto[];

export const validateCommentsByPost = (value: unknown): CommentsByPostDto => {
  const record = asRecord(value, "comments by post response");
  for (const [postId, comments] of Object.entries(record)) {
    asArray(comments, `comments for post ${postId}`);
  }
  return value as CommentsByPostDto;
};

export const validateNotifications = (value: unknown): NotificationDto[] =>
  asArray(value, "notifications") as NotificationDto[];

export const validateNews = (value: unknown): NewsItemDto[] =>
  asArray(value, "news") as NewsItemDto[];

export const validatePostDto = (value: unknown): PostDto => {
  const record = asRecord(value, "post");
  requireNumber(record, "id", "post");
  requireString(record, "content", "post");
  return value as PostDto;
};

export const validateBooleanCountResponse = <BooleanKey extends string, CountKey extends string>(
  value: unknown,
  booleanKey: BooleanKey,
  countKey: CountKey,
): Record<BooleanKey, boolean> & Record<CountKey, number> => {
  const record = asRecord(value, "toggle response");
  if (typeof record[booleanKey] !== "boolean") throw new Error(`${booleanKey} must be a boolean`);
  if (typeof record[countKey] !== "number") throw new Error(`${countKey} must be a number`);
  return record as Record<BooleanKey, boolean> & Record<CountKey, number>;
};
