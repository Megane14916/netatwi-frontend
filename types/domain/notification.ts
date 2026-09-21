import type { ContestType } from "./contest";
import type { UserSummary } from "./user";

export type NotificationType =
  | "like"
  | "comment"
  | "contest_start"
  | "contest_post_start"
  | "contest_voting_start"
  | "contest_result_announce";

export interface Notification {
  id: number;
  type: NotificationType;
  isRead: boolean;
  postId: number | null;
  contestId: number | null;
  createdAt: string;
  sender: UserSummary | null;
  post: { content: string } | null;
  comment: { content: string | null } | null;
  contest: { name: string; type: ContestType } | null;
}
