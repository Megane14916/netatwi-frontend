'use client';

import { useAuth } from '@/context/AuthContext';
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { AdminContestForm } from '@/features/admin/components/AdminContestForm';
import { AdminContestManagement } from '@/features/admin/components/AdminContestManagement';
import { AdminNewsManagement } from '@/features/admin/components/AdminNewsManagement';

export default function AdminPage() {
    const { user } = useAuth();
    const controller = useAdminDashboard();
    const { activeTab, setActiveTab } = controller;
    if (!user || !user.isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">アクセス権がありません</h1>
                <p className="text-gray-600 mt-2">このページは管理者専用です。</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 text-black bg-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6 border-b border-gray-200 pb-2">管理者ダッシュボード</h1>

            <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

            <div>
                {activeTab === 'create' && <AdminContestForm controller={controller} />}
                {activeTab === 'manage' && <AdminContestManagement controller={controller} />}

                {activeTab === 'news' && <AdminNewsManagement controller={controller} />}
            </div>

        </div>
    );
}
