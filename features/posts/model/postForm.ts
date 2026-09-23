import { countText } from "@/lib/twitterText";
import type { ImageRule } from "@/types/domain";

export const MAX_POST_IMAGES = 4;
export const MAX_IMAGE_TOTAL_BYTES = 16 * 1024 * 1024;
export const IMAGE_SIZE_ERROR = "画像の合計サイズが上限を超えています（最大16 MiB）";

export const getTotalImageSize = (files: File[]): number =>
  files.reduce((total, file) => total + file.size, 0);

interface ValidatePostDraftInput {
  content: string;
  imageRule: ImageRule | undefined;
  previewUrls: string[];
  selectedImages: File[];
  isDeadlineExceeded: boolean;
  isCompressingImages: boolean;
}

export type PostDraftError =
  | "DEADLINE_EXCEEDED"
  | "IMAGE_COMPRESSION_PENDING"
  | "TEXT_TOO_LONG"
  | "IMAGE_REQUIRED"
  | "EMPTY_POST"
  | "IMAGES_TOO_LARGE";

export const validatePostDraft = ({
  content,
  imageRule,
  previewUrls,
  selectedImages,
  isDeadlineExceeded,
  isCompressingImages,
}: ValidatePostDraftInput): PostDraftError | null => {
  if (isDeadlineExceeded) return "DEADLINE_EXCEEDED";
  if (isCompressingImages) return "IMAGE_COMPRESSION_PENDING";
  if (!countText(content).isValid && content.trim().length > 0) return "TEXT_TOO_LONG";
  if (imageRule === "required" && previewUrls.length === 0) return "IMAGE_REQUIRED";
  if (!content.trim() && previewUrls.length === 0) return "EMPTY_POST";
  if (getTotalImageSize(selectedImages) > MAX_IMAGE_TOTAL_BYTES) return "IMAGES_TOO_LARGE";
  return null;
};

export const getPostDraftErrorMessage = (error: PostDraftError): string => {
  switch (error) {
    case "DEADLINE_EXCEEDED":
      return "投稿受付は終了しました";
    case "IMAGE_COMPRESSION_PENDING":
      return "画像の処理が完了するまでお待ちください";
    case "TEXT_TOO_LONG":
      return "文字数制限（280文字）を超えています";
    case "IMAGE_REQUIRED":
      return "画像を1枚以上添付してください";
    case "EMPTY_POST":
      return "投稿内容を入力してください";
    case "IMAGES_TOO_LARGE":
      return IMAGE_SIZE_ERROR;
  }
};

interface BuildPostFormDataInput {
  content: string;
  isEditing: boolean;
  previewUrls: string[];
  selectedImages: File[];
}

export const buildPostFormData = ({
  content,
  isEditing,
  previewUrls,
  selectedImages,
}: BuildPostFormDataInput): FormData => {
  const formData = new FormData();
  formData.append("content", content);
  if (isEditing) {
    formData.append(
      "kept_images",
      JSON.stringify(previewUrls.filter((url) => !url.startsWith("blob:"))),
    );
  }
  selectedImages.forEach((file) => formData.append("images", file));
  return formData;
};
