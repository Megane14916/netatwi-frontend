'use client';

import { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation'; // propsから取得
import { User as UserIcon,ExternalLink } from 'lucide-react';
// import Link from 'next/link'; // aタグ使用
import ResultPostCard, { ResultPostProps } from '../../../components/ResultPostCard';
import { useAuth } from '@/context/AuthContext';

const API_PREFIX = '';

interface ProfileData {
  user: {
    id: number;
    screen_name: string;
    name: string;
    profile_image_url: string | null;
  };
  posts: any[];
  bookmarks: any[];
  likes: any[]; // 追加
}

export default function UserProfilePage({ params }: { params: { screen_name: string } }) {
  const screenName = params?.screen_name as string;
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'likes'>('posts');

  useEffect(() => {
    if (!screenName) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const decodedScreenName = decodeURIComponent(screenName);
        const res = await fetch(`${API_PREFIX}/api/profile/${decodedScreenName}`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 404) {
            setProfileData(null);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error(err);
        setError('プロフィールの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [screenName]);

  const handleToggleBookmark = async (post: any) => {
      const isAdding = !post.isBookmarked;
      
      // 更新対象の投稿オブジェクトを作成
      const updatedPost = {
          ...post,
          isBookmarked: isAdding,
          bookmarkCount: post.bookmarkCount + (isAdding ? 1 : -1)
      };

      // リスト内の該当投稿を更新するヘルパー
      const updateList = (list: any[]) => list.map(p => p.post_id === post.post_id ? updatedPost : p);

      // 状態を即座に更新
      setProfileData(prev => {
          if (!prev) return null;

          let newBookmarks = [...prev.bookmarks];
          if (isAdding) {
              // 追加: リストに存在しなければ先頭に追加
              // ※ 本来はブックマークされた日時順などが理想だが、簡易的に先頭に追加
              if (!newBookmarks.some(p => p.post_id === post.post_id)) {
                  newBookmarks = [updatedPost, ...newBookmarks];
              } else {
                  newBookmarks = updateList(newBookmarks);
              }
          } else {
              // 解除: ブックマークタブで見ている場合はリストから即座に消す
              // ただし、自分のプロフィールを見ている場合のみ
              const isMyProfile = currentUser && String(currentUser.id) === String(prev.user.id);
              if (isMyProfile) {
                  newBookmarks = newBookmarks.filter(p => p.post_id !== post.post_id);
              } else {
                  // 他人のプロフィールならステータス更新のみ（リストからは消さないのが一般的）
                  newBookmarks = updateList(newBookmarks);
              }
          }

          return {
              ...prev,
              posts: updateList(prev.posts),
              likes: updateList(prev.likes),
              bookmarks: newBookmarks
          };
      });

      // API通信
      try {
          const res = await fetch(`${API_PREFIX}/api/posts/${post.post_id}/bookmark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!res.ok) throw new Error('Failed');
          
          // サーバーからの最新データで同期 (オプション)
          const data = await res.json();
          // ここで再度 setProfileData しても良いが、チラつき防止のため楽観更新を信じる
      } catch (error) {
          console.error(error);
          alert('ブックマークの更新に失敗しました');
          // エラー時はロールバックが必要だが、今回は省略
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-800 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-400 px-4">
        <UserIcon className="h-16 w-16 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-200">ユーザーが見つかりません</h1>
        <p className="mt-2 text-gray-500">指定されたユーザー名のプロフィールは存在しません。</p>
      </div>
    );
  }

  // 表示する投稿リストの切り替え
  const displayPosts = activeTab === 'posts' 
    ? profileData.posts 
    : activeTab === 'bookmarks' 
        ? profileData.bookmarks 
        : profileData.likes;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      {/* ユーザー情報ヘッダー */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
          <div className="relative">
            <img
              src={profileData.user.profile_image_url || 'https://via.placeholder.com/96'}
              alt={profileData.user.screen_name}
              className="w-24 h-24 rounded-full border-4 border-gray-800 shadow-lg object-cover"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/96')}
            />
          </div>
          {/* ユーザー名 & スクリーンネーム (縦積み) */}
          <h1 className="mt-4 text-2xl font-bold text-white text-center">{profileData.user.name}</h1>
          <p className="text-gray-500 text-sm mt-1">@{profileData.user.screen_name}</p>

          {/* Xプロフィールへのリンクボタン */}
          <a 
            href={`https://x.com/${profileData.user.screen_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center px-4 py-1.5 bg-black text-white text-xs font-bold rounded-full border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            Xのプロフィールページへ
            <ExternalLink className="w-3 h-3 ml-2" />
          </a>
          <div className="flex gap-6 mt-6 text-sm text-gray-400">
             <div className="text-center">
                <div className="font-bold text-white text-lg">{profileData.posts.length}</div>
                <div>Posts</div>
             </div>
             <div className="text-center">
                <div className="font-bold text-white text-lg">{profileData.likes.length}</div>
                <div>Likes</div>
             </div>
             <div className="text-center">
                <div className="font-bold text-white text-lg">{profileData.bookmarks.length}</div>
                <div>Bookmarks</div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-4">
        {/* タブ切り替え */}
        <div className="flex border-b border-gray-800 mb-2 sticky top-0 bg-gray-950 z-10">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative hover:bg-white/5 ${
              activeTab === 'posts' ? 'text-white' : 'text-gray-500'
            }`}
          >
            ポスト
            {activeTab === 'posts' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative hover:bg-white/5 ${
              activeTab === 'likes' ? 'text-white' : 'text-gray-500'
            }`}
          >
            いいね
            {activeTab === 'likes' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative hover:bg-white/5 ${
              activeTab === 'bookmarks' ? 'text-white' : 'text-gray-500'
            }`}
          >
            ブックマーク
            {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {/* 投稿リスト */}
        <div className="">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {activeTab === 'posts' ? '投稿はありません' : activeTab === 'likes' ? 'いいねした投稿はありません' : 'ブックマークした投稿はありません'}
            </div>
          ) : (
            displayPosts.map((post) => (
              <div key={post.post_id} className="border-b border-gray-800">
                {/* 大会リンク (カードの外に表示) */}
                {post.contest && (
                    <div className="px-4 pt-3 pb-1 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center">
                        <a href={`/venue/${post.contest.id}`} className="hover:underline">
                            {post.contest.name}
                        </a>
                        {post.contest.theme && <span className="ml-2 opacity-70">/ お題: {post.contest.theme}</span>}
                    </div>
                )}
                
                {/* 共通コンポーネントを使用 */}
                <ResultPostCard 
                    post={post} 
                    currentUser={currentUser} 
                    onToggleBookmark={handleToggleBookmark}
                    contestScoringMethod={post.contest?.scoringMethod}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}