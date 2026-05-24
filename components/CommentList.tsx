'use client';

import React, { useState, useEffect } from 'react';
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
}

export default function CommentList({ postId, currentUser, contestStatus }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

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
    if (isOpen) {
      fetchComments();
    }
  }, [postId, isOpen]);

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

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 text-sm mt-4 transition w-full justify-center bg-gray-800/30 py-2 rounded-lg"
      >
        <MessageSquare className="w-4 h-4" />
        <span>コメントを見る・書く</span>
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-800">
      <div className="flex justify-between items-center mb-4">
         <h4 className="font-semibold text-gray-200">
             コメント {contestStatus === 'closed' ? `(${comments.length})` : ''}
         </h4>
         <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-300">
           <X className="w-4 h-4" />
         </button>
      </div>

      <div className="space-y-4 mb-4">
        {visibleComments.map(comment => (
          <div key={comment.id} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <img src={comment.user.profile_image_url} alt="" className="w-6 h-6 rounded-full" />
                <span className="font-medium text-sm text-gray-200">{comment.user.name}</span>
                {comment.is_judge && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    審査員
                  </span>
                )}
                <span className="text-xs text-gray-500"><TimeAgo timestamp={comment.created_at} /></span>
              </div>
              
              {currentUser?.id === comment.user_id && (
                <div className="flex items-center space-x-2">
                  <button onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditContent(comment.content);
                  }} className="text-gray-500 hover:text-gray-300">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(comment.id)} className="text-gray-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={140}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-100 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400 border border-gray-700 px-2 py-1 rounded">キャンセル</button>
                  <button onClick={() => handleEditSubmit(comment.id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">更新</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
        ))}
        {visibleComments.length === 0 && (
            <p className="text-gray-500 text-sm italic text-center py-2">
              {contestStatus !== 'closed' ? '※ 投票期間中は、自分のコメントのみ表示されます' : 'まだコメントはありません'}
            </p>
        )}
      </div>

      {currentUser && !hasCommented && (
        <form onSubmit={handleSubmit} className="mt-2">
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <div className="flex flex-col space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力... (140文字まで)"
              maxLength={140}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-between items-center">
              <span className={`text-xs ${newComment.length >= 140 ? 'text-red-400' : 'text-gray-500'}`}>
                {newComment.length}/140
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-full text-sm font-medium transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>送信</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
