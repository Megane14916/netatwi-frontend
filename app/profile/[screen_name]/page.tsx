'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { User as UserIcon,ExternalLink, MoreHorizontal } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ResultPostCard from '../../../components/ResultPostCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
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
import type { Comment, ResultPost, UserProfile } from '@/types/domain';
import { getCommentsByPostIds } from '@/lib/api/endpoints/comments';
import { getProfile, withdrawCurrentUser } from '@/lib/api/endpoints/profile';
import { setPostBookmark } from '@/lib/api/endpoints/posts';
import { ApiError } from '@/lib/api/core';

export default function UserProfilePage({ params }: { params: { screen_name: string } }) {
  const { toast } = useToast();
  const screenName = params?.screen_name as string;
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'likes'>('posts');
  const fetchRef = useRef<string | null>(null);
  const bookmarkTargetsRef = useRef<Map<number, boolean>>(new Map());
  const bookmarkConfirmedRef = useRef<Map<number, boolean>>(new Map());
  const bookmarkConfirmedCountRef = useRef<Map<number, number>>(new Map());
  const bookmarkProcessingRef = useRef<Set<number>>(new Set());

  const [showMenu, setShowMenu] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWithdraw = async () => {
    try {
      await withdrawCurrentUser();
      toast({ title: "退会処理が完了しました" });
      window.location.href = "/";
    } catch {
      toast({ title: "エラーが発生しました", variant: "destructive" });
    }
  };

  // コメント一括取得用の状態
  const [prefetchedComments, setPrefetchedComments] = useState<Record<number, Comment[]>>({});
  const fetchingPostIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!screenName) return;
    if (fetchRef.current === screenName) return;
    fetchRef.current = screenName;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setProfileData(await getProfile(decodeURIComponent(screenName)));
      } catch (err) {
        console.error(err);
        setError(err instanceof ApiError && err.status === 404 ? '404' : 'プロフィールの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [screenName]);

  const applyBookmarkState = (postId: number, isBookmarked: boolean, serverCount?: number) => {
      setProfileData(prev => {
          if (!prev) return null;

          const updateList = (list: ResultPost[]) => list.map(item => {
              if (item.id !== postId) return item;
              const nextCount = serverCount ?? (
                  item.isBookmarked === isBookmarked
                      ? item.bookmarkCount
                      : Math.max(0, item.bookmarkCount + (isBookmarked ? 1 : -1))
              );
              return { ...item, isBookmarked, bookmarkCount: nextCount };
          });

          let newBookmarks = updateList(prev.bookmarks);
          if (isBookmarked && !newBookmarks.some(item => item.id === postId)) {
              const source = [...prev.posts, ...prev.likes].find(item => item.id === postId);
              if (source) {
                  newBookmarks = [{
                      ...source,
                      isBookmarked: true,
                      bookmarkCount: serverCount ?? source.bookmarkCount + 1,
                  }, ...newBookmarks];
              }
          } else if (!isBookmarked) {
              const isMyProfile = currentUser && String(currentUser.id) === String(prev.user.id);
              if (isMyProfile) {
                  newBookmarks = newBookmarks.filter(item => item.id !== postId);
              }
          }

          return {
              ...prev,
              posts: updateList(prev.posts),
              likes: updateList(prev.likes),
              bookmarks: newBookmarks,
          };
      });
  };

  const processBookmarkQueue = async (postId: number) => {
      if (bookmarkProcessingRef.current.has(postId)) return;
      bookmarkProcessingRef.current.add(postId);

      try {
          while (true) {
              const requestedState = bookmarkTargetsRef.current.get(postId) ?? false;
              const data = await setPostBookmark(postId, requestedState);
              bookmarkConfirmedRef.current.set(postId, data.isBookmarked);
              bookmarkConfirmedCountRef.current.set(postId, Math.max(0, data.bookmarkCount));
              applyBookmarkState(postId, data.isBookmarked, Math.max(0, data.bookmarkCount));

              if ((bookmarkTargetsRef.current.get(postId) ?? false) === requestedState) break;
          }
      } catch (error) {
          console.error(error);
          const confirmed = bookmarkConfirmedRef.current.get(postId) ?? false;
          bookmarkTargetsRef.current.set(postId, confirmed);
          applyBookmarkState(postId, confirmed, bookmarkConfirmedCountRef.current.get(postId));
          toast({ title: "エラー", description: "ブックマークの更新に失敗しました", variant: "destructive" });
      } finally {
          bookmarkProcessingRef.current.delete(postId);
      }
  };

  const handleToggleBookmark = (post: ResultPost) => {
      const current = bookmarkTargetsRef.current.get(post.id) ?? post.isBookmarked;
      const next = !current;
      bookmarkTargetsRef.current.set(post.id, next);
      if (!bookmarkConfirmedRef.current.has(post.id)) {
          bookmarkConfirmedRef.current.set(post.id, post.isBookmarked);
          bookmarkConfirmedCountRef.current.set(post.id, post.bookmarkCount);
      }

      // API完了を待たずに表示だけ更新する
      applyBookmarkState(post.id, next);
      void processBookmarkQueue(post.id);
  };

  // 表示する投稿リストの切り替え
  const displayPosts = useMemo(() => {
    if (!profileData) return [];
    if (activeTab === 'posts') return profileData.posts;
    if (activeTab === 'bookmarks') return profileData.bookmarks;
    return profileData.likes;
  }, [activeTab, profileData]);

  // 画面に表示される投稿のコメントを一括取得
  useEffect(() => {
    if (!displayPosts || displayPosts.length === 0) return;

    const allPostIds = new Set<number>();
    displayPosts.forEach((post) => {
      if (post.commentCount > 0) {
        allPostIds.add(post.id);
      }
    });

    const postIdsToFetch = Array.from(allPostIds).filter(
      (id) => !prefetchedComments[id] && !fetchingPostIdsRef.current.has(id)
    );

    if (postIdsToFetch.length > 0) {
      postIdsToFetch.forEach((id) => fetchingPostIdsRef.current.add(id));

      getCommentsByPostIds(postIdsToFetch)
        .then((comments) => {
          setPrefetchedComments((prev) => ({ ...prev, ...comments }));
        })
        .catch((err) => {
          console.error(err);
          postIdsToFetch.forEach((id) => fetchingPostIdsRef.current.delete(id));
        });
    }
  }, [displayPosts, prefetchedComments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-600 dark:text-gray-400">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    if (error === "404") {
      return notFound();
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white px-4">
        <UserIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-black dark:text-white">ユーザーが見つかりません</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">指定されたユーザー名のプロフィールは存在しません。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-20">
      {/* ユーザー情報ヘッダー */}
      <div className="w-full bg-white dark:bg-black">
        {/* 水色単色バナー (スマホ: 100px, PC: 200px) */}
        <div className="w-full h-[120px] md:h-[200px] bg-[#1DA1F2]" />
        
        <div className="max-w-[672px] mx-auto px-4 relative pb-4">
          {/* アイコンとXプロフィールボタンの行 */}
          <div className="flex justify-between items-start">
            <div className="-mt-12 md:-mt-[66px] relative">
              <img
                src={profileData.user.profileImageUrl || 'https://via.placeholder.com/133'}
                alt={profileData.user.screenName}
                className="w-24 h-24 md:w-[133px] md:h-[133px] rounded-full border-4 border-white dark:border-black shadow-sm object-cover bg-white dark:bg-black"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/133')}
              />
            </div>
            {/* Xプロフィールへのリンクボタンと三点リーダー (境界線上の右のすぐ下側) */}
            <div className="pt-3 flex items-center gap-2 relative">
              <a 
                href={`https://x.com/${profileData.user.screenName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-1.5 bg-white dark:bg-black text-black dark:text-white text-xs font-bold rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Xのプロフィールページへ
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>

              {currentUser && currentUser.id === profileData.user.id && (
                <div ref={menuRef}>
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-12 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-50 overflow-hidden">
                      <button 
                        onClick={() => {
                          setShowMenu(false);
                          setShowWithdrawDialog(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        退会する
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* ユーザー情報 */}
          <div className="mt-2">
            <h1 className="text-xl font-bold text-black dark:text-white">{profileData.user.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">@{profileData.user.screenName}</p>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-bold text-black dark:text-white">{profileData.posts.length}</span> ポスト{" "}
              <span className="font-bold text-black dark:text-white ml-3">{profileData.likes.length}</span> いいね{" "}
              <span className="font-bold text-black dark:text-white ml-3">{profileData.bookmarks.length}</span> ブックマーク
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[672px] mx-auto mt-2">
        {/* タブ切り替え */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-2 sticky top-0 bg-white dark:bg-black z-10">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative hover:bg-gray-50 dark:hover:bg-gray-900 ${
              activeTab === 'posts' ? 'text-[#1DA1F2]' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            ポスト
            {activeTab === 'posts' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#1DA1F2] rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative hover:bg-gray-50 dark:hover:bg-gray-900 ${
              activeTab === 'likes' ? 'text-[#1DA1F2]' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            いいね
            {activeTab === 'likes' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#1DA1F2] rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative hover:bg-gray-50 dark:hover:bg-gray-900 ${
              activeTab === 'bookmarks' ? 'text-[#1DA1F2]' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            ブックマーク
            {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#1DA1F2] rounded-full" />}
          </button>
        </div>

        {/* 投稿リスト */}
        <div className="">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {activeTab === 'posts' ? '投稿はありません' : activeTab === 'likes' ? 'いいねした投稿はありません' : 'ブックマークした投稿はありません'}
            </div>
          ) : (
            displayPosts.map((post) => (
              <div key={post.id} className="border-b border-gray-200 dark:border-gray-800">
                {/* 大会リンク (カードの外に表示) */}
                {post.contest && (
                    <div className="px-4 pt-3 pb-1 text-xs text-gray-500 dark:text-gray-400 hover:text-[#1DA1F2] transition-colors flex items-center">
                        <Link href={`/venue/${post.contest.id}`} prefetch={false} className="hover:underline">
                            {post.contest.name}
                        </Link>
                        {post.contest.theme && <span className="ml-2 text-gray-400 dark:text-gray-600">/ お題: {post.contest.theme}</span>}
                    </div>
                )}
                
                {/* 共通コンポーネントを使用 */}
                <ResultPostCard 
                    post={post} 
                    currentUser={currentUser} 
                    onToggleBookmark={handleToggleBookmark}
                    contestScoringMethod={post.contest?.scoringMethod}
                    initialComments={prefetchedComments[post.id]}
                />
              </div>
            ))
          )}
        </div>
      </div>
      {/* 退会確認ダイアログ */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に退会しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              退会すると、プロフィールやユーザー一覧からは非表示になりますが、過去の投稿や投票は残ります。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} className="bg-red-600 hover:bg-red-700 text-white">退会する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
