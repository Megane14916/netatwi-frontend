"use client";

import dayjs from "dayjs";
import { Trash2 } from "lucide-react";
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
import type { AdminDashboardController } from "../hooks/useAdminDashboard";

export function AdminNewsManagement({ controller }: { controller: AdminDashboardController }) {
  const {
    newsToDelete,
    setNewsToDelete,
    confirmDeleteNews,
    handleAddNews,
    newNewsUrl,
    setNewNewsUrl,
    isAddingNews,
    newsLoading,
    newsError,
    newsList,
  } = controller;
  return (
    <>
      <AlertDialog open={newsToDelete !== null} onOpenChange={(open) => !open && setNewsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ニュース削除</AlertDialogTitle>
            <AlertDialogDescription>本当に削除しますか？この操作は取り消せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewsToDelete(null)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteNews()} className="bg-red-600 hover:bg-red-700 text-white">削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div>
        <h2 className="text-2xl font-semibold mb-4">ニュース管理</h2>
        <form onSubmit={handleAddNews} className="mb-8 bg-white shadow-sm p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-black mb-4">ニュースの追加</h3>
          <div className="flex gap-4">
            <input type="text" value={newNewsUrl} onChange={(event) => setNewNewsUrl(event.target.value)} placeholder="TwitterのURL または ツイートID" required className="flex-grow bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" />
            <button type="submit" disabled={isAddingNews} className="bg-[#1DA1F2] text-white font-bold py-2 px-6 rounded-md transition duration-300 disabled:bg-gray-600">
              {isAddingNews ? "追加中..." : "追加する"}
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
                    <p className="text-black font-medium">ID: {news.tweetId}</p>
                    <p className="text-sm text-gray-500">追加日時: {dayjs(news.createdAt).format("YYYY/MM/DD HH:mm")}</p>
                  </div>
                  <button onClick={() => setNewsToDelete(news.id)} className="text-xs px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white flex items-center">
                    <Trash2 className="h-4 w-4 mr-1" /> 削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
