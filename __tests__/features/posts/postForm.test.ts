import {
  IMAGE_SIZE_ERROR,
  buildPostFormData,
  getPostDraftErrorMessage,
  validatePostDraft,
} from "@/features/posts/model/postForm";

const file = (name: string, size: number) =>
  new File([new Uint8Array(size)], name, { type: "image/png" });

describe("post form model", () => {
  const draft = {
    content: "本文",
    imageRule: "optional" as const,
    previewUrls: [] as string[],
    selectedImages: [] as File[],
    isDeadlineExceeded: false,
    isCompressingImages: false,
  };

  it("accepts a valid post and rejects deadline, compression, length and empty content", () => {
    expect(validatePostDraft(draft)).toBeNull();
    expect(validatePostDraft({ ...draft, isDeadlineExceeded: true })).toBe("DEADLINE_EXCEEDED");
    expect(validatePostDraft({ ...draft, isCompressingImages: true })).toBe("IMAGE_COMPRESSION_PENDING");
    expect(validatePostDraft({ ...draft, content: "a".repeat(281) })).toBe("TEXT_TOO_LONG");
    expect(validatePostDraft({ ...draft, content: " " })).toBe("EMPTY_POST");
  });

  it.each([
    ["DEADLINE_EXCEEDED", "投稿受付は終了しました"],
    ["IMAGE_COMPRESSION_PENDING", "画像の処理が完了するまでお待ちください"],
    ["TEXT_TOO_LONG", "文字数制限（280文字）を超えています"],
    ["IMAGE_REQUIRED", "画像を1枚以上添付してください"],
    ["EMPTY_POST", "投稿内容を入力してください"],
    ["IMAGES_TOO_LARGE", IMAGE_SIZE_ERROR],
  ] as const)("maps %s to a visible validation message", (code, message) => {
    expect(getPostDraftErrorMessage(code)).toBe(message);
  });

  it("creates FormData without edit-only retained image metadata", () => {
    const image = file("new.png", 2);
    const data = buildPostFormData({ content: "new", isEditing: false, previewUrls: [], selectedImages: [image] });
    expect(data.get("content")).toBe("new");
    expect(data.has("kept_images")).toBe(false);
    expect(data.getAll("images")).toEqual([image]);
  });
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
