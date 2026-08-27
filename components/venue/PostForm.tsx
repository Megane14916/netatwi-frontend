"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  Smile,
  X,
  Image as ImageIcon,
  Edit2,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import EmojiPicker, {
  EmojiClickData,
  Theme,
  EmojiStyle,
  SkinTonePickerLocation,
} from "emoji-picker-react";
import Twemoji from "@/components/Twemoji";
import TimeAgo from "@/components/TimeAgo";
import ImageGrid from "@/components/ImageGrid";
import RichTextEditor, {
  RichTextEditorHandle,
} from "@/components/RichTextEditor";
import ProgressRing from "@/components/ProgressRing";
import { countText, TextCountResult } from "@/lib/twitterText";
import { compressImage } from "@/lib/imageCompression";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MAX_IMAGE_TOTAL_BYTES = 16 * 1024 * 1024;
const IMAGE_SIZE_ERROR = "画像の合計サイズが上限を超えています（最大16 MiB）";

const getTotalImageSize = (files: File[]) =>
  files.reduce((total, file) => total + file.size, 0);

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

interface PostFormProps {
  contestId: number;
  isFinalRound?: boolean; // true のとき「決勝進出者のみ」チェックを行う
  onPostSuccess?: () => void; // 投稿成功コールバック
}

interface PostData {
  id: number;
  content: string;
  images?: string[];
  created_at: string;
  user_id?: number;
}

interface ContestInfo {
  id: number;
  imageRule: string;
  endTime: string;
  isAdvancedToFinal?: boolean | null;
  parentContestId?: number;
}

// ---------------------------------------------------------------------------
// MyPostDisplay サブコンポーネント
// ---------------------------------------------------------------------------

interface MyPostDisplayProps {
  post: PostData;
  isEditing: boolean;
  onStartEdit: () => void;
  onDelete: () => void;
  isDeadlinePassed: boolean;
  isDeleting: boolean;
  user: { screen_name: string; name: string; profile_image_url: string } | null;
}

const MyPostDisplay = ({
  post,
  isEditing,
  onStartEdit,
  onDelete,
  isDeadlinePassed,
  isDeleting,
  user,
}: MyPostDisplayProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  return (
  <div className={`mb-4 ${isEditing ? "pb-4 border-b border-gray-200 dark:border-gray-800" : ""}`}>
    <div className="flex items-start gap-3">
      <div className="flex-none">
        <img
          src={user?.profile_image_url || "https://via.placeholder.com/40"}
          alt={user?.screen_name}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover bg-white dark:bg-black"
          onError={(e) =>
            (e.currentTarget.src = "https://via.placeholder.com/40")
          }
        />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="font-bold text-black dark:text-white mr-1">
              {user?.name || user?.screen_name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">@{user?.screen_name}</span>
          </div>
          <TimeAgo timestamp={post.created_at} />
        </div>
        <div className="mt-1 text-[15px] text-black/90 dark:text-white/90 leading-relaxed whitespace-pre-wrap break-words [line-break:anywhere]">
          <Twemoji text={post.content} />
        </div>
        {post.images && (
          <div className="mt-2">
            <ImageGrid images={post.images} />
          </div>
        )}
      </div>
    </div>

    {!isEditing && !isDeadlinePassed && (
      <div className="flex justify-end gap-2 mt-3 pt-3">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors inline-flex items-center justify-center gap-1 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 fill-current" />
          )}
          {isDeleting ? "取消中..." : "取消"}
        </button>
        <button
          onClick={onStartEdit}
          className="text-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 px-3 py-1.5 rounded-full transition-colors inline-flex items-center justify-center gap-1 font-bold"
        >
          <Edit2 className="w-4 h-4 fill-current" /> 編集する
        </button>
      </div>
    )}

    {!isEditing && isDeadlinePassed && (
      <div className="text-right mt-3 pt-3 text-xs text-red-500 flex justify-end items-center font-bold">
        <Clock className="w-3.5 h-3.5 mr-1" /> 編集受付終了
      </div>
    )}

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>投稿の削除</AlertDialogTitle>
          <AlertDialogDescription>本当に投稿を削除しますか？</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setShowDeleteConfirm(false); onDelete(); }} className="bg-red-600 hover:bg-red-700 text-white">削除する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  );
};

// ---------------------------------------------------------------------------
// PostForm メインコンポーネント
// ---------------------------------------------------------------------------

export default function PostForm({
  contestId,
  isFinalRound = false,
  onPostSuccess,
}: PostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // --- コンテスト情報 ---
  const [contestInfo, setContestInfo] = useState<ContestInfo | null>(null);
  const [myPost, setMyPost] = useState<PostData | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // --- 投稿フォーム状態 ---
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // --- 画像アップロード ---
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
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
  // データ取得: コンテスト情報 & 自分の投稿
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!contestId) return;

    const fetchData = async () => {
      setIsLoadingInfo(true);
      try {
        // コンテスト情報取得
        const contestRes = await fetch(`/api/contests/${contestId}`, {
          credentials: "include",
        });
        if (contestRes.ok) {
          const contestData = await contestRes.json();
          setContestInfo({
            id: contestData.id,
            imageRule: contestData.imageRule,
            endTime: contestData.endTime,
            isAdvancedToFinal: contestData.isAdvancedToFinal,
            parentContestId: contestData.parentContestId,
          });
        }

        // 自分の既存投稿取得 (user がいる場合のみ意味がある)
        if (user) {
          const postsRes = await fetch(`/api/contests/${contestId}/posts`, {
            credentials: "include",
            cache: "no-store",
          });
          if (postsRes.ok) {
            const postsData = await postsRes.json();
            const allPosts: PostData[] = postsData.posts ?? [];
            const mine = allPosts.find((p) => p.user_id === user.id) ?? null;
            setMyPost(mine);
            if (mine) {
              setNewPostContent(mine.content);
              setPreviewUrls(mine.images || []);
            }
          }
        }
      } catch (err) {
        console.error("PostForm: データ取得エラー", err);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchData();
    // user が変わった場合も再取得
  }, [contestId, user]);

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
    const remaining = 4 - previewUrls.length;
    const toAdd = files.slice(0, remaining);
    input.value = "";

    if (toAdd.length === 0) return;

    setIsCompressingImages(true);

    try {
      // 大きな画像を同時に展開してブラウザのメモリを圧迫しないよう、順番に圧縮する。
      const compressedFiles: File[] = [];
      for (const file of toAdd) {
        compressedFiles.push(await compressImage(file));
      }

      if (getTotalImageSize([...selectedImages, ...compressedFiles]) > MAX_IMAGE_TOTAL_BYTES) {
        setPostError(IMAGE_SIZE_ERROR);
        toast({
          title: "画像サイズが大きすぎます",
          description: IMAGE_SIZE_ERROR,
          variant: "destructive",
        });
        return;
      }

      const newUrls = compressedFiles.map((file) => URL.createObjectURL(file));
      setSelectedImages((prev) => [...prev, ...compressedFiles]);
      setPreviewUrls((prev) => [...prev, ...newUrls]);
      setPostError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "画像の圧縮に失敗しました";
      setPostError(message);
      toast({
        title: "画像を追加できませんでした",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCompressingImages(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ハンドラ: 画像削除
  // ---------------------------------------------------------------------------
  const removeImage = (index: number) => {
    const targetUrl = previewUrls[index];
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));

    if (targetUrl.startsWith("blob:")) {
      const blobIndex = previewUrls
        .slice(0, index)
        .filter((u) => u.startsWith("blob:")).length;
      setSelectedImages((prev) => {
        const newArr = [...prev];
        newArr.splice(blobIndex, 1);
        return newArr;
      });
      URL.revokeObjectURL(targetUrl);
    }
  };

  // ---------------------------------------------------------------------------
  // ハンドラ: 編集開始
  // ---------------------------------------------------------------------------
  const handleStartEdit = () => {
    if (myPost) {
      setNewPostContent(myPost.content);
      setPreviewUrls(myPost.images || []);
      setSelectedImages([]);
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
      const res = await fetch(`/api/contests/${contestId}/posts/${myPost.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "削除に失敗しました");
      }
      setMyPost(null);
      setNewPostContent("");
      setPreviewUrls([]);
      setSelectedImages([]);
      setIsEditing(false);
      setPostError(null);
      onPostSuccess?.();
    } catch (err: any) {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
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
    if (isPostDeadlineExceeded || isCompressingImages) return;

    const check = countText(newPostContent);
    if (!check.isValid && newPostContent.trim().length > 0) {
      toast({ title: "エラー", description: "文字数制限（280文字）を超えています", variant: "destructive" });
      return;
    }

    if (
      contestInfo?.imageRule === "required" &&
      previewUrls.length === 0 &&
      selectedImages.length === 0
    ) {
      toast({ title: "エラー", description: "画像を1枚以上添付してください", variant: "destructive" });
      return;
    }

    if (!newPostContent.trim() && previewUrls.length === 0) return;
    if (!user) return;

    if (getTotalImageSize(selectedImages) > MAX_IMAGE_TOTAL_BYTES) {
      setPostError(IMAGE_SIZE_ERROR);
      toast({
        title: "画像サイズが大きすぎます",
        description: IMAGE_SIZE_ERROR,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setPostError(null);

    const url = isEditing
      ? `/api/contests/${contestId}/posts/${myPost?.id}`
      : `/api/contests/${contestId}/posts`;
    const method = isEditing ? "PUT" : "POST";

    const formData = new FormData();
    formData.append("content", newPostContent);

    if (isEditing) {
      const keptImages = previewUrls.filter((u) => !u.startsWith("blob:"));
      formData.append("kept_images", JSON.stringify(keptImages));
    }

    selectedImages.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        let message =
          res.status === 413
            ? IMAGE_SIZE_ERROR
            : `投稿に失敗しました（HTTP ${res.status}）`;

        if (res.headers.get("content-type")?.includes("application/json")) {
          try {
            const data = await res.json();
            message = data.error || message;
          } catch {
            // 壊れたJSONでも、ステータスに応じたメッセージを表示する。
          }
        }

        throw new Error(message);
      }

      const data: PostData = await res.json();
      const updatedPost: PostData = { ...data, user_id: user.id };

      setMyPost(updatedPost);
      setNewPostContent("");
      setSelectedImages([]);
      setPreviewUrls([]);
      setIsEditing(false);
      setPostError(null);

      onPostSuccess?.();
    } catch (err: any) {
      setPostError(err.message);
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
                src={user.profile_image_url || "https://via.placeholder.com/40"}
                alt={user.screen_name}
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
                    setPreviewUrls(myPost?.images || []);
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
