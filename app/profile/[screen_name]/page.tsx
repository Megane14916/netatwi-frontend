import { User as UserIcon } from 'lucide-react';
import ProfileContent, { ProfileData } from '@/components/profile/ProfileContent';

// --- API_URLの設定 ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

// データを取得する非同期関数
async function getProfileData(screenName: string): Promise<ProfileData | null> {
    try {
        const decodedScreenName = decodeURIComponent(screenName);
        // next: { revalidate: 60 } で60秒間キャッシュする
        const res = await fetch(`${API_URL}/api/profile/${decodedScreenName}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            if (res.status === 404) return null; // ユーザーが見つからない場合
            throw new Error('Failed to fetch profile');
        }

        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export default async function UserProfilePage({ params }: { params: { screen_name: string } }) {
    // サーバー側でデータを取得
    const profileData = await getProfileData(params.screen_name);

    // データがない場合 (ユーザーが見つからないなど)
    if (!profileData) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <UserIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                <h1 className="text-2xl font-bold">ユーザーが見つかりません</h1>
                <p className="text-gray-400 mt-2">指定されたユーザー名のプロフィールは存在しません。</p>
            </div>
        );
    }

    // クライアントコンポーネントにデータを渡して表示
    return <ProfileContent profileData={profileData} />;
}