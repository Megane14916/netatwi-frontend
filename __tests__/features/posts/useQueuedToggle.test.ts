import { act, renderHook } from "@testing-library/react";
import { useQueuedToggle } from "@/features/posts/hooks/useQueuedToggle";

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe("useQueuedToggle", () => {
  it("通信中の連打を最後に希望された状態へ集約する", async () => {
    const first = deferred<{ enabled: boolean; count: number }>();
    const second = deferred<{ enabled: boolean; count: number }>();
    const request = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() =>
      useQueuedToggle({ initialEnabled: false, initialCount: 3, request }),
    );

    act(() => {
      result.current.toggle();
      result.current.toggle();
    });
    expect(result.current).toMatchObject({ enabled: false, count: 3 });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenNthCalledWith(1, true);

    await act(async () => first.resolve({ enabled: true, count: 4 }));
    expect(request).toHaveBeenNthCalledWith(2, false);

    await act(async () => second.resolve({ enabled: false, count: 3 }));
    expect(result.current).toMatchObject({ enabled: false, count: 3 });
  });

  it("失敗時は最後に確定した状態へ戻す", async () => {
    const request = jest.fn().mockRejectedValue(new Error("failed"));
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useQueuedToggle({ initialEnabled: false, initialCount: 3, request, onError }),
    );

    await act(async () => result.current.toggle());

    expect(result.current).toMatchObject({ enabled: false, count: 3 });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
