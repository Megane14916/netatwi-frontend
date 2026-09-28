import { act, renderHook, waitFor } from "@testing-library/react";
import { useUsersDirectory } from "@/features/users/hooks/useUsersDirectory";
import { getUsers } from "@/lib/api/endpoints/users";

jest.mock("@/lib/api/endpoints/users", () => ({ getUsers: jest.fn() }));

const getUsersMock = jest.mocked(getUsers);

describe("useUsersDirectory", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getUsersMock.mockImplementation(async (_query, page) => ({
      users: [],
      page,
      totalPages: 2,
      totalItems: 0,
      hasNext: page < 2,
      hasPrevious: page > 1,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const flushDebounce = async () => {
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
  };

  it("ページごとの結果をキャッシュして再取得を避ける", async () => {
    const { result } = renderHook(() => useUsersDirectory());
    await flushDebounce();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.changePage(2));
    await flushDebounce();
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.changePage(1));
    await flushDebounce();
    await waitFor(() => expect(result.current.page).toBe(1));

    expect(getUsersMock).toHaveBeenCalledTimes(2);
  });

  it("検索語変更時は1ページ目へ戻す", async () => {
    const { result } = renderHook(() => useUsersDirectory());
    await flushDebounce();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.changePage(2));
    await flushDebounce();
    act(() => result.current.changeSearch("alice"));
    expect(result.current.page).toBe(1);
  });
});
