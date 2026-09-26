"use client";

import { useState } from "react";
import { Clock, Edit2, Loader2, Trash2 } from "lucide-react";
import ImageGrid from "@/components/ImageGrid";
import TimeAgo from "@/components/TimeAgo";
import Twemoji from "@/components/Twemoji";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Post, User } from "@/types/domain";

interface MyPostDisplayProps {
  post: Post;
  isEditing: boolean;
  onStartEdit: () => void;
  onDelete: () => void;
  isDeadlinePassed: boolean;
  isDeleting: boolean;
  user: User | null;
}

export function MyPostDisplay({
  post,
  isEditing,
  onStartEdit,
  onDelete,
  isDeadlinePassed,
  isDeleting,
  user,
}: MyPostDisplayProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  return (
  <div className={`mb-4 ${isEditing ? "pb-4 border-b border-gray-200 dark:border-gray-800" : ""}`}>
    <div className="flex items-start gap-3">
      <div className="flex-none">
        <img
          src={user?.profileImageUrl || "https://via.placeholder.com/40"}
          alt={user?.screenName}
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
              {user?.name || user?.screenName}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">@{user?.screenName}</span>
          </div>
          <TimeAgo timestamp={post.createdAt} />
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
}
