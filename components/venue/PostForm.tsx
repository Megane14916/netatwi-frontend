"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  Smile,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import EmojiPicker, {
  EmojiClickData,
  Theme,
  EmojiStyle,
  SkinTonePickerLocation,
} from "emoji-picker-react";
import RichTextEditor, {
  RichTextEditorHandle,
} from "@/components/RichTextEditor";
import ProgressRing from "@/components/ProgressRing";
import { countText, TextCountResult } from "@/lib/twitterText";
import { useToast } from "@/components/ui/use-toast";
import type { Contest, Post } from "@/types/domain";
import { createPost, deletePost, updatePost } from "@/lib/api/endpoints/posts";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { usePostFormData } from "@/features/posts/hooks/usePostFormData";
import { usePostImages } from "@/features/posts/hooks/usePostImages";
import {
  IMAGE_SIZE_ERROR,
  buildPostFormData,
  getPostDraftErrorMessage,
  validatePostDraft,
} from "@/features/posts/model/postForm";
import { MyPostDisplay } from "@/features/posts/components/MyPostDisplay";

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface PostFormProps {
  contestId: number;
  isFinalRound?: boolean; // true のとき「決勝進出者のみ」チェックを行う
  onPostSuccess?: () => void; // 投稿成功コールバック
  providedContest?: Contest;
  providedPosts?: Post[];
  providedDataLoading?: boolean;
}

// ---------------------------------------------------------------------------
// PostForm メインコンポーネント
// ---------------------------------------------------------------------------

export default function PostForm({
  contestId,
  isFinalRound = false,
  onPostSuccess,
  providedContest,
  providedPosts,
  providedDataLoading,
}: PostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { contestInfo, myPost, setMyPost, isLoading: isLoadingInfo } = usePostFormData({
    contestId,
    userId: user?.id ?? null,
    providedContest,
    providedPosts,
    providedDataLoading,
  });

  // --- 投稿フォーム状態 ---
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // --- 画像アップロード ---
  const {
    selectedImages,
    previewUrls,
    isCompressingImages,
    addImages,
    removeImage,
    replaceWithExistingImages,
  } = usePostImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 絵文字ピッカー ---
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // --- エディタ ---
  const editorRef = useRef<RichTextEditorHandle>(null);

  // --- 締め切り ---
  const [isPostDeadlineExceeded, setIsPostDeadlineExceeded] = useState(false);

  // --- 文字数カウント ---
  const [textCount, setTextCount] = useState<TextCountResult>({
    length: 0,
    permillage: 0,
    isValid: true,
    remaining: 280,
  });

  // ---------------------------------------------------------------------------
  // 取得済みの自分の投稿をフォーム状態へ反映
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!myPost) return;
    setNewPostContent(myPost.content);
    replaceWithExistingImages(myPost.images || []);
  }, [myPost, replaceWithExistingImages]);

  // ---------------------------------------------------------------------------
  // 1秒ごとに締め切り判定を更新
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!contestInfo?.endTime) return;

    const check = () => {
      setIsPostDeadlineExceeded(new Date() > new Date(contestInfo.endTime));
    };
    check(); // 初回即時実行

    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [contestInfo?.endTime]);

  // ---------------------------------------------------------------------------
  // 文字数カウント更新
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setTextCount(countText(newPostContent));
  }, [newPostContent]);

  // ---------------------------------------------------------------------------
  // 絵文字ピッカーの外側クリック検知
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // ---------------------------------------------------------------------------
  // canPost ロジック
  // ---------------------------------------------------------------------------
  const canPost = isFinalRound
    ? contestInfo?.isAdvancedToFinal !== false
    : true;

  // ---------------------------------------------------------------------------
  // ハンドラ: 画像選択
  // ---------------------------------------------------------------------------
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = Array.from(e.target.files || []);
    input.value = "";
    const result = await addImages(files);
    if (!result.ok) {
      const message = result.error || "画像を追加できませんでした";
      setPostError(message);
      toast({
        title: message === IMAGE_SIZE_ERROR ? "画像サイズが大きすぎます" : "画像を追加できませんでした",
        description: message,
        variant: "destructive",
      });
      return;
    }
    setPostError(null);
  };

  // ---------------------------------------------------------------------------
  // ハンドラ: 編集開始
  // ---------------------------------------------------------------------------
  const handleStartEdit = () => {
    if (myPost) {
      setNewPostContent(myPost.content);
      replaceWithExistingImages(myPost.images || []);
      setIsEditing(true);
    }
  };

  // ---------------------------------------------------------------------------
  // ハンドラ: 投稿削除
  // ---------------------------------------------------------------------------
  const handleDelete = async () => {
    if (!myPost) return;
    setIsSubmitting(true);
    try {
      await deletePost(contestId, myPost.id);
      setMyPost(null);
      setNewPostContent("");
      replaceWithExistingImages([]);
      setIsEditing(false);
      setPostError(null);
      onPostSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "削除に失敗しました";
      toast({ title: "エラー", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ハンドラ: 絵文字クリック
  // ---------------------------------------------------------------------------
  const onEmojiClick = (emojiData: EmojiClickData) => {
    editorRef.current?.insertEmoji(emojiData.emoji);
  };

  // ---------------------------------------------------------------------------
  // ハンドラ: 投稿送信
  // ---------------------------------------------------------------------------
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePostDraft({
      content: newPostContent,
      imageRule: contestInfo?.imageRule,
      previewUrls,
      selectedImages,
      isDeadlineExceeded: isPostDeadlineExceeded,
      isCompressingImages,
    });
    if (validationError) {
      const message = getPostDraftErrorMessage(validationError);
      if (validationError === "IMAGES_TOO_LARGE") setPostError(message);
      toast({ title: "エラー", description: message, variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    setPostError(null);

    const formData = buildPostFormData({
      content: newPostContent,
      isEditing,
      previewUrls,
      selectedImages,
    });

    try {
      const updatedPost = isEditing && myPost
        ? await updatePost(contestId, myPost.id, formData, user.id)
        : await createPost(contestId, formData, user.id);

      setMyPost(updatedPost);
      setNewPostContent("");
      replaceWithExistingImages([]);
      setIsEditing(false);
      setPostError(null);

      onPostSuccess?.();
    } catch (error: unknown) {
      setPostError(
        error instanceof ApiError && error.status === 413
          ? IMAGE_SIZE_ERROR
          : getApiErrorMessage(error, "投稿に失敗しました"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // レンダリング
  // ---------------------------------------------------------------------------

  if (isLoadingInfo) {
    return (
      <div className="w-full rounded-2xl border border-[#d9e1e7] dark:border-gray-800 bg-white dark:bg-black p-5 shadow-[0_12px_40px_rgba(29,161,242,0.12)] mb-8 flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-[#1DA1F2]" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[#d9e1e7] dark:border-gray-800 bg-white dark:bg-black p-5 shadow-[0_12px_40px_rgba(29,161,242,0.12)] mb-8">
      {/* ── ログイン未済 ── */}
      {!user && (
        <div className="text-center py-10 text-black/50 dark:text-white/50 bg-gray-50 dark:bg-gray-950 rounded-xl">
          ログインすると投稿できます。
        </div>
      )}

      {/* ── 決勝進出資格なし ── */}
      {user && !canPost && (
        <div className="text-center py-10 text-black/50 dark:text-white/50 bg-gray-50 dark:bg-gray-950 rounded-xl">
          予選通過者のみ投稿できます。
        </div>
      )}

      {/* ── 自分の投稿表示 ── */}
      {user && canPost && myPost && (
        <MyPostDisplay
          post={myPost}
          isEditing={isEditing}
          onStartEdit={handleStartEdit}
          onDelete={handleDelete}
          isDeadlinePassed={isPostDeadlineExceeded}
          isDeleting={isSubmitting}
          user={user}
        />
      )}

      {/* ── 投稿フォーム ── */}
      {user && canPost && (!myPost || isEditing) && (
        <form onSubmit={handlePostSubmit} className="relative mt-4">
          {/* エラー表示 */}
          {postError && (
            <div className="mb-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {postError}
            </div>
          )}

          {/* アバター + エディタ */}
          <div className="mb-4 flex items-start gap-3">
            <div className="mt-0.5 flex-none w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-800">
              <img
                src={user.profileImageUrl || "https://via.placeholder.com/40"}
                alt={user.screenName}
                className="w-full h-full object-cover"
                onError={(e) =>
                  (e.currentTarget.src = "https://via.placeholder.com/40")
                }
              />
            </div>
            <div className="flex-1 pt-2">
              <RichTextEditor
                ref={editorRef}
                content={newPostContent}
                onChange={setNewPostContent}
                placeholder={
                  isPostDeadlineExceeded
                    ? "受付時間を終了しました"
                    : "いまどうしてる？"
                }
                editable={!isPostDeadlineExceeded && !isSubmitting}
                className={`w-full text-lg text-black dark:text-white ${isPostDeadlineExceeded ? "opacity-50" : ""}`}
              />
            </div>
          </div>

          {/* 画像プレビュー */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2 pl-[52px]">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt="preview"
                    className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    disabled={isCompressingImages}
                    className="absolute top-2 right-2 bg-black/70 dark:bg-white/70 text-white rounded-full p-1.5 hover:bg-black transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ツールバー */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 mt-4">
            {/* 左: 画像・絵文字ボタン */}
            <div className="flex items-center gap-1 text-[#1DA1F2]">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                ref={fileInputRef}
                disabled={
                  isPostDeadlineExceeded ||
                  isCompressingImages ||
                  previewUrls.length >= 4
                }
              />

              {contestInfo?.imageRule !== "none" && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    isPostDeadlineExceeded ||
                    isCompressingImages ||
                    previewUrls.length >= 4
                  }
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
                disabled={isPostDeadlineExceeded}
                className="rounded-full p-2 hover:bg-blue-50 dark:hover:bg-[#1DA1F2]/10 transition-colors"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>

            {/* 右: プログレスリング・キャンセル・送信ボタン */}
            <div className="flex items-center gap-3">
              <ProgressRing
                permillage={textCount.permillage}
                remaining={textCount.remaining}
              />

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewPostContent(myPost?.content || "");
                    replaceWithExistingImages(myPost?.images || []);
                  }}
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
                  (!textCount.isValid && newPostContent.trim().length > 0) ||
                  (!newPostContent.trim() && previewUrls.length === 0) ||
                  (contestInfo?.imageRule === "required" && previewUrls.length === 0)
                }
                className="inline-flex items-center rounded-full bg-[#1DA1F2] px-4 py-1.5 text-xs md:px-5 md:py-2 md:text-sm font-bold text-white transition hover:bg-[#1788cc] disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                {isSubmitting
                  ? "送信中..."
                  : isEditing
                    ? "更新する"
                    : "投稿する"}
              </button>
            </div>
          </div>

          {/* 絵文字ピッカー */}
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
      )}
    </div>
  );
}
