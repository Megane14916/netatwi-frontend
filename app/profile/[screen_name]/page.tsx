'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TimeAgo from '@/components/TimeAgo';
import Twemoji from '@/components/Twemoji';
// Bookmark, LayoutGrid アイコンを追加
import { Heart, Trophy, ExternalLink, User as UserIcon, Bookmark, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

// --- ▼▼▼ ProfilePost 型定義を更新 ▼▼▼ ---
// 投稿者情報も含むようにする (ブックマークタブで必要)
interface ProfilePost {
    post_id: number;
    content: string;
    created_at: string;
    contest: {
        id: number;
        name: string;
        theme: string | null;
    };
    user: { // 投稿者の情報
        screen_name: string;
        profile_image_url: string | null;
    };
    rank: number | null;
    score: number | null;
}
interface ProfileUser {
    id: number;
    screen_name: string;
    profile_image_url: string | null;
}
interface ProfileData {
    user: ProfileUser;
    posts: ProfilePost[];
    bookmarks: ProfilePost[]; // ブックマーク一覧を追加
}
// --- ▲▲▲ ここまで ▲▲▲ ---

export default function UserProfilePage() {
    const params = useParams();
    const screenName = params.screen_name as string;

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // --- ▼▼▼ タブ用のStateを追加 ▼▼▼ ---
    const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');
    // --- ▲▲▲ ここまで ▲▲▲ ---

    useEffect(() => {
        if (screenName) {
            const fetchProfileData = async () => {
                try {
                    setLoading(true);
                    const decodedScreenName = decodeURIComponent(screenName);
                    const response = await fetch(`/api/profile/${decodedScreenName}`);
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'プロフィール情報の取得に失敗しました。');
                    }
                    const data: ProfileData = await response.json();
                    setProfileData(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
                } finally {
                    setLoading(false);
                }
            };
            fetchProfileData();
        } else {
            setLoading(false);
            setError("ユーザー名が指定されていません。");
        }
    }, [screenName]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-16 h-16 rounded-full bg-gray-700"></div>
                        <div className="h-6 w-40 bg-gray-700 rounded"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-24 bg-gray-800 rounded-lg"></div>
                        <div className="h-24 bg-gray-800 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
     }
    if (error) {
         return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">エラー</h1>
                <p className="text-gray-400 mt-2">{error}</p>
            </div>
         );
    }
    if (!profileData) {
         return (
            <div className="container mx-auto px-4 py-8 text-center">
                <UserIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                <h1 className="text-2xl font-bold">ユーザーが見つかりません</h1>
                <p className="text-gray-400 mt-2">指定されたユーザー名のプロフィールは存在しません。</p>
            </div>
         );
    }

    const { user: profileUser, posts: userPosts, bookmarks: bookmarkedPosts } = profileData;
    // 表示するリストをタブに応じて切り替え
    const visiblePosts = activeTab === 'posts' ? userPosts : bookmarkedPosts;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            {/* プロフィールヘッダー (変更なし) */}
            <div className="flex items-center space-x-4 mb-8 pb-4 border-b border-gray-700">
                <img
                    src={profileUser.profile_image_url || `https://via.placeholder.com/64`}
                    alt={profileUser.screen_name}
                    className="w-16 h-16 rounded-full border-2 border-gray-600"
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/64')}
                />
                <div>
                    <h1 className="text-2xl font-bold">{profileUser.screen_name}</h1>
                </div>
            </div>

            {/* --- ▼▼▼ タブ切り替えUIを追加 ▼▼▼ --- */}
            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                            activeTab === 'posts'
                                ? 'border-yellow-500 text-yellow-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
                        }`}
                    >
                         <LayoutGrid className="inline-block h-5 w-5 mr-1.5 align-text-bottom"/>
                         投稿 ({userPosts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                            activeTab === 'bookmarks'
                                ? 'border-yellow-500 text-yellow-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
                        }`}
                    >
                        <Bookmark className="inline-block h-5 w-5 mr-1.5 align-text-bottom"/>
                        ブックマーク ({bookmarkedPosts.length})
                    </button>
                </nav>
            </div>
            {/* --- ▲▲▲ ここまで ▲▲▲ --- */}


            {/* 投稿履歴タイムライン */}
            <div className="border border-gray-700 rounded-lg bg-gray-900">
                {visiblePosts.length > 0 ? (
                    visiblePosts.map((post, index) => (
                        <div
                            key={post.post_id}
                            className={`p-4 ${index < visiblePosts.length - 1 ? 'border-b border-gray-700' : ''}`}
                        >
                            {/* 大会情報 */}
                            <div className="mb-2">
                                <Link href={`/venue/${post.contest.id}`} className="text-sm text-gray-500 hover:underline flex items-center">
                                    {post.contest.name} -
                                    {post.contest.theme ? ` お題: 「${post.contest.theme}」` : " 自由にネタツイ"}
                                    <ExternalLink className="h-3 w-3 ml-1"/>
                                </Link>
                            </div>

                            <div className="flex items-start">
                                {/* --- ▼▼▼ 投稿者情報を動的に表示 ▼▼▼ --- */}
                                <img
                                    src={post.user.profile_image_url || `https://via.placeholder.com/40`}
                                    alt={post.user.screen_name}
                                    className="w-10 h-10 rounded-full flex-shrink-0 mr-4"
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                                />
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">{post.user.screen_name}</span>
                                        <TimeAgo timestamp={post.created_at} />
                                    </div>
                                    <Twemoji text={post.content} />
                                </div>
                                {/* --- ▲▲▲ ここまで ▲▲▲ --- */}
                            </div>

                            {/* --- ▼▼▼ 構文エラーを修正 ▼▼▼ --- */}
                            {(post.rank !== null || post.score !== null) && (
                                <div className="flex justify-end items-center mt-3 space-x-4">
                                    {post.rank !== null && (
                                        <div className={`flex items-center text-sm ${
                                            post.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'
                                        }`}>
                                            {post.rank === 1 && <Trophy className="h-4 w-4 mr-1 text-yellow-400" />}
                                            {post.rank === 2 && <Trophy className="h-4 w-4 mr-1 text-gray-400" />}
                                            {post.rank === 3 && <Trophy className="h-4 w-4 mr-1 text-yellow-700" />}
                                            <span className="font-semibold">{post.rank}位</span>
                                        </div>
                                    )}
                                    {post.score !== null && (
                                        <div className="flex items-center text-red-500 text-sm">
                                            <Heart className="h-4 w-4 mr-1 fill-current" />
                                            <span className="font-semibold">{post.score}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* --- ▲▲▲ ここまで ▲▲▲ --- */}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>{activeTab === 'posts' ? 'このユーザーはまだ投稿がありません。' : 'ブックマークした投稿はありません。'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

