'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Trophy, Bell } from 'lucide-react';
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
  contest: {
    name: string;
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
    return <div className="flex justify-center py-20"><div className="animate-pulse w-8 h-8 bg-gray-700 rounded-full"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-100 flex items-center">
        <Bell className="w-6 h-6 mr-2" />
        通知
      </h1>
      
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
            通知はまだありません
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-xl border transition-colors cursor-pointer ${notification.is_read ? 'bg-gray-900 border-gray-800 hover:bg-gray-800/80' : 'bg-gray-800/80 border-blue-900/50 hover:bg-gray-800'}`}
              onClick={() => {
                if (notification.contest_id) {
                  router.push(`/venue/${notification.contest_id}`);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-none pt-1">
                  {notification.type === 'like' && <Heart className="w-8 h-8 text-pink-500 fill-current" />}
                  {notification.type === 'comment' && <MessageSquare className="w-8 h-8 text-blue-500 fill-current" />}
                  {notification.type === 'contest_start' && <Trophy className="w-8 h-8 text-yellow-500" />}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {notification.sender && (
                      <img 
                        src={notification.sender.profile_image_url} 
                        alt="" 
                        className="w-6 h-6 rounded-full" 
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/24')}
                      />
                    )}
                    <span className="font-medium text-gray-200">
                      {notification.sender ? notification.sender.name : 'システム'}
                    </span>
                    <span className="text-sm text-gray-500"><TimeAgo timestamp={notification.created_at} /></span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">
                    {notification.type === 'like' && 'あなたの投稿にいいねしました。'}
                    {notification.type === 'comment' && 'あなたの投稿にコメントしました。'}
                    {notification.type === 'contest_start' && `${notification.contest?.name}が始まりました！`}
                  </p>
                  
                  {notification.post && (
                    <div className="text-sm text-gray-400 bg-gray-950 p-3 rounded border border-gray-800">
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
  );
}
