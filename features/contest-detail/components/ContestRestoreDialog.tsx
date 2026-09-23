"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ContestDetailController } from "../hooks/useContestDetailController";

export function ContestRestoreDialog({ controller }: { controller: ContestDetailController }) {
  const {
    isRestoreDialogOpen,
    setIsRestoreDialogOpen,
    pendingRestoreFileName,
    confirmRestoreVotes,
  } = controller;

  return (
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投票の復元</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingRestoreFileName}</strong> を読み込もうとしています。<br />
              現在の投票状況をこのファイルの内容で上書きしますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRestoreDialogOpen(false)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestoreVotes} className="bg-[#1DA1F2] hover:bg-[#1788cc] text-white">復元する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  );
}
