import { presentNotification } from "@/features/notifications/model/notificationPresentation";
import type { Notification } from "@/types/domain";

const notification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 1,
  type: "contest_post_start",
  isRead: false,
  postId: null,
  contestId: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
  sender: null,
  post: null,
  comment: null,
  contest: { name: "デイリー #1", type: "daily" },
  ...overrides,
});

describe("notification presentation", () => {
  it("大会通知のリンク、表示名、本文を導出する", () => {
    expect(presentNotification(notification())).toEqual({
      href: "/venue/5",
      icon: "contest",
      actorName: "デイリー",
      message: "デイリー #1の投稿受付が開始されました！",
    });
  });

  it("送信者がいるリアクション通知は送信者名を表示する", () => {
    expect(
      presentNotification(
        notification({
          type: "like",
          contestId: null,
          sender: { name: "Alice", screenName: "alice", profileImageUrl: null },
        }),
      ),
    ).toMatchObject({ href: null, icon: "like", actorName: "Alice" });
  });
});
