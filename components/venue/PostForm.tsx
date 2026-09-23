"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
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
import { PostEditor } from "@/features/posts/components/PostEditor";

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
  // --- 締め切り ---
  const [isPostDeadlineExceeded, setIsPostDeadlineExceeded] = useState(false);

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
        <PostEditor
          user={user}
          content={newPostContent}
          onContentChange={setNewPostContent}
          previewUrls={previewUrls}
          isCompressingImages={isCompressingImages}
          onRemoveImage={removeImage}
          onImageSelect={handleImageSelect}
          imageRule={contestInfo?.imageRule}
          isDeadlineExceeded={isPostDeadlineExceeded}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
          postError={postError}
          onCancel={() => {
            setIsEditing(false);
            setNewPostContent(myPost?.content || "");
            replaceWithExistingImages(myPost?.images || []);
          }}
          onSubmit={handlePostSubmit}
        />
      )}
    </div>
  );
}
