import {
  compressImage,
  IMAGE_COMPRESSION_THRESHOLD_BYTES,
} from "@/lib/imageCompression";

describe("compressImage", () => {
  const originalImage = Object.getOwnPropertyDescriptor(globalThis, "Image");
  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
    URL,
    "createObjectURL",
  );
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
    URL,
    "revokeObjectURL",
  );

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalImage) Object.defineProperty(globalThis, "Image", originalImage);
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, "createObjectURL", originalCreateObjectURL);
    } else {
      delete (URL as typeof URL & { createObjectURL?: unknown }).createObjectURL;
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, "revokeObjectURL", originalRevokeObjectURL);
    } else {
      delete (URL as typeof URL & { revokeObjectURL?: unknown }).revokeObjectURL;
    }
  });

  it("4 MiB以下の画像は再圧縮しない", async () => {
    const file = new File([new Uint8Array(1024)], "small.jpg", {
      type: "image/jpeg",
    });

    await expect(compressImage(file)).resolves.toBe(file);
  });

  it("GIFはアニメーション維持のため再圧縮しない", async () => {
    const file = new File(
      [new Uint8Array(IMAGE_COMPRESSION_THRESHOLD_BYTES + 1)],
      "animated.gif",
      { type: "image/gif" },
    );

    await expect(compressImage(file)).resolves.toBe(file);
  });

  it("大きなJPEGを最大辺2048pxのWebPへ圧縮する", async () => {
    const drawImage = jest.fn();
    const originalCreateElement = document.createElement.bind(document);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    jest.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);
      if (tagName === "canvas") {
        Object.defineProperty(element, "getContext", {
          value: () => ({ drawImage }),
        });
        Object.defineProperty(element, "toBlob", {
          value: (callback: BlobCallback) =>
            callback(
              new Blob([new Uint8Array(2 * 1024 * 1024)], {
                type: "image/webp",
              }),
            ),
        });
      }
      return element;
    });

    class MockImage {
      naturalWidth = 4000;
      naturalHeight = 3000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: MockImage,
    });

    const file = new File(
      [new Uint8Array(IMAGE_COMPRESSION_THRESHOLD_BYTES + 1)],
      "large.jpg",
      { type: "image/jpeg", lastModified: 123 },
    );
    const result = await compressImage(file);

    expect(result.name).toBe("large.webp");
    expect(result.type).toBe("image/webp");
    expect(result.size).toBe(2 * 1024 * 1024);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2048, 1536);
  });
});
