import type { UserSummary } from "./user";

export interface Comment {
  id: number;
  userId: number;
  postId: number;
  content: string;
  isJudge: boolean;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
}
