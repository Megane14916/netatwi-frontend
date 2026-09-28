"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Send, Smile } from "lucide-react";
import EmojiPicker, {
  EmojiClickData,
  EmojiStyle,
  SkinTonePickerLocation,
  Theme,
} from "emoji-picker-react";
import ProgressRing from "@/components/ProgressRing";
import RichTextEditor, { RichTextEditorHandle } from "@/components/RichTextEditor";
import { countText } from "@/lib/twitterText";
import type { ImageRule, User } from "@/types/domain";
import { PostImageAttachments } from "./PostImageAttachments";

interface PostEditorProps {
  user: User;
  content: string;
  onContentChange: (content: string) => void;
  previewUrls: string[];
  isCompressingImages: boolean;
  onRemoveImage: (index: number) => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  imageRule?: ImageRule;
  isDeadlineExceeded: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  postError: string | null;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function PostEditor({
  user,
  content,
  onContentChange,
  previewUrls,
  isCompressingImages,
  onRemoveImage,
  onImageSelect,
  imageRule,
  isDeadlineExceeded,
  isSubmitting,
  isEditing,
  postError,
  onCancel,
  onSubmit,
}: PostEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const textCount = useMemo(() => countText(content), [content]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    editorRef.current?.insertEmoji(emojiData.emoji);
  };

  return (
    <form onSubmit={onSubmit} className="relative mt-4">
      {postError && (
        <div className="mb-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {postError}
        </div>
      )}

      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex-none w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-800">
          <img
            src={user.profileImageUrl || "https://via.placeholder.com/40"}
            alt={user.screenName}
            className="w-full h-full object-cover"
            onError={(event) =>
              (event.currentTarget.src = "https://via.placeholder.com/40")
            }
          />
        </div>
        <div className="flex-1 pt-2">
          <RichTextEditor
            ref={editorRef}
            content={content}
            onChange={onContentChange}
            placeholder={isDeadlineExceeded ? "受付時間を終了しました" : "いまどうしてる？"}
            editable={!isDeadlineExceeded && !isSubmitting}
            className={`w-full text-lg text-black dark:text-white ${isDeadlineExceeded ? "opacity-50" : ""}`}
          />
        </div>
      </div>

      <PostImageAttachments
        previewUrls={previewUrls}
        isCompressing={isCompressingImages}
        onRemove={onRemoveImage}
      />

      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 mt-4">
        <div className="flex items-center gap-1 text-[#1DA1F2]">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageSelect}
            className="hidden"
            ref={fileInputRef}
            disabled={isDeadlineExceeded || isCompressingImages || previewUrls.length >= 4}
          />

          {imageRule !== "none" && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDeadlineExceeded || isCompressingImages || previewUrls.length >= 4}
              className={`rounded-full p-2 hover:bg-blue-50 dark:hover:bg-[#1DA1F2]/10 transition-colors ${
                previewUrls.length >= 4 || isCompressingImages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isCompressingImages ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </button>
          )}

          <button
            type="button"
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isDeadlineExceeded}
            className="rounded-full p-2 hover:bg-blue-50 dark:hover:bg-[#1DA1F2]/10 transition-colors"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ProgressRing permillage={textCount.permillage} remaining={textCount.remaining} />

          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="hidden md:inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-900 md:px-5 md:py-2 md:text-sm font-bold text-black dark:text-white transition hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
            >
              キャンセル
            </button>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isCompressingImages ||
              (!textCount.isValid && content.trim().length > 0) ||
              (!content.trim() && previewUrls.length === 0) ||
              (imageRule === "required" && previewUrls.length === 0)
            }
            className="inline-flex items-center rounded-full bg-[#1DA1F2] px-4 py-1.5 text-xs md:px-5 md:py-2 md:text-sm font-bold text-white transition hover:bg-[#1788cc] disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            {isSubmitting ? "送信中..." : isEditing ? "更新する" : "投稿する"}
          </button>
        </div>
      </div>

      {showEmojiPicker && (
        <div className="absolute z-[100] mt-2 left-0 w-[calc(100vw-40px)] max-w-[350px] md:left-auto" ref={emojiPickerRef}>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={Theme.LIGHT}
            emojiStyle={EmojiStyle.TWITTER}
            skinTonePickerLocation={SkinTonePickerLocation.PREVIEW}
            lazyLoadEmojis={true}
            width="100%"
          />
        </div>
      )}
    </form>
  );
}
