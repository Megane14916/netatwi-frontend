'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Image as ImageIconLucide, Trophy as TrophyIcon, Trash2, Edit3, Eye, EyeOff, PlusCircle, Settings,Sliders, Newspaper } from 'lucide-react';
import dayjs from 'dayjs';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { AdminCreateContestPayload, AdminManagedContest, AdminUpdateContestPayload } from '@/types/api';
import type { ContestType, ImageRule, ScoringMethod } from '@/types/domain';

// --- API_URLの設定 ---
// Next.jsのRewrite機能(/api/...)を使用するため、プレフィックスは空にします
const API_PREFIX = '';

// --- トグルスイッチコンポーネント ---
interface ToggleSwitchProps {
    label: string;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    icon?: React.ElementType;
}
const ToggleSwitch = ({ label, enabled, setEnabled, icon: Icon }: ToggleSwitchProps) => (
    <div className="flex items-center justify-between">
        <label htmlFor={`toggle-${label}`} className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
            {Icon && <Icon className="h-4 w-4 mr-2 text-gray-600" />}
            {label}
        </label>
        <button
            type="button"
            id={`toggle-${label}`}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#1DA1F2] ${enabled ? 'bg-[#1DA1F2]' : 'bg-gray-200'
                }`}
        >
            <span className="sr-only">{label}を{enabled ? '無効にする' : '有効にする'}</span>
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
);

// --- 削除確認モーダル ---
interface ConfirmDeleteModalProps {
    contestName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}
const ConfirmDeleteModal = ({ contestName, onConfirm, onCancel, isDeleting }: ConfirmDeleteModalProps) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm relative shadow-xl border border-red-700">
            <h2 className="text-lg font-semibold mb-3 text-red-400">削除確認</h2>
            <p className="text-sm text-gray-700 mb-6">本当に大会「<span className="font-bold">{contestName}</span>」を削除しますか？<br />この操作は元に戻せません。</p>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} disabled={isDeleting} className="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                    キャンセル
                </button>
                <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:bg-red-800">
                    {isDeleting ? '削除中...' : '削除する'}
                </button>
            </div>
        </div>
    </div>
);

interface NewsItem {
    id: number;
    tweet_id: string;
    created_at: string;
}

export default function AdminPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'news'>('create');
    const [newsToDelete, setNewsToDelete] = useState<number | null>(null);

    // Create Tab States
    const [createForm, setCreateForm] = useState<AdminCreateContestPayload>({
        name: '',
        type: 'grandprix',
        hasQualifier: true,
        advancementNumerator: 1,
        advancementDenominator: 3,
        qualifierJudgeAwardAdvancement: false,

        hasTheme: false,
        theme: '',
        scoringMethod: 'judge',
        imageRule: 'required',
        isVotingVisible: false,
        startTime: '',
        endTime: '',
        votingEndTime: '',
        judgePassword: '',
        generalVoteWeight: 0,
        judgeMaxScore: 20,

        qualifierHasTheme: false,
        qualifierTheme: '',
        qualifierScoringMethod: 'judge',
        qualifierImageRule: 'none',
        qualifierIsVotingVisible: false,
        qualifierStartTime: '',
        qualifierEndTime: '',
        qualifierVotingEndTime: '',
        qualifierJudgePassword: '',
        qualifierGeneralVoteWeight: 0,
        qualifierJudgeMaxScore: 20
    });
    const [createStatus, setCreateStatus] = useState('');
    const [createMessage, setCreateMessage] = useState('');

    // Manage Tab States
    const [managedContests, setManagedContests] = useState<AdminManagedContest[]>([]);
    const [manageLoading, setManageLoading] = useState(true);
    const [manageError, setManageError] = useState<string | null>(null);
    const [showPasswordId, setShowPasswordId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<AdminManagedContest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingContest, setEditingContest] = useState<AdminManagedContest | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // News Tab States
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsError, setNewsError] = useState<string | null>(null);
    const [newNewsUrl, setNewNewsUrl] = useState('');
    const [isAddingNews, setIsAddingNews] = useState(false);

    useEffect(() => {
        if (activeTab === 'manage') {
            const fetchManagedContests = async () => {
                setManageLoading(true);
                setManageError(null);
                try {
                    // 相対パスを使用
                    const response = await fetch(`${API_PREFIX}/api/admin/contests/management`, { credentials: 'include' });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || '大会リストの取得に失敗しました。');
                    }
                    const data = await response.json();
                    setManagedContests(data);
                } catch (error) {
                    setManageError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
                } finally {
                    setManageLoading(false);
                }
            };
            fetchManagedContests();
        } else if (activeTab === 'news') {
            const fetchNews = async () => {
                setNewsLoading(true);
                setNewsError(null);
                try {
                    const response = await fetch(`${API_PREFIX}/api/admin/news`, { credentials: 'include' });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'ニュースの取得に失敗しました。');
                    }
                    const data = await response.json();
                    setNewsList(data);
                } catch (error) {
                    setNewsError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
                } finally {
                    setNewsLoading(false);
                }
            };
            fetchNews();
        }
    }, [activeTab]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateStatus('loading');
        setCreateMessage('作成中...');
        const payload: AdminCreateContestPayload = { ...createForm };
        payload.startTime = new Date(createForm.startTime).toISOString();
        payload.endTime = new Date(createForm.endTime).toISOString();
        payload.votingEndTime = new Date(createForm.votingEndTime).toISOString();
        if (createForm.hasQualifier) {
            if (createForm.qualifierStartTime) payload.qualifierStartTime = new Date(createForm.qualifierStartTime).toISOString();
            if (createForm.qualifierEndTime) payload.qualifierEndTime = new Date(createForm.qualifierEndTime).toISOString();
            if (createForm.qualifierVotingEndTime) payload.qualifierVotingEndTime = new Date(createForm.qualifierVotingEndTime).toISOString();
        }

        try {
            // 相対パスを使用
            const response = await fetch(`${API_PREFIX}/api/admin/contests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setCreateStatus('success');
                setCreateMessage(`大会「${createForm.name}」が作成されました！ (ID: ${data.id})`);
                setCreateForm(prev => ({
                    ...prev,
                    name: '',
                    theme: '',
                    startTime: '', endTime: '', votingEndTime: '', judgePassword: '',
                    qualifierTheme: '', qualifierStartTime: '', qualifierEndTime: '', qualifierVotingEndTime: '', qualifierJudgePassword: ''
                }));
            } else { throw new Error(data.error || '不明なエラーが発生しました。'); }
        } catch (error) {
            setCreateStatus('error');
            setCreateMessage(error instanceof Error ? error.message : '大会の作成に失敗しました。');
        } finally {
            if (createStatus !== 'loading') { setTimeout(() => { setCreateStatus(''); setCreateMessage(''); }, 5000); }
        }
    };

    const handleCreateFormChange = <K extends keyof AdminCreateContestPayload,>(field: K, value: AdminCreateContestPayload[K]) => {
        setCreateForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'type') {
                if (value === 'grandprix') {
                    next.hasQualifier = true;
                    next.advancementNumerator = 1;
                    next.advancementDenominator = 3;
                    next.qualifierJudgeAwardAdvancement = false;
                    next.scoringMethod = 'judge';
                    next.judgeMaxScore = 20;
                    next.generalVoteWeight = 0;
                    next.hasTheme = false;
                    next.isVotingVisible = false;
                    next.imageRule = 'required';
                    
                    next.qualifierScoringMethod = 'judge';
                    next.qualifierJudgeMaxScore = 20;
                    next.qualifierGeneralVoteWeight = 0;
                    next.qualifierHasTheme = false;
                    next.qualifierIsVotingVisible = false;
                    next.qualifierImageRule = 'none';
                } else if (value === 'daily') {
                    next.hasQualifier = false;
                    next.scoringMethod = 'user';
                    next.hasTheme = false;
                    next.imageRule = 'optional';
                    next.isVotingVisible = true;
                }
            } else if (field === 'scoringMethod' && value === 'judge') {
                next.generalVoteWeight = 0;
            } else if (field === 'qualifierScoringMethod' && value === 'judge') {
                next.qualifierGeneralVoteWeight = 0;
            }
            return next;
        });
    };

    const handleDeleteContest = async () => {
        if (!showDeleteModal) return;
        setIsDeleting(true);
        try {
            // 相対パスを使用
            const response = await fetch(`${API_PREFIX}/api/admin/contests/${showDeleteModal.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '削除に失敗しました。');
            }
            setManagedContests(prev => prev.filter(c => c.id !== showDeleteModal.id));
            setShowDeleteModal(null);
        } catch (error) {
            toast({ title: "エラー", description: `削除エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContest) return;
        setIsUpdating(true);
        try {
            const { id: _id, ...contestFields } = editingContest;
            const payload: AdminUpdateContestPayload = {
                ...contestFields,
                startTime: new Date(editingContest.startTime).toISOString(),
                endTime: new Date(editingContest.endTime).toISOString(),
                votingEndTime: new Date(editingContest.votingEndTime).toISOString(),
            };

            const response = await fetch(`${API_PREFIX}/api/admin/contests/${editingContest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '更新に失敗しました。');
            }
            setManagedContests(prev => prev.map(c => c.id === editingContest.id ? { ...c, ...editingContest } : c));
            setEditingContest(null);
        } catch (error) {
            toast({ title: "エラー", description: `更新エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingNews(true);
        try {
            const response = await fetch(`${API_PREFIX}/api/admin/news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweet_id: newNewsUrl }),
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '追加に失敗しました。');
            setNewNewsUrl('');
            const res = await fetch(`${API_PREFIX}/api/admin/news`, { credentials: 'include' });
            if (res.ok) {
                const newData = await res.json();
                setNewsList(newData);
            }
        } catch (error) {
            toast({ title: "エラー", description: `追加エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
        } finally {
            setIsAddingNews(false);
        }
    };

    const handleDeleteNews = (id: number) => {
        setNewsToDelete(id);
    };

    const confirmDeleteNews = async () => {
        if (newsToDelete === null) return;
        const id = newsToDelete;
        setNewsToDelete(null);
        try {
            const response = await fetch(`${API_PREFIX}/api/admin/news/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '削除に失敗しました。');
            }
            setNewsList(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            toast({ title: "エラー", description: `削除エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
        }
    };

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

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('create')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'create' ? 'border-[#1DA1F2] text-[#1DA1F2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-500'}`} > <PlusCircle className="inline-block h-5 w-5 mr-1.5 align-text-bottom" /> 新規作成 </button>
                    <button onClick={() => setActiveTab('manage')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'manage' ? 'border-[#1DA1F2] text-[#1DA1F2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-500'}`} > <Settings className="inline-block h-5 w-5 mr-1.5 align-text-bottom" /> 大会管理 </button>
                    <button onClick={() => setActiveTab('news')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'news' ? 'border-[#1DA1F2] text-[#1DA1F2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-500'}`} > <Newspaper className="inline-block h-5 w-5 mr-1.5 align-text-bottom" /> ニュース管理 </button>
                </nav>
            </div>

            <AlertDialog open={newsToDelete !== null} onOpenChange={(open) => !open && setNewsToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ニュース削除</AlertDialogTitle>
                        <AlertDialogDescription>本当に削除しますか？この操作は取り消せません。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNewsToDelete(null)}>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteNews} className="bg-red-600 hover:bg-red-700 text-white">削除する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div>
                {activeTab === 'create' && (
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6">新しい大会を作成</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-6">
                            <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">大会名</label> <input type="text" id="name" value={createForm.name} onChange={(e) => handleCreateFormChange('name', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-dashed border-gray-300 rounded-md bg-white/30">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">コンテストタイプ</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="type" value="grandprix" checked={createForm.type === 'grandprix'} onChange={(e) => handleCreateFormChange('type', e.target.value as ContestType)} className="mr-2" />グランプリ</label>
                                        <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="type" value="daily" checked={createForm.type === 'daily'} onChange={(e) => handleCreateFormChange('type', e.target.value as ContestType)} className="mr-2" />デイリー</label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 space-y-4">
                                <ToggleSwitch label="予選・決勝形式にする" enabled={createForm.hasQualifier} setEnabled={(val) => handleCreateFormChange('hasQualifier', val)} icon={TrophyIcon} />
                            </div>

                            {createForm.hasQualifier ? (
                                <div className="space-y-8">
                                    <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                                        <h3 className="text-xl font-bold text-[#1DA1F2] mb-4">予選の設定</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">予選通過割合</label>
                                            <div className="flex items-center space-x-2">
                                                <input type="number" min="1" value={createForm.advancementNumerator} onChange={(e) => handleCreateFormChange('advancementNumerator', parseInt(e.target.value) || 1)} className="w-20 bg-white border border-gray-200 rounded-md py-2 px-4 text-center focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" placeholder="1" />
                                                <span className="text-xl text-gray-600">/</span>
                                                <input type="number" min="1" value={createForm.advancementDenominator} onChange={(e) => handleCreateFormChange('advancementDenominator', parseInt(e.target.value) || 1)} className="w-20 bg-white border border-gray-200 rounded-md py-2 px-4 text-center focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" placeholder="3" />
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200">
                                            <ToggleSwitch label="審査員賞受賞者を無条件で決勝進出とする" enabled={createForm.qualifierJudgeAwardAdvancement} setEnabled={(val) => handleCreateFormChange('qualifierJudgeAwardAdvancement', val)} icon={TrophyIcon} />
                                        </div>
                                        <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                                                <div className="flex space-x-4">
                                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.qualifierScoringMethod === 'both'} onChange={(e) => handleCreateFormChange('qualifierScoringMethod', e.target.value as ScoringMethod)} value="both" className="mr-2" />審査+ユーザー</label>
                                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.qualifierScoringMethod === 'user'} onChange={(e) => handleCreateFormChange('qualifierScoringMethod', e.target.value as ScoringMethod)} value="user" className="mr-2" />ユーザーのみ</label>
                                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.qualifierScoringMethod === 'judge'} onChange={(e) => handleCreateFormChange('qualifierScoringMethod', e.target.value as ScoringMethod)} value="judge" className="mr-2" />審査のみ</label>
                                                </div>
                                            </div>

                                            {createForm.qualifierScoringMethod !== 'user' && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2"/> スコア計算設定</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className={`block text-sm font-medium mb-1 ${createForm.qualifierScoringMethod === 'judge' ? 'text-gray-500' : 'text-gray-700'}`}>一般票の重み係数</label>
                                                            <input type="number" disabled={createForm.qualifierScoringMethod === 'judge'} value={createForm.qualifierGeneralVoteWeight} onChange={(e) => handleCreateFormChange('qualifierGeneralVoteWeight', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 disabled:opacity-50"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">審査員評価の満点</label>
                                                            <input type="number" min="1" max="100" value={createForm.qualifierJudgeMaxScore} onChange={(e) => handleCreateFormChange('qualifierJudgeMaxScore', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50"> 
                                            <h4 className="text-lg font-semibold text-gray-600 mb-3">期間設定</h4> 
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                                                <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <div className="relative"> <input type="datetime-local" value={createForm.qualifierStartTime} onChange={(e) => handleCreateFormChange('qualifierStartTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                                <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <div className="relative"> <input type="datetime-local" value={createForm.qualifierEndTime} onChange={(e) => handleCreateFormChange('qualifierEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                            </div> 
                                            <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <div className="relative"> <input type="datetime-local" value={createForm.qualifierVotingEndTime} onChange={(e) => handleCreateFormChange('qualifierVotingEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 space-y-6">
                                            <ToggleSwitch label="お題を設定する" enabled={createForm.qualifierHasTheme} setEnabled={(val) => handleCreateFormChange('qualifierHasTheme', val)} />
                                            {createForm.qualifierHasTheme && (<div> <label className="block text-sm font-medium text-gray-700 mb-2">お題</label> <textarea value={createForm.qualifierTheme} onChange={(e) => handleCreateFormChange('qualifierTheme', e.target.value)} required rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"></textarea> </div>)}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIconLucide className="h-4 w-4 mr-2" />画像投稿設定</label>
                                                <select value={createForm.qualifierImageRule} onChange={(e) => handleCreateFormChange('qualifierImageRule', e.target.value as ImageRule)} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none">
                                                    <option value="optional">任意（画像あり/なし両方OK）</option>
                                                    <option value="required">必須（最低1枚の画像が必要）</option>
                                                    <option value="none">不可（画像投稿禁止）</option>
                                                </select>
                                            </div>
                                            <ToggleSwitch label="投票期間中に一般ユーザーへ投稿を公開する" enabled={createForm.qualifierIsVotingVisible} setEnabled={(val) => handleCreateFormChange('qualifierIsVotingVisible', val)} icon={Eye} />
                                        </div>
                                        <div> <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-600" />審査員用パスワード (任意)</label> <input type="password" value={createForm.qualifierJudgePassword} onChange={(e) => handleCreateFormChange('qualifierJudgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
                                    </div>

                                    <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                                        <h3 className="text-xl font-bold text-[#1DA1F2] mb-4">本選の設定</h3>
                                        <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                                                <div className="flex space-x-4">
                                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'both'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="both" className="mr-2" />審査+ユーザー</label>
                                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'user'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="user" className="mr-2" />ユーザーのみ</label>
                                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'judge'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="judge" className="mr-2" />審査のみ</label>
                                                </div>
                                            </div>

                                            {createForm.scoringMethod !== 'user' && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2"/> スコア計算設定</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className={`block text-sm font-medium mb-1 ${createForm.scoringMethod === 'judge' ? 'text-gray-500' : 'text-gray-700'}`}>一般票の重み係数</label>
                                                            <input type="number" disabled={createForm.scoringMethod === 'judge'} value={createForm.generalVoteWeight} onChange={(e) => handleCreateFormChange('generalVoteWeight', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 disabled:opacity-50"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">審査員評価の満点</label>
                                                            <input type="number" min="1" max="100" value={createForm.judgeMaxScore} onChange={(e) => handleCreateFormChange('judgeMaxScore', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50"> 
                                            <h4 className="text-lg font-semibold text-gray-600 mb-3">期間設定</h4> 
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                                                <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <div className="relative"> <input type="datetime-local" value={createForm.startTime} onChange={(e) => handleCreateFormChange('startTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                                <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <div className="relative"> <input type="datetime-local" value={createForm.endTime} onChange={(e) => handleCreateFormChange('endTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                            </div> 
                                            <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <div className="relative"> <input type="datetime-local" value={createForm.votingEndTime} onChange={(e) => handleCreateFormChange('votingEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 space-y-6">
                                            <ToggleSwitch label="お題を設定する" enabled={createForm.hasTheme} setEnabled={(val) => handleCreateFormChange('hasTheme', val)} />
                                            {createForm.hasTheme && (<div> <label className="block text-sm font-medium text-gray-700 mb-2">お題</label> <textarea value={createForm.theme} onChange={(e) => handleCreateFormChange('theme', e.target.value)} required rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"></textarea> </div>)}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIconLucide className="h-4 w-4 mr-2" />画像投稿設定</label>
                                                <select value={createForm.imageRule} onChange={(e) => handleCreateFormChange('imageRule', e.target.value as ImageRule)} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none">
                                                    <option value="optional">任意（画像あり/なし両方OK）</option>
                                                    <option value="required">必須（最低1枚の画像が必要）</option>
                                                    <option value="none">不可（画像投稿禁止）</option>
                                                </select>
                                            </div>
                                            <ToggleSwitch label="投票期間中に一般ユーザーへ投稿を公開する" enabled={createForm.isVotingVisible} setEnabled={(val) => handleCreateFormChange('isVotingVisible', val)} icon={Eye} />
                                        </div>
                                        <div> <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-600" />審査員用パスワード (任意)</label> <input type="password" value={createForm.judgePassword} onChange={(e) => handleCreateFormChange('judgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                                    <h3 className="text-xl font-bold text-[#1DA1F2] mb-4">大会の設定</h3>
                                    <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                                            <div className="flex space-x-4">
                                                <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'both'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="both" className="mr-2" />審査+ユーザー</label>
                                                <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'user'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="user" className="mr-2" />ユーザーのみ</label>
                                                <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'judge'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="judge" className="mr-2" />審査のみ</label>
                                            </div>
                                        </div>

                                        {createForm.scoringMethod !== 'user' && (
                                            <div className="pt-4 border-t border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2"/> スコア計算設定</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className={`block text-sm font-medium mb-1 ${createForm.scoringMethod === 'judge' ? 'text-gray-500' : 'text-gray-700'}`}>一般票の重み係数</label>
                                                        <input type="number" disabled={createForm.scoringMethod === 'judge'} value={createForm.generalVoteWeight} onChange={(e) => handleCreateFormChange('generalVoteWeight', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 disabled:opacity-50"/>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">審査員評価の満点</label>
                                                        <input type="number" min="1" max="100" value={createForm.judgeMaxScore} onChange={(e) => handleCreateFormChange('judgeMaxScore', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4"/>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50"> 
                                        <h4 className="text-lg font-semibold text-gray-600 mb-3">期間設定</h4> 
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                                            <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <div className="relative"> <input type="datetime-local" value={createForm.startTime} onChange={(e) => handleCreateFormChange('startTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                            <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <div className="relative"> <input type="datetime-local" value={createForm.endTime} onChange={(e) => handleCreateFormChange('endTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                        </div> 
                                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <div className="relative"> <input type="datetime-local" value={createForm.votingEndTime} onChange={(e) => handleCreateFormChange('votingEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                                    </div>

                                    <div className="pt-4 border-t border-gray-200 space-y-6">
                                        <ToggleSwitch label="お題を設定する" enabled={createForm.hasTheme} setEnabled={(val) => handleCreateFormChange('hasTheme', val)} />
                                        {createForm.hasTheme && (<div> <label className="block text-sm font-medium text-gray-700 mb-2">お題</label> <textarea value={createForm.theme} onChange={(e) => handleCreateFormChange('theme', e.target.value)} required rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"></textarea> </div>)}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIconLucide className="h-4 w-4 mr-2" />画像投稿設定</label>
                                            <select value={createForm.imageRule} onChange={(e) => handleCreateFormChange('imageRule', e.target.value as ImageRule)} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none">
                                                <option value="optional">任意（画像あり/なし両方OK）</option>
                                                <option value="required">必須（最低1枚の画像が必要）</option>
                                                <option value="none">不可（画像投稿禁止）</option>
                                            </select>
                                        </div>
                                        <ToggleSwitch label="投票期間中に一般ユーザーへ投稿を公開する" enabled={createForm.isVotingVisible} setEnabled={(val) => handleCreateFormChange('isVotingVisible', val)} icon={Eye} />
                                    </div>
                                    <div> <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-600" />審査員用パスワード (任意)</label> <input type="password" value={createForm.judgePassword} onChange={(e) => handleCreateFormChange('judgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
                                </div>
                            )}
                            <div> <button type="submit" disabled={createStatus === 'loading'} className="w-full bg-black text-white font-bold py-3 px-4 rounded-md hover:bg-gray-800 transition duration-300 disabled:bg-gray-600">{createStatus === 'loading' ? '作成中...' : '大会を作成する'}</button> </div>
                        </form>
                        {createMessage && (<div className={`mt-6 p-4 rounded-md text-sm ${createStatus === 'success' ? 'bg-black text-white' : createStatus === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'}`}>{createMessage}</div>)}
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">進行中の大会管理</h2>
                        {manageLoading && <p>読み込み中...</p>}
                        {manageError && <p className="text-red-500">エラー: {manageError}</p>}
                        {!manageLoading && !manageError && managedContests.length === 0 && <p className="text-gray-500">管理対象の大会はありません。</p>}
                        {!manageLoading && !manageError && managedContests.length > 0 && (
                            <div className="space-y-4">
                                {managedContests.map((contest) => (
                                    <div key={contest.id} className="bg-white shadow-sm p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-black">{contest.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">お題: {contest.theme || 'なし'}</p>
                                            <p className="text-xs text-gray-500 mt-1">投票終了: {dayjs(contest.votingEndTime).format('YYYY/MM/DD HH:mm')}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                            {contest.judgePassword ? (<div className="flex items-center bg-gray-200 px-2 py-1 rounded text-xs"> <KeyRound className="h-3 w-3 mr-1 text-gray-600" /> {showPasswordId === contest.id ? contest.judgePassword : '••••••'} <button onClick={() => setShowPasswordId(showPasswordId === contest.id ? null : contest.id)} className="ml-1.5 text-gray-600 hover:text-white"> {showPasswordId === contest.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} </button> </div>) : (<span className="text-xs text-gray-500 italic px-2">PWなし</span>)}
                                            <button onClick={() => setEditingContest(contest)} className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center"> <Edit3 className="h-3 w-3 mr-1" /> 更新 </button>
                                            <button onClick={() => setShowDeleteModal(contest)} className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white flex items-center"> <Trash2 className="h-3 w-3 mr-1" /> 削除 </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'news' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">ニュース管理</h2>
                        
                        <form onSubmit={handleAddNews} className="mb-8 bg-white shadow-sm p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-black mb-4">ニュースの追加</h3>
                            <div className="flex gap-4">
                                <input type="text" value={newNewsUrl} onChange={(e) => setNewNewsUrl(e.target.value)} placeholder="TwitterのURL または ツイートID" required className="flex-grow bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" />
                                <button type="submit" disabled={isAddingNews} className="bg-[#1DA1F2] text-white font-bold py-2 px-6 rounded-md  transition duration-300 disabled:bg-gray-600">
                                    {isAddingNews ? '追加中...' : '追加する'}
                                </button>
                            </div>
                        </form>

                        <div>
                            <h3 className="text-lg font-medium text-black mb-4">登録済みのニュース</h3>
                            {newsLoading && <p>読み込み中...</p>}
                            {newsError && <p className="text-red-500">エラー: {newsError}</p>}
                            {!newsLoading && !newsError && newsList.length === 0 && <p className="text-gray-500">ニュースはありません。</p>}
                            {!newsLoading && !newsError && newsList.length > 0 && (
                                <div className="space-y-4">
                                    {newsList.map((news) => (
                                        <div key={news.id} className="bg-white shadow-sm p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                            <div>
                                                <p className="text-black font-medium">ID: {news.tweet_id}</p>
                                                <p className="text-sm text-gray-500">追加日時: {dayjs(news.created_at).format('YYYY/MM/DD HH:mm')}</p>
                                            </div>
                                            <button onClick={() => handleDeleteNews(news.id)} className="text-xs px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white flex items-center">
                                                <Trash2 className="h-4 w-4 mr-1" /> 削除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 削除確認モーダル表示 */}
            {showDeleteModal && (
                <ConfirmDeleteModal
                    contestName={showDeleteModal.name}
                    onConfirm={handleDeleteContest}
                    onCancel={() => setShowDeleteModal(null)}
                    isDeleting={isDeleting}
                />
            )}

            {/* 編集モーダル */}
            {editingContest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative shadow-xl border border-gray-200 my-8">
                        <h2 className="text-xl font-bold mb-4 text-[#1DA1F2]">大会情報の編集</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div> <label className="block text-sm font-medium text-gray-700 mb-1">大会名</label> <input type="text" value={editingContest.name} onChange={(e) => setEditingContest({ ...editingContest, name: e.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /> </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <input type="datetime-local" value={editingContest.startTime.substring(0, 16)} onChange={(e) => setEditingContest({ ...editingContest, startTime: e.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /> </div>
                                <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <input type="datetime-local" value={editingContest.endTime.substring(0, 16)} onChange={(e) => setEditingContest({ ...editingContest, endTime: e.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /> </div>
                            </div>
                            <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <input type="datetime-local" value={editingContest.votingEndTime.substring(0, 16)} onChange={(e) => setEditingContest({ ...editingContest, votingEndTime: e.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /> </div>
                            
                            <div className="pt-2 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">主催者からのコメント（始め）</label> 
                                <textarea value={editingContest.resultCommentTop || ''} onChange={(e) => setEditingContest({ ...editingContest, resultCommentTop: e.target.value })} placeholder="結果発表画面の上部に表示されます" rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]"></textarea> 
                            </div>
                            <div> 
                                <label className="block text-sm font-medium text-gray-700 mb-1">主催者からのコメント（終わり）</label> 
                                <textarea value={editingContest.resultCommentBottom || ''} onChange={(e) => setEditingContest({ ...editingContest, resultCommentBottom: e.target.value })} placeholder="結果発表画面の下部に表示されます" rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]"></textarea> 
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditingContest(null)} disabled={isUpdating} className="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50">キャンセル</button>
                                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm rounded-md bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold disabled:opacity-50">{isUpdating ? '更新中...' : '保存する'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
