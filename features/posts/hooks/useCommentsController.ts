"use client";

import { useMemo, useState } from "react";
import { createComment, deleteComment, updateComment } from "@/lib/api/endpoints/comments";
import { getApiErrorMessage } from "@/lib/api/core";
import { usePostComments } from "@/hooks/api/useComments";
import type { Comment, ContestStatus, User } from "@/types/domain";
import { getVisibleComments, mergeComments } from "../model/comments";

interface UseCommentsControllerOptions {
  postId: number;
  currentUser: User | null;
  contestStatus: ContestStatus;
  isAlwaysOpen: boolean;
  isOpenProp: boolean;
  initialComments?: Comment[];
  isJudgeMode: boolean;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
  onDeleteError: () => void;
}

export function useCommentsController({
  postId,
  currentUser,
  contestStatus,
  isAlwaysOpen,
  isOpenProp,
  initialComments,
  isJudgeMode,
  onCommentAdded,
  onCommentDeleted,
  onDeleteError,
}: UseCommentsControllerOptions) {
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [deletedCommentIds, setDeletedCommentIds] = useState<Set<number>>(new Set());

  const shouldFetch = (isAlwaysOpen || isOpen || isOpenProp) && contestStatus !== "voting";
  const { data: remoteComments = [], mutate } = usePostComments({
    postId,
    enabled: shouldFetch,
    initialComments,
  });
  const comments = useMemo(
    () => mergeComments(remoteComments, localComments, deletedCommentIds),
    [deletedCommentIds, localComments, remoteComments],
  );
  const visibleComments = useMemo(
    () => getVisibleComments(comments, contestStatus, currentUser?.id ?? null),
    [comments, contestStatus, currentUser?.id],
  );
  const hasCommented = comments.some((comment) => comment.userId === currentUser?.id);

  const submit = async () => {
    if (
      !currentUser ||
      !newComment.trim() ||
      (!isJudgeMode && newComment.length > 140) ||
      isSubmitting
    ) return;

    setIsSubmitting(true);
    setError("");
    const optimisticComment: Comment = {
      id: Date.now(),
      userId: currentUser.id,
      postId,
      content: newComment,
      isJudge: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: currentUser,
    };
    if (shouldFetch) {
      void mutate([...remoteComments, optimisticComment], false);
    } else {
      setLocalComments((current) => [...current, optimisticComment]);
    }

    try {
      const createdCommentId = await createComment(postId, newComment);
      setNewComment("");
      if (shouldFetch) {
        void mutate();
      } else {
        setLocalComments((current) =>
          current.map((comment) =>
            comment.id === optimisticComment.id
              ? { ...optimisticComment, id: createdCommentId }
              : comment,
          ),
        );
      }
      onCommentAdded?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "通信エラーが発生しました"));
      if (shouldFetch) {
        void mutate(remoteComments, false);
      } else {
        setLocalComments((current) =>
          current.filter((comment) => comment.id !== optimisticComment.id),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async () => {
    if (commentToDelete === null) return;
    const commentId = commentToDelete;
    const removedComment = comments.find((comment) => comment.id === commentId);
    setCommentToDelete(null);
    setDeletedCommentIds((current) => new Set(current).add(commentId));
    if (shouldFetch) {
      void mutate(remoteComments.filter((comment) => comment.id !== commentId), false);
    } else {
      setLocalComments((current) => current.filter((comment) => comment.id !== commentId));
    }

    try {
      await deleteComment(commentId);
      if (shouldFetch) void mutate();
      onCommentDeleted?.();
    } catch (requestError) {
      console.error(requestError);
      setDeletedCommentIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
      if (shouldFetch) {
        void mutate(remoteComments, false);
      } else if (removedComment) {
        setLocalComments((current) =>
          current.some((comment) => comment.id === commentId)
            ? current
            : [...current, removedComment],
        );
      }
      onDeleteError();
    }
  };

  const update = async (commentId: number) => {
    if (!editContent.trim() || (!isJudgeMode && editContent.length > 140)) return;
    const previousComment = comments.find((comment) => comment.id === commentId);
    if (shouldFetch) {
      void mutate(
        remoteComments.map((comment) =>
          comment.id === commentId ? { ...comment, content: editContent } : comment,
        ),
        false,
      );
    } else {
      setLocalComments((current) => {
        const target = current.find((comment) => comment.id === commentId) ?? previousComment;
        if (!target) return current;
        return [
          ...current.filter((comment) => comment.id !== commentId),
          { ...target, content: editContent },
        ];
      });
    }

    try {
      await updateComment(commentId, editContent);
      setEditingCommentId(null);
      if (shouldFetch) void mutate();
    } catch (requestError) {
      console.error(requestError);
      if (shouldFetch) {
        void mutate(remoteComments, false);
      } else if (previousComment) {
        setLocalComments((current) => [
          ...current.filter((comment) => comment.id !== commentId),
          previousComment,
        ]);
      }
    }
  };

  return {
    commentToDelete,
    setCommentToDelete,
    newComment,
    setNewComment,
    isSubmitting,
    editingCommentId,
    setEditingCommentId,
    editContent,
    setEditContent,
    isOpen,
    setIsOpen,
    error,
    visibleComments,
    hasCommented,
    submit,
    remove,
    update,
  };
}
