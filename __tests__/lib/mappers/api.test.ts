import {
  mapComment,
  mapContest,
  mapContestsResponse,
  mapNotification,
  mapPost,
  mapRankedUser,
  mapResultPost,
  mapUser,
} from "@/lib/mappers/api";

describe("API DTO mappers", () => {
  it("maps user fields to the camelCase domain model", () => {
    expect(
      mapUser({
        id: 1,
        name: "テストユーザー",
        screen_name: "test_user",
        profile_image_url: null,
      }),
    ).toEqual({
      id: 1,
      name: "テストユーザー",
      screenName: "test_user",
      profileImageUrl: null,
      isAdmin: false,
    });
  });

  it("uses explicit contest defaults without turning null into undefined", () => {
    const contest = mapContest({
      id: 10,
      name: "大会",
      theme: null,
      startTime: null,
      endTime: null,
      votingEndTime: null,
    });

    expect(contest).toMatchObject({
      theme: null,
      parentContestId: null,
      advancementNumerator: null,
      scoringMethod: "both",
      imageRule: "optional",
      isVotingVisible: true,
    });
  });

  it("maps the latest result snake_case identifiers", () => {
    const result = mapContestsResponse({
      ongoing: [],
      voting: [],
      upcoming: [],
      closed: [],
      latestResult: {
        contest_id: 5,
        contest_name: "最新大会",
        theme: "お題",
        totalPosters: 20,
        totalVoters: 15,
        totalJudges: 2,
      },
    });

    expect(result.latestResult?.contestId).toBe(5);
    expect(result.latestResult?.contestName).toBe("最新大会");
  });

  it.each([
    [{ comment_count: 3 }, 3],
    [{ commentCount: 4 }, 4],
    [{ comment_count: 3, commentCount: 4 }, 4],
    [{}, 0],
  ])("normalizes result post comment counts", (counts, expected) => {
    const result = mapResultPost({
      post_id: 8,
      content: "本文",
      created_at: "2026-01-01T00:00:00+09:00",
      user: {
        name: "投稿者",
        screen_name: "author",
        profile_image_url: null,
      },
      ...counts,
    });

    expect(result.commentCount).toBe(expected);
    expect(result).not.toHaveProperty("comment_count");
  });

  it("maps submission posts and preserves nullable vote data", () => {
    expect(
      mapPost({
        id: 2,
        content: "投稿",
        images: null,
        created_at: "2026-01-01T00:00:00+09:00",
        user_id: 3,
        myVotes: null,
      }),
    ).toMatchObject({
      id: 2,
      images: [],
      createdAt: "2026-01-01T00:00:00+09:00",
      userId: 3,
      myVotes: null,
    });
  });

  it("maps comments, notifications, and ranked users", () => {
    const user = {
      name: "利用者",
      screen_name: "member",
      profile_image_url: null,
    };
    const comment = mapComment({
      id: 1,
      user_id: 2,
      post_id: 3,
      content: "コメント",
      is_judge: true,
      created_at: "created",
      updated_at: "updated",
      user,
    });
    const notification = mapNotification({
      id: 4,
      type: "comment",
      is_read: false,
      post_id: 3,
      contest_id: null,
      created_at: "created",
      sender: user,
      post: { content: "投稿" },
      comment: { content: "コメント" },
      contest: null,
    });
    const rankedUser = mapRankedUser({
      id: 2,
      twitter_id: "twitter-id",
      ...user,
      stats: {
        gp_1st: 1,
        gp_2nd: 2,
        gp_3rd: 3,
        daily_1st: 4,
        daily_2nd: 5,
        daily_3rd: 6,
        judge_awards: 7,
      },
    });

    expect(comment).toMatchObject({ userId: 2, postId: 3, isJudge: true });
    expect(notification).toMatchObject({ isRead: false, postId: 3 });
    expect(rankedUser.stats).toMatchObject({ grandPrixFirst: 1, judgeAwards: 7 });
  });
});
