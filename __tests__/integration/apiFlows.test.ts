import { getAuthSession, getLoginAuthorizationUrl, logout } from "@/lib/api/endpoints/auth";
import { createPost, deletePost, setPostBookmark, setPostLike, updatePost } from "@/lib/api/endpoints/posts";
import { submitContestVotes } from "@/lib/api/endpoints/votes";
import { createComment, deleteComment, getPostComments, updateComment } from "@/lib/api/endpoints/comments";
import { createContest, updateContest } from "@/lib/api/endpoints/admin";
import { buildCreateContestPayload, buildUpdateContestPayload, createInitialContestForm } from "@/features/admin/model/contestForm";
import { installApiMock } from "@/__tests__/support/network";
import type { AdminManagedContest } from "@/types/api";

describe("browser API flows", () => {
  let api: ReturnType<typeof installApiMock>;

  beforeEach(() => { api = installApiMock(); });
  afterEach(() => { api.assertDone(); api.restore(); });

  it("loads an authenticated session, starts login and logs out with cookies", async () => {
    api.reply("GET", "/api/me", {
      logged_in: true,
      user: { id: 10, name: "User", screen_name: "user", profile_image_url: null },
      judge_contests: [5],
    });
    api.reply("GET", "/api/login/twitter", { authorization_url: "https://auth.example/authorize" });
    api.reply("GET", "/api/logout", undefined, 204);

    await expect(getAuthSession()).resolves.toMatchObject({ user: { id: 10, screenName: "user" }, judgeContests: [5] });
    await expect(getLoginAuthorizationUrl()).resolves.toBe("https://auth.example/authorize");
    await expect(logout()).resolves.toBeUndefined();
    expect(api.fetchMock.mock.calls.map(([path]) => path)).toEqual(["/api/me", "/api/login/twitter", "/api/logout"]);
    for (const [, init] of api.fetchMock.mock.calls) expect(init?.credentials).toBe("include");
  });

  it("returns a logged-out state and rejects an invalid login response", async () => {
    api.reply("GET", "/api/me", { logged_in: false });
    api.reply("GET", "/api/login/twitter", { wrong: "value" });
    await expect(getAuthSession()).resolves.toEqual({ user: null, judgeContests: [] });
    await expect(getLoginAuthorizationUrl()).rejects.toThrow("authorization_url must be a string");
  });

  it("creates, edits and deletes posts using the expected paths and form body", async () => {
    const body = new FormData();
    body.set("content", "test");
    api.reply("POST", "/api/contests/3/posts", { id: 8, content: "test" });
    api.reply("PUT", "/api/contests/3/posts/8", { id: 8, content: "edited" });
    api.reply("DELETE", "/api/contests/3/posts/8", undefined, 204);

    await expect(createPost(3, body, 10)).resolves.toMatchObject({ id: 8, userId: 10, content: "test" });
    await expect(updatePost(3, 8, body, 10)).resolves.toMatchObject({ id: 8, content: "edited" });
    await expect(deletePost(3, 8)).resolves.toBeUndefined();
    expect(api.fetchMock.mock.calls.map(([path, init]) => [path, init?.method])).toEqual([
      ["/api/contests/3/posts", "POST"],
      ["/api/contests/3/posts/8", "PUT"],
      ["/api/contests/3/posts/8", "DELETE"],
    ]);
    expect(api.fetchMock.mock.calls[0][1]?.body).toBe(body);
  });

  it("submits general and judge votes including a judge award", async () => {
    api.reply("POST", "/api/contests/3/vote", undefined, 204);
    api.reply("POST", "/api/contests/3/vote", undefined, 204);
    await submitContestVotes(3, { votes: { 8: 1 } });
    await submitContestVotes(3, { votes: { 8: 5 }, judgeAward: { postId: 8, comment: "選評" } });
    expect(api.fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))).toEqual([
      { votes: { 8: 1 } },
      { votes: { 8: 5 }, judgeAward: { postId: 8, comment: "選評" } },
    ]);
  });

  it("handles bookmark and like toggles and rejects malformed counts", async () => {
    api.reply("PUT", "/api/posts/8/bookmark", { isBookmarked: true, bookmarkCount: 2 });
    api.reply("DELETE", "/api/posts/8/bookmark", { isBookmarked: false, bookmarkCount: 1 });
    api.reply("PUT", "/api/posts/8/like", { isLiked: true, likeCount: 4 });
    api.reply("DELETE", "/api/posts/8/like", { isLiked: false, likeCount: "wrong" });
    await expect(setPostBookmark(8, true)).resolves.toEqual({ isBookmarked: true, bookmarkCount: 2 });
    await expect(setPostBookmark(8, false)).resolves.toEqual({ isBookmarked: false, bookmarkCount: 1 });
    await expect(setPostLike(8, true)).resolves.toEqual({ isLiked: true, likeCount: 4 });
    await expect(setPostLike(8, false)).rejects.toThrow("likeCount must be a number");
  });

  it("loads comments and sends create, update and delete requests", async () => {
    api.reply("GET", "/api/posts/8/comments", [{
      id: 2, user_id: 10, post_id: 8, content: "visible", is_judge: false,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      user: { name: "User", screen_name: "user", profile_image_url: null },
    }]);
    api.reply("POST", "/api/posts/8/comments", { id: 3 });
    api.reply("PUT", "/api/comments/3", { id: 3 });
    api.reply("DELETE", "/api/comments/3", undefined, 204);
    await expect(getPostComments(8)).resolves.toMatchObject([{ id: 2, postId: 8, content: "visible" }]);
    await expect(createComment(8, "new")).resolves.toBe(3);
    await updateComment(3, "edited");
    await deleteComment(3);
    expect(api.fetchMock.mock.calls.slice(1, 3).map(([, init]) => JSON.parse(String(init?.body)))).toEqual([
      { content: "new" }, { content: "edited" },
    ]);
  });

  it("sends admin create and update payloads", async () => {
    const form = {
      ...createInitialContestForm(),
      startTime: "2026-01-01T10:00:00Z",
      endTime: "2026-01-01T11:00:00Z",
      votingEndTime: "2026-01-01T12:00:00Z",
    };
    const createPayload = buildCreateContestPayload(form);
    const managed: AdminManagedContest = {
      id: 3, name: "Contest", theme: null, type: "daily",
      startTime: form.startTime, endTime: form.endTime, votingEndTime: form.votingEndTime,
      scoringMethod: "user", imageRule: "optional", generalVoteWeight: 1,
      judgeMaxScore: 10, isVotingVisible: true, advancementNumerator: null,
      advancementDenominator: null, judgeAwardAdvancement: false,
      resultCommentTop: null, resultCommentBottom: null,
    };
    const updatePayload = buildUpdateContestPayload(managed);
    api.reply("POST", "/api/admin/contests", { id: 3 });
    api.reply("PUT", "/api/admin/contests/3", {});
    await expect(createContest(createPayload)).resolves.toBe(3);
    await updateContest(3, updatePayload);
    expect(api.fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))).toEqual([createPayload, updatePayload]);
  });
});
