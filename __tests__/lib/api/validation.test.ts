import {
  validateBooleanCountResponse,
  validateContestsResponse,
  validateCurrentUserResponse,
  validateProfileResponse,
  validateUsersResponse,
} from "@/lib/api/validation";

describe("API response validation", () => {
  it("accepts the minimum contests response contract", () => {
    const response = {
      ongoing: [],
      voting: [],
      upcoming: [],
      closed: [],
    };

    expect(validateContestsResponse(response)).toBe(response);
  });

  it("rejects a contests response without a status collection", () => {
    expect(() =>
      validateContestsResponse({ ongoing: [], voting: [], upcoming: [] }),
    ).toThrow("contests response.closed must be an array");
  });

  it("validates logged-in user identity fields", () => {
    expect(() =>
      validateCurrentUserResponse({
        logged_in: true,
        user: { id: "1", screen_name: "netatwi" },
      }),
    ).toThrow("current user.id must be a number");
  });

  it("accepts a logged-out response without user data", () => {
    const response = { logged_in: false };

    expect(validateCurrentUserResponse(response)).toBe(response);
  });

  it("rejects profile collections with an invalid shape", () => {
    expect(() =>
      validateProfileResponse({ user: {}, posts: [], bookmarks: {}, likes: [] }),
    ).toThrow("profile response.bookmarks must be an array");
  });

  it("requires pagination metadata in users responses", () => {
    expect(() =>
      validateUsersResponse({ users: [], page: 1, total_pages: "2" }),
    ).toThrow("users response.total_pages must be a number");
  });

  it("returns typed toggle fields after validating both values", () => {
    const response = validateBooleanCountResponse(
      { isLiked: true, likeCount: 3 },
      "isLiked",
      "likeCount",
    );

    expect(response.isLiked).toBe(true);
    expect(response.likeCount).toBe(3);
  });
});
