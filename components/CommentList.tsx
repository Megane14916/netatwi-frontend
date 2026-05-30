'use client';

import React, { useState, useEffect,useRef } from 'react';
import { Send, Edit2, Trash2, X, MessageSquare } from 'lucide-react';
import TimeAgo from './TimeAgo';

interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  is_judge: boolean;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
    screen_name: string;
    profile_image_url: string;
  };
}

interface CommentListProps {
  postId: number;
  currentUser: any;
  contestStatus: string;
  isAlwaysOpen?: boolean;
  onClose?: () => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export default function CommentList({ postId, currentUser, contestStatus, isAlwaysOpen = false, onClose, onCommentAdded, onCommentDeleted }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const newTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (newTextareaRef.current) {
      newTextareaRef.current.style.height = 'auto';
      newTextareaRef.current.style.height = `${newTextareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  useEffect(() => {
    if (editTextareaRef.current && editingCommentId !== null) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [editContent, editingCommentId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen || isAlwaysOpen) {
      fetchComments();
    }
  }, [postId, isOpen, isAlwaysOpen]);

  const hasCommented = comments.some(c => c.user_id === currentUser?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length > 140 || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
        onCommentAdded?.();
      } else {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました');
      }
    } catch (e) {
      setError('通信エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('コメントを削除しますか？')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchComments();
        onCommentDeleted?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSubmit = async (commentId: number) => {
    if (!editContent.trim() || editContent.length > 140) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        setEditingCommentId(null);
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 投票期間中は自分のコメントのみ表示。結果発表後は全て表示。
  const visibleComments = contestStatus === 'closed' 
    ? comments 
    : comments.filter(c => c.user_id === currentUser?.id);

  const showTopClose = !(currentUser && !hasCommented);

  if (!isOpen && !isAlwaysOpen) {
    return (
      <div className="flex justify-center w-full mt-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center space-x-2 text-[#1DA1F2] bg-white border border-[#1DA1F2] hover:bg-blue-50 text-sm transition py-1 px-6 rounded-full font-bold shadow-sm w-full"
        >
          <MessageSquare className="w-4 h-4" />
          <span>コメント</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`mt-4 pt-4 ${isAlwaysOpen ? 'border-t-0 pt-0 mt-0' : 'border-t border-gray-200'}`}>
      {showTopClose && onClose ? (
        <div className="flex justify-start mb-2">
           <button onClick={onClose} className="text-gray-400 hover:text-black p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
             <X className="w-5 h-5" />
           </button>
        </div>
      ) : (
        showTopClose && !isAlwaysOpen && (
          <div className="flex justify-start mb-2">
             <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
               <X className="w-5 h-5" />
             </button>
          </div>
        )
      )}

      {currentUser && !hasCommented && (
        <form onSubmit={handleSubmit} className="mb-4">
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex items-start gap-2">
            <img src={currentUser.profile_image_url || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0" />
            <div className="flex-grow flex flex-col space-y-2 relative">
              <textarea
                ref={newTextareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力... (140文字まで)"
                maxLength={140}
                rows={1}
                className="w-full bg-transparent border-0 rounded-lg py-1.5 px-0 text-[15px] text-black placeholder-gray-400 focus:outline-none focus:ring-0 resize-none overflow-hidden"
              />
              <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-1">
                <span className={`text-xs font-bold ${newComment.length >= 140 ? 'text-red-500' : 'text-gray-400'}`}>
                  {newComment.length}/140
                </span>
                <div className="flex items-center space-x-2">
                  {(onClose || !isAlwaysOpen) && (
                    <button
                      type="button"
                      onClick={() => onClose ? onClose() : setIsOpen(false)}
                      className="text-xs text-black/60 px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 font-bold transition-colors"
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

      <div className="divide-y divide-gray-100 mb-4 border-y border-gray-100 mt-4">
        {visibleComments.map(comment => (
          <div key={comment.id} className="bg-white py-4 px-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <img src={comment.user.profile_image_url || 'https://via.placeholder.com/40'} alt="" className="w-6 h-6 rounded-full border border-gray-200" />
                <span className="font-bold text-sm text-black">{comment.user.name}</span>
                {comment.is_judge && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200 font-bold">
                    審査員
                  </span>
                )}
                <span className="text-xs text-black/50"><TimeAgo timestamp={comment.created_at} /></span>
              </div>
              
              {currentUser?.id === comment.user_id && (
                <div className="flex items-center space-x-2">
                  <button onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditContent(comment.content);
                  }} className="text-gray-400 hover:text-[#1DA1F2]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(comment.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
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
                  maxLength={140}
                  className="w-full bg-white border-0 rounded-lg p-2 text-[15px] text-black outline-none resize-none overflow-hidden placeholder-gray-400 focus:ring-0"
                  rows={1}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={() => setEditingCommentId(null)} className="text-xs text-black/60 px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 font-bold transition-colors">キャンセル</button>
                  <button onClick={() => handleEditSubmit(comment.id)} className="text-xs bg-[#1DA1F2] hover:bg-[#1788cc] text-white px-5 py-1.5 rounded-full font-bold transition-colors shadow-sm">更新</button>
                </div>
              </div>
            ) : (
              <p className="text-black/90 text-[15px] mt-2 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
            )}
          </div>
        ))}
        {visibleComments.length === 0 && contestStatus === 'closed' && (
            <p className="text-gray-400 text-sm italic text-center py-2">
              まだコメントはありません
            </p>
        )}
      </div>
    </div>
  );
}
