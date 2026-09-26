import type { Notification } from "@/types/domain";

export type NotificationIcon = "like" | "comment" | "contest";

export interface NotificationPresentation {
  href: string | null;
  icon: NotificationIcon;
  actorName: string;
  message: string;
}

export const presentNotification = (notification: Notification): NotificationPresentation => {
  const contestName = notification.contest?.name ?? "大会";
  const messageByType = {
    like: "あなたの投稿にいいねしました。",
    comment: "あなたの投稿にコメントしました。",
    contest_start: `${contestName}が始まりました！`,
    contest_post_start: `${contestName}の投稿受付が開始されました！`,
    contest_voting_start: `${contestName}の投票が開始されました！`,
    contest_result_announce: `${contestName}の結果が発表されました！`,
  };
  return {
    href: notification.contestId ? `/venue/${notification.contestId}` : null,
    icon: notification.type === "like" ? "like" : notification.type === "comment" ? "comment" : "contest",
    actorName:
      notification.sender?.name ??
      (notification.type.startsWith("contest_")
        ? notification.contest?.type === "daily" ? "デイリー" : "グランプリ"
        : "システム"),
    message: messageByType[notification.type],
  };
};
