import { getVisibleComments, mergeComments } from "@/features/posts/model/comments";
import type { Comment } from "@/types/domain";

const createComment = (id: number, userId: number, content = String(id)): Comment => ({
  id,
  userId,
  postId: 10,
  content,
  isJudge: false,
  createdAt: `2026-01-0${id}T00:00:00.000Z`,
  updatedAt: `2026-01-0${id}T00:00:00.000Z`,
  user: { name: `user-${userId}`, screenName: `user-${userId}`, profileImageUrl: "" },
});

describe("comment model", () => {
  it("ローカル編集を優先し、削除済みを除外して時系列にマージする", () => {
    const remote = [createComment(2, 2), createComment(1, 1)];
    const local = [createComment(2, 2, "edited"), createComment(3, 3)];

    expect(mergeComments(remote, local, new Set([1]))).toEqual([
      createComment(2, 2, "edited"),
      createComment(3, 3),
    ]);
  });

  it("投票中は自分のコメントだけを公開する", () => {
    const comments = [createComment(1, 1), createComment(2, 2)];
    expect(getVisibleComments(comments, "voting", 2)).toEqual([comments[1]]);
    expect(getVisibleComments(comments, "closed", 2)).toEqual(comments);
  });
});
