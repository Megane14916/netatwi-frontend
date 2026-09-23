import { act, renderHook } from "@testing-library/react";
import { usePostImages } from "@/features/posts/hooks/usePostImages";
import { compressImage } from "@/lib/imageCompression";

jest.mock("@/lib/imageCompression", () => ({
  compressImage: jest.fn((file: File) => Promise.resolve(file)),
}));

describe("usePostImages", () => {
  const createObjectURL = jest.fn();
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    let sequence = 0;
    createObjectURL.mockImplementation(() => `blob:test-${sequence++}`);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  it("削除したプレビューURLを解放する", async () => {
    const { result } = renderHook(() => usePostImages());
    const file = new File(["image"], "image.png", { type: "image/png" });

    await act(() => result.current.addImages([file]));
    act(() => result.current.removeImage(0));

    expect(result.current.previewUrls).toEqual([]);
    expect(result.current.selectedImages).toEqual([]);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-0");
  });

  it("アンマウント時に残っているプレビューURLを解放する", async () => {
    const { result, unmount } = renderHook(() => usePostImages());
    const file = new File(["image"], "image.png", { type: "image/png" });

    await act(() => result.current.addImages([file]));
    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-0");
  });

  it("画像は最大4枚まで追加する", async () => {
    const { result } = renderHook(() => usePostImages());
    const files = Array.from(
      { length: 5 },
      (_, index) => new File([String(index)], `${index}.png`, { type: "image/png" }),
    );

    await act(() => result.current.addImages(files));

    expect(result.current.previewUrls).toHaveLength(4);
    expect(compressImage).toHaveBeenCalledTimes(4);
  });
});
