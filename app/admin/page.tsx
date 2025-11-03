'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, ToggleLeft, ToggleRight, Image as ImageIconLucide, Trophy as TrophyIcon, CalendarDays, Trash2, Edit3, Eye, EyeOff, PlusCircle, Settings } from 'lucide-react';
import dayjs from 'dayjs';

// --- ▼▼▼ API_URLを環境変数から取得 ▼▼▼ ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
// --- ▲▲▲ ここまで ▲▲▲ ---


// --- ▼▼▼ トグルスイッチコンポーネント (構文修正) ▼▼▼ ---
interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  icon?: React.ElementType;
}
const ToggleSwitch = ({ label, enabled, setEnabled, icon: Icon }: ToggleSwitchProps) => (
  <div className="flex items-center justify-between">
    <label htmlFor={`toggle-${label}`} className="flex items-center text-sm font-medium text-gray-300 cursor-pointer">
      {Icon && <Icon className="h-4 w-4 mr-2 text-gray-400" />}
      {label}
    </label>
    <button
      type="button"
      id={`toggle-${label}`}
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 ${
        enabled ? 'bg-yellow-600' : 'bg-gray-700'
      }`}
    >
      <span className="sr-only">{label}を{enabled ? '無効にする' : '有効にする'}</span>
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
); // 末尾のセミコロンを削除
// --- ▲▲▲ ここまで ▲▲▲ ---

// --- ▼▼▼ 削除確認モーダル (構文修正) ▼▼▼ ---
interface ConfirmDeleteModalProps {
    contestName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}
const ConfirmDeleteModal = ({ contestName, onConfirm, onCancel, isDeleting }: ConfirmDeleteModalProps) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-sm relative shadow-xl border border-red-700">
            <h2 className="text-lg font-semibold mb-3 text-red-400">削除確認</h2>
            <p className="text-sm text-gray-300 mb-6">本当に大会「<span className="font-bold">{contestName}</span>」を削除しますか？<br/>この操作は元に戻せません。</p>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} disabled={isDeleting} className="px-4 py-2 text-sm rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                    キャンセル
                </button>
                <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:bg-red-800">
                    {isDeleting ? '削除中...' : '削除する'}
                </button>
            </div>
        </div>
    </div>
); // 末尾のセミコロンを削除
// --- ▲▲▲ ここまで ▲▲▲ ---

// --- ▼▼▼ 管理用大会リストの型 ▼▼▼ ---
interface ManagedContest {
    id: number;
    name: string;
    theme: string | null;
    startTime: string;
    endTime: string;
    votingEndTime: string;
    judgePassword?: string | null;
}
// --- ▲▲▲ ここまで ▲▲▲ ---

export default function AdminPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

    // Create Tab States
    const [createForm, setCreateForm] = useState({
        name: '', hasTheme: true, theme: '', startTime: '', endTime: '',
        votingEndTime: '', judgeVoteRatio: 2, judgePassword: '',
        hasQualifier: false, allowImages: true, qualifierStartTime: '',
        qualifierEndTime: '', qualifierVotingEndTime: ''
    });
    const [createStatus, setCreateStatus] = useState('');
    const [createMessage, setCreateMessage] = useState('');

    // Manage Tab States
    const [managedContests, setManagedContests] = useState<ManagedContest[]>([]);
    const [manageLoading, setManageLoading] = useState(true);
    const [manageError, setManageError] = useState<string | null>(null);
    const [showPasswordId, setShowPasswordId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<ManagedContest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (activeTab === 'manage') {
            const fetchManagedContests = async () => {
                setManageLoading(true);
                setManageError(null);
                try {
                    const response = await fetch(`${API_URL}/api/admin/contests/management`, { credentials: 'include' });
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
        }
    }, [activeTab]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateStatus('loading');
        setCreateMessage('作成中...');
        const payload: any = { ...createForm };
        payload.startTime = new Date(createForm.startTime).toISOString();
        payload.endTime = new Date(createForm.endTime).toISOString();
        payload.votingEndTime = new Date(createForm.votingEndTime).toISOString();
        if (createForm.hasQualifier) {
             if (createForm.qualifierStartTime) payload.qualifierStartTime = new Date(createForm.qualifierStartTime).toISOString();
             if (createForm.qualifierEndTime) payload.qualifierEndTime = new Date(createForm.qualifierEndTime).toISOString();
             if (createForm.qualifierVotingEndTime) payload.qualifierVotingEndTime = new Date(createForm.qualifierVotingEndTime).toISOString();
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/contests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setCreateStatus('success');
                setCreateMessage(`大会「${createForm.name}」が作成されました！ (ID: ${data.id})`);
                setCreateForm({
                    name: '', hasTheme: true, theme: '', startTime: '', endTime: '',
                    votingEndTime: '', judgeVoteRatio: 2, judgePassword: '',
                    hasQualifier: false, allowImages: true, qualifierStartTime: '',
                    qualifierEndTime: '', qualifierVotingEndTime: ''
                });
            } else { throw new Error(data.error || '不明なエラーが発生しました。'); }
        } catch (error) {
            setCreateStatus('error');
            setCreateMessage(error instanceof Error ? error.message : '大会の作成に失敗しました。');
        } finally {
             if (createStatus !== 'loading') { setTimeout(() => { setCreateStatus(''); setCreateMessage(''); }, 5000); }
        }
    };

    const handleCreateFormChange = (field: keyof typeof createForm, value: any) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    const handleDeleteContest = async () => {
        if (!showDeleteModal) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/contests/${showDeleteModal.id}`, {
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
            alert(`削除エラー: ${error instanceof Error ? error.message : error}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!user) {
         return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold">アクセス権がありません</h1>
                <p className="text-gray-400 mt-2">このページは管理者専用です。</p>
            </div>
         );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">管理者ダッシュボード</h1>

            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('create')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${ activeTab === 'create' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500' }`} > <PlusCircle className="inline-block h-5 w-5 mr-1.5 align-text-bottom"/> 新規作成 </button>
                    <button onClick={() => setActiveTab('manage')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${ activeTab === 'manage' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500' }`} > <Settings className="inline-block h-5 w-5 mr-1.5 align-text-bottom"/> 大会管理 </button>
                </nav>
            </div>

            <div>
                {activeTab === 'create' && (
                    <div className="max-w-2xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6">新しい大会を作成</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-6">
                             <div> <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">大会名</label> <input type="text" id="name" value={createForm.name} onChange={(e) => handleCreateFormChange('name', e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none"/> </div>
                            <ToggleSwitch label="お題を設定する" enabled={createForm.hasTheme} setEnabled={(val) => handleCreateFormChange('hasTheme', val)} />
                            {createForm.hasTheme && ( <div> <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-2">お題</label> <textarea id="theme" value={createForm.theme} onChange={(e) => handleCreateFormChange('theme', e.target.value)} required={createForm.hasTheme} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none"></textarea> </div> )}
                             <div className="pt-4 border-t border-gray-700"> <ToggleSwitch label="予選・決勝形式にする" enabled={createForm.hasQualifier} setEnabled={(val) => handleCreateFormChange('hasQualifier', val)} icon={TrophyIcon} /> </div>
                            {createForm.hasQualifier && ( <div className="space-y-4 p-4 border border-dashed border-gray-600 rounded-md bg-gray-800/30"> <h3 className="text-lg font-semibold text-gray-400 mb-3">予選期間設定</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="qualifierStartTime" className="block text-sm font-medium text-gray-300 mb-1">予選 投稿開始</label> <div className="relative"> <input type="datetime-local" id="qualifierStartTime" value={createForm.qualifierStartTime} onChange={(e) => handleCreateFormChange('qualifierStartTime', e.target.value)} required={createForm.hasQualifier} className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"/> </div> </div> <div> <label htmlFor="qualifierEndTime" className="block text-sm font-medium text-gray-300 mb-1">予選 投稿終了</label> <div className="relative"> <input type="datetime-local" id="qualifierEndTime" value={createForm.qualifierEndTime} onChange={(e) => handleCreateFormChange('qualifierEndTime', e.target.value)} required={createForm.hasQualifier} className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"/> </div> </div> </div> <div> <label htmlFor="qualifierVotingEndTime" className="block text-sm font-medium text-gray-300 mb-1">予選 投票終了</label> <div className="relative"> <input type="datetime-local" id="qualifierVotingEndTime" value={createForm.qualifierVotingEndTime} onChange={(e) => handleCreateFormChange('qualifierVotingEndTime', e.target.value)} required={createForm.hasQualifier} className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"/> </div> </div> </div> )}
                            <div className="space-y-4 p-4 border border-dashed border-gray-600 rounded-md bg-gray-800/30"> <h3 className="text-lg font-semibold text-gray-400 mb-3">{createForm.hasQualifier ? '決勝 期間設定' : '大会期間設定'}</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">{createForm.hasQualifier ? '決勝 ' : ''}投稿開始</label> <div className="relative"> <input type="datetime-local" id="startTime" value={createForm.startTime} onChange={(e) => handleCreateFormChange('startTime', e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"/> </div> </div> <div> <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">{createForm.hasQualifier ? '決勝 ' : ''}投稿終了</label> <div className="relative"> <input type="datetime-local" id="endTime" value={createForm.endTime} onChange={(e) => handleCreateFormChange('endTime', e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"/> </div> </div> </div> <div> <label htmlFor="votingEndTime" className="block text-sm font-medium text-gray-300 mb-1">{createForm.hasQualifier ? '決勝 ' : ''}投票終了</label> <div className="relative"> <input type="datetime-local" id="votingEndTime" value={createForm.votingEndTime} onChange={(e) => handleCreateFormChange('votingEndTime', e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"/> </div> </div> </div>
                             <div> <label htmlFor="judgeVoteRatio" className="block text-sm font-medium text-gray-300 mb-2">審査員票の重み (一般票の何倍か) : <span className="font-bold text-yellow-400">{createForm.judgeVoteRatio} 倍</span></label> <input type="range" id="judgeVoteRatio" min="1" max="10" value={createForm.judgeVoteRatio} onChange={(e) => handleCreateFormChange('judgeVoteRatio', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"/> </div>
                             <div className="pt-4 border-t border-gray-700"> <ToggleSwitch label="画像投稿を許可" enabled={createForm.allowImages} setEnabled={(val) => handleCreateFormChange('allowImages', val)} icon={ImageIconLucide} /> </div>
                            <div> <label htmlFor="judgePassword" className="block text-sm font-medium text-gray-300 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-400"/>審査員用パスワード (任意)</label> <input type="password" id="judgePassword" value={createForm.judgePassword} onChange={(e) => handleCreateFormChange('judgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none"/> <p className="text-xs text-gray-500 mt-1">審査員が投票する際に必要になります。</p> </div>
                            <div> <button type="submit" disabled={createStatus === 'loading'} className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-md hover:bg-yellow-600 transition duration-300 disabled:bg-gray-600">{createStatus === 'loading' ? '作成中...' : '大会を作成する'}</button> </div>
                        </form>
                        {createMessage && ( <div className={`mt-6 p-4 rounded-md text-sm ${ createStatus === 'success' ? 'bg-green-900/50 text-green-300' : createStatus === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300' }`}>{createMessage}</div> )}
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
                                    <div key={contest.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-gray-200">{contest.name}</h3>
                                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">お題: {contest.theme || 'なし'}</p>
                                            <p className="text-xs text-gray-500 mt-1">投票終了: {dayjs(contest.votingEndTime).format('YYYY/MM/DD HH:mm')}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                             {contest.judgePassword ? ( <div className="flex items-center bg-gray-700 px-2 py-1 rounded text-xs"> <KeyRound className="h-3 w-3 mr-1 text-gray-400"/> {showPasswordId === contest.id ? contest.judgePassword : '••••••'} <button onClick={() => setShowPasswordId(showPasswordId === contest.id ? null : contest.id)} className="ml-1.5 text-gray-400 hover:text-white"> {showPasswordId === contest.id ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>} </button> </div> ) : ( <span className="text-xs text-gray-500 italic px-2">PWなし</span> )}
                                            <button className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center disabled:opacity-50" disabled> <Edit3 className="h-3 w-3 mr-1"/> 更新 </button>
                                            <button onClick={() => setShowDeleteModal(contest)} className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white flex items-center"> <Trash2 className="h-3 w-3 mr-1"/> 削除 </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
        </div>
    );
}

