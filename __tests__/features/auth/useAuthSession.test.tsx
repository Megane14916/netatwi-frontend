import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getAuthSession } from "@/lib/api/endpoints/auth";
import { userFactory } from "@/__tests__/support/factories";

jest.mock("@/lib/api/endpoints/auth", () => ({ getAuthSession: jest.fn() }));

describe("useAuthSession", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads a session and refreshes the user and judge contest list", async () => {
    const user = userFactory();
    jest.mocked(getAuthSession)
      .mockResolvedValueOnce({ user, judgeContests: [1] })
      .mockResolvedValueOnce({ user: null, judgeContests: [] });
    const { result } = renderHook(() => useAuthSession());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current).toMatchObject({ user, judgeContests: [1], loading: false }));
    await act(async () => result.current.refetchUser());
    expect(result.current).toMatchObject({ user: null, judgeContests: [], loading: false });
  });

  it("clears stale authentication when refreshing fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      jest.mocked(getAuthSession)
        .mockResolvedValueOnce({ user: userFactory(), judgeContests: [1] })
        .mockRejectedValueOnce(new Error("offline"));
      const { result } = renderHook(() => useAuthSession());
      await waitFor(() => expect(result.current.user).not.toBeNull());
      await act(async () => result.current.refetchUser());
      expect(result.current).toMatchObject({ user: null, judgeContests: [], loading: false });
    } finally {
      consoleError.mockRestore();
    }
  });
});
