'use client';

import { useEffect, useRef } from 'react';
import { Send, Edit2, Trash2, X } from 'lucide-react';
import TimeAgo from './TimeAgo';
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Comment, ContestStatus, User } from '@/types/domain';
import { useCommentsController } from '@/features/posts/hooks/useCommentsController';

interface CommentListProps {
  postId: number;
  currentUser: User | null;
  contestStatus: ContestStatus;
  isAlwaysOpen?: boolean;
  isOpenProp?: boolean;
  onClose?: () => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
  initialComments?: Comment[];
  isJudgeMode?: boolean;
}

export default function CommentList({ postId, currentUser, contestStatus, isAlwaysOpen = false, isOpenProp = false, onClose, onCommentAdded, onCommentDeleted, initialComments, isJudgeMode = false }: CommentListProps) {
  const { toast } = useToast();
  const {
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
  } = useCommentsController({
    postId,
    currentUser,
    contestStatus,
    isAlwaysOpen,
    isOpenProp,
    initialComments,
    isJudgeMode,
    onCommentAdded,
    onCommentDeleted,
    onDeleteError: () =>
      toast({ title: "エラー", description: "コメントの削除に失敗しました", variant: "destructive" }),
  });

  const newTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) {
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight(newTextareaRef.current);
  }, [newComment]);

  useEffect(() => {
    adjustHeight(editTextareaRef.current);
  }, [editContent, editingCommentId]);

  useEffect(() => {
    if (!newTextareaRef.current) return;
    const observer = new ResizeObserver(() => {
      if (newTextareaRef.current && newTextareaRef.current.scrollHeight > 0 && newComment === '') {
         adjustHeight(newTextareaRef.current);
      }
    });
    observer.observe(newTextareaRef.current);
    return () => observer.disconnect();
  }, [newComment]);

  useEffect(() => {
    if ((isOpenProp || isOpen) && contestStatus === 'voting' && currentUser && !hasCommented) {
      setTimeout(() => {
        if (newTextareaRef.current) {
          newTextareaRef.current.focus();
        }
      }, 50);
    }
  }, [isOpenProp, isOpen, contestStatus, currentUser, hasCommented]);

  const showTopClose = !(currentUser && !hasCommented);

  if (!isOpen && !isAlwaysOpen && !isOpenProp) {
    return null;
  }

  return (
    <div className={`relative ${isAlwaysOpen ? '' : (showTopClose ? 'mt-4' : 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-800')}`}>
      {showTopClose && (onClose || !isAlwaysOpen) && (
        <button 
          onClick={() => onClose ? onClose() : setIsOpen(false)} 
          className="absolute -left-12 top-2 text-gray-400 dark:text-gray-600 hover:text-black p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      {currentUser && !hasCommented && (
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="mb-4 mt-4">
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex items-start gap-2">
            <img src={currentUser.profileImageUrl || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-800 flex-shrink-0" />
            <div className="flex-grow flex flex-col space-y-2 relative">
              <textarea
                ref={newTextareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isJudgeMode ? "コメントを入力..." : "コメントを入力... (140文字まで)"}
                maxLength={isJudgeMode ? undefined : 140}
                rows={1}
                className="w-full bg-transparent border-0 rounded-lg py-1.5 px-0 text-[15px] text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 resize-none overflow-hidden"
              />
              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
                <span className={`text-xs font-bold ${!isJudgeMode && newComment.length >= 140 ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'}`}>
                  {isJudgeMode ? `${newComment.length}文字` : `${newComment.length}/140`}
                </span>
                <div className="flex items-center space-x-2">
                  {(onClose || !isAlwaysOpen) && (
                    <button
                      type="button"
                      onClick={() => onClose ? onClose() : setIsOpen(false)}
                      className="text-xs text-black/60 dark:text-white/60 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-colors"
                    >
                      キャンセル
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="flex items-center space-x-1.5 bg-[#1DA1F2] hover:bg-[#1788cc] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>送信</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className={`divide-y divide-gray-100 dark:divide-gray-800 mb-4 border-b border-gray-100 dark:border-gray-800 ${showTopClose ? 'border-t' : 'border-t mt-4'}`}>
              {visibleComments.map((comment) => (
          <div key={comment.id} className="bg-transparent py-4 px-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">

                <img src={comment.user.profileImageUrl || 'https://via.placeholder.com/40'} alt="" className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-800" />
                <span className="font-bold text-sm text-black dark:text-white">{comment.user.name}</span>
                {comment.isJudge && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200 font-bold">
                    審査員
                  </span>
                )}
                <span className="text-xs text-black/50 dark:text-white/50"><TimeAgo timestamp={comment.createdAt} /></span>
              </div>
              
              {currentUser?.id === comment.userId && (
                <div className="flex items-center space-x-2">
                  <button onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditContent(comment.content);
                  }} className="text-gray-400 dark:text-gray-600 hover:text-[#1DA1F2]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setCommentToDelete(comment.id)} className="text-gray-400 dark:text-gray-600 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={isJudgeMode ? undefined : 140}
                  className="w-full bg-transparent border-0 rounded-lg p-2 text-[15px] text-black dark:text-white outline-none resize-none overflow-hidden placeholder-gray-400 focus:ring-0"
                  rows={1}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={() => setEditingCommentId(null)} className="text-xs text-black/60 dark:text-white/60 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-colors">キャンセル</button>
                  <button onClick={() => void update(comment.id)} className="text-xs bg-[#1DA1F2] hover:bg-[#1788cc] text-white px-5 py-1.5 rounded-full font-bold transition-colors shadow-sm">更新</button>
                </div>
              </div>
            ) : (
              <p className="text-black/90 dark:text-white/90 text-[15px] mt-2 whitespace-pre-wrap leading-relaxed break-words [line-break:anywhere]">{comment.content}{'\u200B'}</p>
            )}
          </div>
        ))}
        {visibleComments.length === 0 && contestStatus === 'closed' && (
            <p className="text-gray-400 dark:text-gray-600 text-sm italic text-center py-2">
              まだコメントはありません
            </p>
        )}
      </div>

      <AlertDialog open={commentToDelete !== null} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>コメントの削除</AlertDialogTitle>
            <AlertDialogDescription>本当にコメントを削除しますか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommentToDelete(null)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()} className="bg-red-600 hover:bg-red-700 text-white">削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
