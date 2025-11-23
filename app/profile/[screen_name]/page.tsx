'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
// 相対パスに変更してインポートエラーを回避
import ProfileContent, { ProfileData } from '../../../components/profile/ProfileContent';

// API_URLの定義を削除し、相対パスを使用
const API_PREFIX = '';

export default function UserProfilePage({ params }: { params: { screen_name: string } }) {
  // useParamsフックの代わりにpropsから取得
  const screenName = params?.screen_name;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!screenName) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const decodedScreenName = decodeURIComponent(screenName);
        
        // Rewrite機能経由の相対パスでリクエスト (Cookieが自動的に送信される)
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

  // ローディング表示
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

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  // データがない場合 (ユーザーが見つからないなど)
  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-400 px-4">
        <UserIcon className="h-16 w-16 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-200">ユーザーが見つかりません</h1>
        <p className="mt-2 text-gray-500">指定されたユーザー名のプロフィールは存在しません。</p>
      </div>
    );
  }

  // データがある場合、コンテンツを表示
  return <ProfileContent profileData={profileData} />;
}