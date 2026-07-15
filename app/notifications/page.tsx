'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Trophy, Bell, Speaker } from 'lucide-react';
import TimeAgo from '@/components/TimeAgo';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  is_read: boolean;
  post_id: number | null;
  contest_id: number | null;
  created_at: string;
  sender: {
    name: string;
    screen_name: string;
    profile_image_url: string;
  } | null;
  post: {
    content: string;
  } | null;
  comment?: {
    content: string;
  } | null;
  contest: {
    name: string;
    type: string;
  } | null;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          
          if (data.some((n: Notification) => !n.is_read)) {
            await fetch('/api/notifications/read', { method: 'POST' });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  if (loading || isLoading) {
    return <div className="flex justify-center py-20 min-h-screen bg-white dark:bg-black"><div className="animate-pulse w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-20">
      <div className="max-w-[672px] mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-black dark:text-white flex items-center">
          <Bell className="w-6 h-6 mr-2 text-[#1DA1F2]" />
          通知
        </h1>
        
        <div className="border-t border-gray-200 dark:border-gray-800">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
              通知はまだありません
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 border-b border-gray-200 dark:border-gray-800 transition-colors cursor-pointer ${notification.is_read ? 'bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900' : 'bg-[#E1F5FE] hover:bg-[#B3E5FC]'}`}
                onClick={() => {
                  if (notification.contest_id) {
                    router.push(`/venue/${notification.contest_id}`);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-none pt-1">
                    {notification.type === 'like' && <Heart className="w-8 h-8 text-pink-500 fill-current" />}
                    {notification.type === 'comment' && <MessageSquare className="w-8 h-8 text-[#1DA1F2] fill-current" />}
                    {notification.type.startsWith('contest_') && (
                      <Trophy className={`w-8 h-8 ${notification.contest?.type === 'daily' ? 'text-[#1DA1F2]' : 'text-yellow-500'}`} />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.sender && (
                        <img 
                          src={notification.sender.profile_image_url} 
                          alt="" 
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-800" 
                          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/24')}
                        />
                      )}
                      <span className="font-bold text-black dark:text-white">
                        {notification.sender 
                          ? notification.sender.name 
                          : notification.type.startsWith('contest_')
                            ? (notification.contest?.type === 'daily' ? 'デイリー' : 'グランプリ')
                            : 'システム'
                        }
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400"><TimeAgo timestamp={notification.created_at} /></span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 font-medium">
                      {notification.type === 'like' && 'あなたの投稿にいいねしました。'}
                      {notification.type === 'comment' && 'あなたの投稿にコメントしました。'}
                      {notification.type === 'contest_start' && `${notification.contest?.name}が始まりました！`}
                      {notification.type === 'contest_post_start' && `${notification.contest?.name}の投稿受付が開始されました！`}
                      {notification.type === 'contest_voting_start' && `${notification.contest?.name}の投票が開始されました！`}
                      {notification.type === 'contest_result_announce' && `${notification.contest?.name}の結果が発表されました！`}
                    </p>
                    
                    {notification.type === 'comment' && notification.comment?.content && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-black p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm mt-2 whitespace-pre-wrap">
                        {notification.comment.content}
                      </div>
                    )}
                    
                    {notification.type !== 'comment' && notification.post && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800 mt-2 truncate">
                        {notification.post.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

