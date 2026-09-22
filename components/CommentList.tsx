'use client';

import React, { useState, useEffect,useRef, useMemo } from 'react';
import { Send, Edit2, Trash2, X } from 'lucide-react';
import TimeAgo from './TimeAgo';
import useSWR from 'swr';
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { mapComment } from '@/lib/mappers/api';
import type { CommentDto } from '@/types/api';
import type { Comment, User } from '@/types/domain';

interface CommentListProps {
  postId: number;
  currentUser: User | null;
  contestStatus: string;
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
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [deletedCommentIds, setDeletedCommentIds] = useState<Set<number>>(new Set());

  const fetcher = async (url: string): Promise<Comment[]> => {
    const response = await fetch(url);
    const data = (await response.json()) as CommentDto[];
    return data.map(mapComment);
  };
  
  // 投票期間中は他人のコメントは見えず、自分のコメントは initialComments (一括取得) で賄えるため、
  // コメント欄を開いたときの個別APIフェッチをスキップする
  const shouldFetch = (isAlwaysOpen || isOpen || isOpenProp) && contestStatus !== 'voting';
  
  const { data: swrComments = initialComments || [], mutate } = useSWR<Comment[]>(
    shouldFetch ? `/api/posts/${postId}/comments` : null,
    fetcher,
    { fallbackData: initialComments || [] }
  );

  // SWRデータとローカル操作分をマージして一意なリストを作成する
  const comments = useMemo(() => {
    const unique: Comment[] = [];
    const seen = new Set();
    // 後から追加されたローカル分（または編集分）が優先されるように、
    // IDが一致する場合は localComments の内容を採用する
    const localMap = new Map(localComments.map(c => [c.id, c]));
    
    // まずSWRデータを追加（ローカルにあればローカル優先、削除されていればスキップ）
    for (const c of swrComments) {
      if (deletedCommentIds.has(c.id)) continue;
      // 削除フラグを持つ特殊なオブジェクト（ここでは単純に filter で対応しますが、ローカルで消されたものは含まないようにします）
      if (!localMap.has(c.id) || localMap.get(c.id) !== null) {
        if (!seen.has(c.id)) {
           seen.add(c.id);
           unique.push(localMap.has(c.id) ? localMap.get(c.id)! : c);
        }
      }
    }
    // 次にローカルで新規追加されたものを追加
    for (const c of localComments) {
      if (deletedCommentIds.has(c.id)) continue;
      if (!seen.has(c.id)) {
        seen.add(c.id);
        unique.push(c);
      }
    }
    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [swrComments, localComments, deletedCommentIds]);

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

  const hasCommented = comments.some(c => c.userId === currentUser?.id);

  useEffect(() => {
    if ((isOpenProp || isOpen) && contestStatus === 'voting' && currentUser && !hasCommented) {
      setTimeout(() => {
        if (newTextareaRef.current) {
          newTextareaRef.current.focus();
        }
      }, 50);
    }
  }, [isOpenProp, isOpen, contestStatus, currentUser, hasCommented]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim() || (!isJudgeMode && newComment.length > 140) || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    
    // 楽観的更新
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
      mutate([...swrComments, optimisticComment], false);
    } else {
      setLocalComments(prev => [...prev, optimisticComment]);
    }

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const createdComment = await res.json();
        setNewComment('');
        if (shouldFetch) {
          mutate();
        } else {
          // APIは {'message': '...', 'id': ...} しか返さないので、optimisticComment に id だけ反映して保持する
          const newCommentData = { ...optimisticComment, id: createdComment.id || optimisticComment.id };
          setLocalComments(prev => prev.map(c => c.id === optimisticComment.id ? newCommentData : c));
        }
        onCommentAdded?.();
      } else {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました');
        if (!shouldFetch) {
          setLocalComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        }
      }
    } catch {
      setError('通信エラーが発生しました');
      if (!shouldFetch) {
        setLocalComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId);
  };

  const handleDelete = async () => {
    if (commentToDelete === null) return;
    const commentId = commentToDelete;
    setCommentToDelete(null);

    // 楽観的更新
    setDeletedCommentIds(prev => new Set(prev).add(commentId));
    
    if (shouldFetch) {
      mutate(swrComments.filter(c => c.id !== commentId), false);
    } else {
      setLocalComments(prev => prev.filter(c => c.id !== commentId));
    }
    
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        if (shouldFetch) mutate();
        onCommentDeleted?.();
      } else {
        setDeletedCommentIds(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        toast({ title: "エラー", description: "コメントの削除に失敗しました", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      setDeletedCommentIds(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      toast({ title: "エラー", description: "コメントの削除に失敗しました", variant: "destructive" });
    }
  };

  const handleEditSubmit = async (commentId: number) => {
    if (!editContent.trim() || (!isJudgeMode && editContent.length > 140)) return;
    
    if (shouldFetch) {
      mutate(swrComments.map(c => c.id === commentId ? { ...c, content: editContent } : c), false);
    } else {
      setLocalComments(prev => {
        const exists = prev.some(c => c.id === commentId);
        if (exists) {
          return prev.map(c => c.id === commentId ? { ...c, content: editContent } : c);
        } else {
          // initialComments の中にあったものを編集する場合、localComments にコピーして上書き
          const target = initialComments?.find(c => c.id === commentId);
          if (target) {
            return [...prev, { ...target, content: editContent }];
          }
          return prev;
        }
      });
    }

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        setEditingCommentId(null);
        if (shouldFetch) mutate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 投票期間中は自分のコメントのみ表示。結果発表後は全て表示。
  const visibleComments = contestStatus === 'closed' 
    ? comments 
    : comments.filter(c => c.userId === currentUser?.id);

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
        <form onSubmit={handleSubmit} className="mb-4 mt-4">
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
                  <button onClick={() => confirmDeleteComment(comment.id)} className="text-gray-400 dark:text-gray-600 hover:text-red-500">
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
                  <button onClick={() => handleEditSubmit(comment.id)} className="text-xs bg-[#1DA1F2] hover:bg-[#1788cc] text-white px-5 py-1.5 rounded-full font-bold transition-colors shadow-sm">更新</button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
