'use client';

import { useState, useEffect } from 'react';
// Linkコンポーネントの代わりにaタグを使用 (プレビュー環境エラー回避のため)
// import Link from 'next/link';
import { Crown, Heart, Bookmark, Share2 } from 'lucide-react';
// 相対パスでインポート
import { useAuth } from '../../context/AuthContext';

// --- 型定義 ---
export interface Contest {
  id: number;
  name: string;
  theme: string | null;
}

export interface UserInfo {
  screen_name: string;
  profile_image_url: string | null;
}

export interface Post {
  post_id: number;
  content: string;
  created_at: string;
  contest: Contest;
  user: UserInfo;
  rank: number | null;
  score: number;
  bookmarkCount: number;
  isBookmarked: boolean;
}

export interface ProfileData {
  user: {
    id: number;
    screen_name: string;
    profile_image_url: string | null;
  };
  posts: Post[];
  bookmarks: Post[];
}

interface ProfileContentProps {
  profileData: ProfileData;
}

export default function ProfileContent({ profileData: initialData }: ProfileContentProps) {
  const { user: currentUser } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData>(initialData);
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');

  useEffect(() => {
    setProfileData(initialData);
  }, [initialData]);

  // ブックマークの切り替え処理
  const handleToggleBookmark = async (post: Post) => {
    if (!currentUser) {
      alert('ブックマークするにはログインが必要です');
      return;
    }

    const prevData = profileData;

    // --- 1. 楽観的UI更新 ---
    const newIsBookmarked = !post.isBookmarked;
    const newBookmarkCount = post.bookmarkCount + (newIsBookmarked ? 1 : -1);
    
    const updatedPost = {
        ...post,
        isBookmarked: newIsBookmarked,
        bookmarkCount: newBookmarkCount
    };

    const newPosts = prevData.posts.map(p => 
        p.post_id === post.post_id ? updatedPost : p
    );

    let newBookmarks = prevData.bookmarks.map(p => 
        p.post_id === post.post_id ? updatedPost : p
    );

    const isMyProfile = currentUser && String((currentUser as any).id) === String(prevData.user.id);

    if (isMyProfile) {
        if (newIsBookmarked) {
            const exists = newBookmarks.some(p => p.post_id === post.post_id);
            if (!exists) {
                newBookmarks = [updatedPost, ...newBookmarks];
            }
        } else {
            newBookmarks = newBookmarks.filter(p => p.post_id !== post.post_id);
        }
    }

    setProfileData({
        ...prevData,
        posts: newPosts,
        bookmarks: newBookmarks
    });

    // --- 2. API通信 ---
    try {
      // 【修正】相対パスを使用 (Rewrite経由)
      const res = await fetch(`/api/posts/${post.post_id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('ブックマークの更新に失敗しました');
      
      const data = await res.json();
      
      const syncedPost = {
          ...updatedPost,
          isBookmarked: data.isBookmarked,
          bookmarkCount: data.bookmarkCount
      };

      setProfileData(current => ({
          ...current,
          posts: current.posts.map(p => p.post_id === post.post_id ? syncedPost : p),
          bookmarks: current.bookmarks.map(p => p.post_id === post.post_id ? syncedPost : p)
      }));

    } catch (err) {
      console.error(err);
      alert('エラーが発生しました。元に戻します。');
      setProfileData(prevData); 
    }
  };

  const displayPosts = activeTab === 'posts' ? profileData.posts : profileData.bookmarks;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      {/* ユーザー情報ヘッダー */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
          {/* カバー画像的なスペース */}
          <div className="h-32 bg-gray-800 rounded-lg mb-[-40px] opacity-50"></div>
          
          <div className="flex justify-between items-end px-2">
             <div className="relative">
                <img
                  src={profileData.user.profile_image_url || 'https://via.placeholder.com/96'}
                  alt={profileData.user.screen_name}
                  className="w-24 h-24 rounded-full border-4 border-gray-950 shadow-lg bg-gray-800"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/96')}
                />
             </div>
          </div>

          <div className="mt-3 px-2">
             <h1 className="text-xl font-bold text-white">{profileData.user.screen_name}</h1>
             <p className="text-gray-500 text-sm">@{profileData.user.screen_name}</p>
          </div>

          <div className="flex gap-6 mt-4 px-2 text-sm text-gray-400">
             <div className="flex gap-1">
                <span className="font-bold text-white">{profileData.posts.length}</span>
                <span>Posts</span>
             </div>
             <div className="flex gap-1">
                <span className="font-bold text-white">{profileData.bookmarks.length}</span>
                <span>Bookmarks</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* タブ切り替え */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative hover:bg-white/5 ${
              activeTab === 'posts' ? 'text-white' : 'text-gray-500'
            }`}
          >
            ポスト
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative hover:bg-white/5 ${
              activeTab === 'bookmarks' ? 'text-white' : 'text-gray-500'
            }`}
          >
            ブックマーク
            {activeTab === 'bookmarks' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* 投稿リスト */}
        <div className="">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {activeTab === 'posts' 
                ? '結果発表済みの投稿はありません' 
                : 'ブックマークした投稿はありません'}
            </div>
          ) : (
            displayPosts.map((post) => (
              <ResultPostCard 
                key={post.post_id} 
                post={post} 
                onToggleBookmark={() => handleToggleBookmark(post)}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- サブコンポーネント: X風 結果表示カード ---
function ResultPostCard({ post, onToggleBookmark, currentUser }: { 
  post: Post; 
  onToggleBookmark: () => void;
  currentUser: any;
}) {
  // 日付整形
  const dateStr = new Date(post.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  // 順位表示コンポーネント
  const getRankDisplay = (rank: number | null) => {
    if (rank === 1) return <div className="flex flex-col items-center justify-center w-8"><Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" /><span className="text-[10px] font-bold text-yellow-400 leading-none mt-0.5">1st</span></div>;
    if (rank === 2) return <div className="flex flex-col items-center justify-center w-8"><Crown className="w-5 h-5 text-gray-300 fill-gray-300" /><span className="text-[10px] font-bold text-gray-300 leading-none mt-0.5">2nd</span></div>;
    if (rank === 3) return <div className="flex flex-col items-center justify-center w-8"><Crown className="w-5 h-5 text-amber-600 fill-amber-600" /><span className="text-[10px] font-bold text-amber-600 leading-none mt-0.5">3rd</span></div>;
    if (rank) return <div className="text-sm font-bold text-gray-500 flex flex-col items-center justify-center w-8"><span>#</span><span>{rank}</span></div>;
    // 順位がない場合はスペースを空ける
    return <div className="w-8"></div>;
  };

  return (
    <div className="flex px-4 py-3 border-b border-gray-800 hover:bg-white/[0.02] transition-colors cursor-default">
      
      {/* 左端カラム: 順位 */}
      <div className="flex-none pt-1 mr-2">
        {getRankDisplay(post.rank)}
      </div>

      {/* コンテンツラッパー */}
      <div className="flex flex-1 gap-3 min-w-0">
        {/* アバター (コンテンツの左) */}
        <div className="flex-none">
            <a href={`/profile/${post.user.screen_name}`} className="hover:opacity-80 transition-opacity block">
                <img
                src={post.user.profile_image_url || 'https://via.placeholder.com/40'}
                alt={post.user.screen_name}
                className="w-10 h-10 rounded-full bg-gray-800 object-cover"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                />
            </a>
        </div>

        {/* 右カラム: コンテンツ本体 */}
        <div className="flex-1 min-w-0">
            {/* ヘッダー: ユーザー名・ID・日付・大会名 */}
            <div className="flex items-baseline justify-between text-sm mb-0.5">
                <div className="flex items-center gap-1 overflow-hidden flex-wrap">
                    <a href={`/profile/${post.user.screen_name}`} className="font-bold text-white hover:underline truncate">
                        {post.user.screen_name}
                    </a>
                    <span className="text-gray-500 truncate text-xs sm:text-sm">@{post.user.screen_name}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500 hover:underline text-xs sm:text-sm">{dateStr}</span>
                </div>
                
            </div>
            {/* 大会タグ (少し控えめに配置) */}
            <div className="mb-1">
                <a href={`/venue/${post.contest.id}`} className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-900/20 px-1.5 py-0.5 rounded-full truncate inline-block max-w-full">
                    {post.contest.name}
                </a>
            </div>

            {/* 本文 */}
            <div className="text-[15px] text-gray-100 whitespace-pre-wrap leading-relaxed mb-2">
                {post.content}
            </div>

            {/* アクションバー (右寄せ) */}
            <div className="flex items-center justify-end gap-4 sm:gap-6 text-gray-500 max-w-full">
                {/* 得票数 (Heart) */}
                <div className="flex items-center gap-1 group cursor-default" title="得票数">
                    <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
                        <Heart className={`w-4 h-4 group-hover:text-pink-500 ${post.score > 0 ? 'fill-pink-500/20 text-pink-500' : ''}`} />
                    </div>
                    <span className={`text-xs ${post.score > 0 ? 'text-pink-500' : 'group-hover:text-pink-500'}`}>
                        {post.score}
                    </span>
                </div>

                {/* ブックマーク */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark();
                    }}
                    disabled={!currentUser}
                    className="flex items-center gap-1 group focus:outline-none"
                    title={currentUser ? (post.isBookmarked ? 'ブックマークを外す' : 'ブックマーク') : 'ログインが必要です'}
                >
                    <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-blue-500 text-blue-500' : 'group-hover:text-blue-500'}`} />
                    </div>
                    <span className={`text-xs ${post.isBookmarked ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>
                        {post.bookmarkCount}
                    </span>
                </button>

                {/* シェアボタン */}
                <div className="flex items-center gap-1 group cursor-pointer">
                    <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                        <Share2 className="w-4 h-4 group-hover:text-green-500" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}