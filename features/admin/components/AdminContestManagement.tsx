"use client";

import dayjs from "dayjs";
import { Edit3, Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import type { AdminDashboardController } from "../hooks/useAdminDashboard";

export function AdminContestManagement({ controller }: { controller: AdminDashboardController }) {
  const {
    managedContests,
    manageLoading,
    manageError,
    showPasswordId,
    setShowPasswordId,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    handleDeleteContest,
    editingContest,
    setEditingContest,
    isUpdating,
    handleEditSubmit,
  } = controller;

  return (
    <>
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
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">お題: {contest.theme || "なし"}</p>
                  <p className="text-xs text-gray-500 mt-1">投票終了: {dayjs(contest.votingEndTime).format("YYYY/MM/DD HH:mm")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {contest.judgePassword ? (
                    <div className="flex items-center bg-gray-200 px-2 py-1 rounded text-xs">
                      <KeyRound className="h-3 w-3 mr-1 text-gray-600" />
                      {showPasswordId === contest.id ? contest.judgePassword : "••••••"}
                      <button onClick={() => setShowPasswordId(showPasswordId === contest.id ? null : contest.id)} className="ml-1.5 text-gray-600 hover:text-white">
                        {showPasswordId === contest.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  ) : <span className="text-xs text-gray-500 italic px-2">PWなし</span>}
                  <button onClick={() => setEditingContest(contest)} className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center"><Edit3 className="h-3 w-3 mr-1" /> 更新</button>
                  <button onClick={() => setShowDeleteModal(contest)} className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white flex items-center"><Trash2 className="h-3 w-3 mr-1" /> 削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm relative shadow-xl border border-red-700">
            <h2 className="text-lg font-semibold mb-3 text-red-400">削除確認</h2>
            <p className="text-sm text-gray-700 mb-6">本当に大会「<span className="font-bold">{showDeleteModal.name}</span>」を削除しますか？<br />この操作は元に戻せません。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(null)} disabled={isDeleting} className="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50">キャンセル</button>
              <button onClick={() => void handleDeleteContest()} disabled={isDeleting} className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:bg-red-800">{isDeleting ? "削除中..." : "削除する"}</button>
            </div>
          </div>
        </div>
      )}

      {editingContest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative shadow-xl border border-gray-200 my-8">
            <h2 className="text-xl font-bold mb-4 text-[#1DA1F2]">大会情報の編集</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">大会名</label><input type="text" value={editingContest.name} onChange={(event) => setEditingContest({ ...editingContest, name: event.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label><input type="datetime-local" value={editingContest.startTime.substring(0, 16)} onChange={(event) => setEditingContest({ ...editingContest, startTime: event.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label><input type="datetime-local" value={editingContest.endTime.substring(0, 16)} onChange={(event) => setEditingContest({ ...editingContest, endTime: event.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label><input type="datetime-local" value={editingContest.votingEndTime.substring(0, 16)} onChange={(event) => setEditingContest({ ...editingContest, votingEndTime: event.target.value })} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]" /></div>
              <div className="pt-2 border-t border-gray-200"><label className="block text-sm font-medium text-gray-700 mb-1 mt-2">主催者からのコメント（始め）</label><textarea value={editingContest.resultCommentTop || ""} onChange={(event) => setEditingContest({ ...editingContest, resultCommentTop: event.target.value })} placeholder="結果発表画面の上部に表示されます" rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]"></textarea></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">主催者からのコメント（終わり）</label><textarea value={editingContest.resultCommentBottom || ""} onChange={(event) => setEditingContest({ ...editingContest, resultCommentBottom: event.target.value })} placeholder="結果発表画面の下部に表示されます" rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#1DA1F2]"></textarea></div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingContest(null)} disabled={isUpdating} className="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50">キャンセル</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm rounded-md bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold disabled:opacity-50">{isUpdating ? "更新中..." : "保存する"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
