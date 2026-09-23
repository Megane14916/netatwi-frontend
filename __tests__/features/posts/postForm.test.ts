import {
  IMAGE_SIZE_ERROR,
  buildPostFormData,
  validatePostDraft,
} from "@/features/posts/model/postForm";

const file = (name: string, size: number) =>
  new File([new Uint8Array(size)], name, { type: "image/png" });

describe("post form model", () => {
  it("requires an image when the contest image rule is required", () => {
    expect(
      validatePostDraft({
        content: "本文",
        imageRule: "required",
        previewUrls: [],
        selectedImages: [],
        isDeadlineExceeded: false,
        isCompressingImages: false,
      }),
    ).toBe("IMAGE_REQUIRED");
  });

  it("rejects image payloads over 16 MiB", () => {
    expect(
      validatePostDraft({
        content: "本文",
        imageRule: "optional",
        previewUrls: ["blob:preview"],
        selectedImages: [file("large.png", 16 * 1024 * 1024 + 1)],
        isDeadlineExceeded: false,
        isCompressingImages: false,
      }),
    ).toBe("IMAGES_TOO_LARGE");
    expect(IMAGE_SIZE_ERROR).toContain("16 MiB");
  });

  it("builds edit FormData with retained remote images and new files", () => {
    const newImage = file("new.png", 2);
    const formData = buildPostFormData({
      content: "更新本文",
      isEditing: true,
      previewUrls: ["https://example.com/old.png", "blob:new"],
      selectedImages: [newImage],
    });

    expect(formData.get("content")).toBe("更新本文");
    expect(formData.get("kept_images")).toBe('["https://example.com/old.png"]');
    expect(formData.getAll("images")).toEqual([newImage]);
  });
});
