"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowUpDown,
  CheckCircle,
  Download,
  Heart,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Trophy,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import CommentList from "@/components/CommentList";
import ImageGrid from "@/components/ImageGrid";
import { submitContestVotes } from "@/lib/api/endpoints/votes";
import { getApiErrorMessage } from "@/lib/api/core";
import type { Contest, Post, User } from "@/types/domain";
import type { ContestAccess } from "../model/contestStatus";
import { useJudgePostOrder, useScoreSortedPosts } from "../hooks/useJudgePostOrder";
import { usePrefetchedComments } from "../hooks/usePrefetchedComments";
import { useVoteEditor } from "../hooks/useVoteEditor";
import {
  backupVotesToRecord,
  createVoteBackup,
  parseVoteBackup,
  type VoteBackup,
} from "../model/voteBackup";
import {
  buildVotePayload,
  getJudgeVoteProgress,
  getVoteValidationMessage,
} from "../model/voting";
import type { JudgeSortOrder } from "../model/judgeOrder";

interface ContestVotingSectionProps {
  contest: Contest;
  posts: Post[];
  user: User | null;
  access: ContestAccess;
  isJudgeMode: boolean;
  isVoteDeadlineExceeded: boolean;
  isLoading: boolean;
  userHasVoted: boolean;
  onPostsChanged: () => Promise<unknown>;
}

function GeneralVoteButton({
  postId,
  selected,
  disabled,
  onChange,
}: {
  postId: number;
  selected: boolean;
  disabled: boolean;
  onChange: (postId: number, score: number | null) => void;
}) {
  return (
    <button
      onClick={() => onChange(postId, selected ? null : 1)}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full border transition-all ${
        selected
          ? "text-pink-500 bg-pink-50 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800"
          : "text-gray-500 dark:text-gray-400 border-transparent hover:text-pink-500 hover:border-pink-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Heart className={`w-4 h-4 md:w-5 md:h-5 ${selected ? "fill-current" : ""}`} />
      <span className="text-xs md:text-sm font-bold">{selected ? "いいね！" : "いいね"}</span>
    </button>
  );
}

function JudgeVoteSelector({
  postId,
  score,
  maxScore,
  disabled,
  onChange,
}: {
  postId: number;
  score: number | null;
  maxScore: number;
  disabled: boolean;
  onChange: (postId: number, score: number | null) => void;
}) {
  const [input, setInput] = useState(score === null ? "" : String(score));
  useEffect(() => setInput(score === null ? "" : String(score)), [score]);

  return (
    <div className="inline-flex flex-col justify-center">
      <span className="mb-1 flex items-center gap-1 px-1 text-[10px] font-bold text-indigo-600 md:text-xs">
        <ShieldCheck className="w-3 h-3" />審査員評価
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max={maxScore}
          step="0.1"
          value={input}
          disabled={disabled}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const nextInput = event.target.value;
            const parsed = Number.parseFloat(nextInput);
            if (nextInput === "" || Number.isNaN(parsed)) {
              setInput(nextInput);
              onChange(postId, null);
              return;
            }
            const clamped = Math.min(maxScore, Math.max(0, parsed));
            setInput(String(clamped));
            onChange(postId, clamped);
          }}
          className="w-20 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-right text-sm text-black focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:bg-black dark:text-white"
          placeholder="0"
        />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">点</span>
      </div>
    </div>
  );
}

export function ContestVotingSection({
  contest,
  posts,
  user,
  access,
  isJudgeMode,
  isVoteDeadlineExceeded,
  isLoading,
  userHasVoted,
  onPostsChanged,
}: ContestVotingSectionProps) {
  const { toast } = useToast();
  const orderedPosts = useJudgePostOrder(posts, contest.id, isJudgeMode);
  const { state, dispatch, resetFromServer } = useVoteEditor(orderedPosts);
  const [judgeSortOrder, setJudgeSortOrder] = useState<JudgeSortOrder>("original");
  const displayPosts = useScoreSortedPosts(orderedPosts, state.votes, judgeSortOrder);
  const prefetchedComments = usePrefetchedComments(orderedPosts, [], "voting");
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [commentedPosts, setCommentedPosts] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [restoreBackup, setRestoreBackup] = useState<VoteBackup | null>(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const restoreInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("voted") !== "true") return;
    setShowSuccess(true);
    window.history.replaceState({}, "", window.location.pathname);
    const timer = window.setTimeout(() => setShowSuccess(false), 5_000);
    return () => window.clearTimeout(timer);
  }, []);

  const progress = useMemo(
    () =>
      getJudgeVoteProgress(
        orderedPosts,
        state,
        user?.id ?? null,
        new Set(
          Object.entries(commentedPosts)
            .filter(([, commented]) => commented)
            .map(([postId]) => Number(postId)),
        ),
      ),
    [commentedPosts, orderedPosts, state, user?.id],
  );

  const submitVotes = async () => {
    if (isVoteDeadlineExceeded) {
      toast({ title: "エラー", description: "投票期間は終了しました。", variant: "destructive" });
      return;
    }
    const result = buildVotePayload({
      posts: orderedPosts,
      state,
      userId: user?.id ?? null,
      isJudgeMode,
      judgeMaxScore: contest.judgeMaxScore,
    });
    if (!result.ok) {
      toast({
        title: "入力内容を確認してください",
        description: getVoteValidationMessage(result.errors[0]),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContestVotes(contest.id, result.payload);
      await onPostsChanged();
      resetFromServer();
      setShowSuccess(true);
      window.setTimeout(() => setShowSuccess(false), 5_000);
    } catch (error) {
      toast({
        title: "エラー",
        description: getApiErrorMessage(error, "通信エラーが発生しました。"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadBackup = () => {
    const backup = createVoteBackup(contest.id, state.votes, orderedPosts, state.judgeAward);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `netatwi_votes_backup_contest_${contest.id}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const readBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      try {
        const backup = parseVoteBackup(JSON.parse(String(target?.result)), contest.id);
        if (!backup) throw new Error("Invalid backup");
        setRestoreBackup(backup);
        setRestoreFileName(file.name);
      } catch {
        toast({
          title: "エラー",
          description: "この大会用の正しいバックアップファイルを選択してください。",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  if (!access.canViewVotingPosts) {
    return (
      <div className="mb-24 rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center text-black/50 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white/50">
        現在投票期間中のため、投稿は非公開です。
      </div>
    );
  }

  return (
    <>
      {showSuccess && (
        <div className="fixed left-1/2 top-[72px] z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 shadow-lg">
          <p className="flex items-center font-bold"><CheckCircle className="mr-2 h-5 w-5" />投票が完了しました！</p>
          <p className="text-sm">期間内であれば何度でも投票内容を更新できます。</p>
        </div>
      )}

      {access.canVote && isJudgeMode && (
        <div className="mb-6 flex max-w-sm flex-col gap-2">
          <button onClick={downloadBackup} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
            <Download className="h-4 w-4" />現在の投票をバックアップ
          </button>
          <button onClick={() => restoreInput.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
            <Upload className="h-4 w-4" />バックアップから復元
          </button>
          <button
            onClick={() => {
              dispatch({
                type: "fill-unvoted",
                postIds: orderedPosts.filter((post) => post.userId !== user?.id).map(({ id }) => id),
                score: 0,
              });
              toast({ title: "一括入力", description: "未投票の投稿に0点を入力しました。" });
            }}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          >
            未投票を0点で埋める
          </button>
          <input ref={restoreInput} type="file" accept="application/json" hidden onChange={readBackup} />
        </div>
      )}

      <div className="mb-24">
        {isJudgeMode && displayPosts.length > 0 && (
          <div className="sticky top-[48px] z-30 -mx-4 flex items-center justify-between border-y border-gray-200 bg-gray-50/95 px-3 py-2 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95 md:top-[64px] md:mx-0 md:rounded-t-2xl md:border-x">
            <span className="flex items-center gap-1 text-sm font-bold"><ArrowUpDown className="h-4 w-4" />並び順</span>
            <select
              value={judgeSortOrder}
              onChange={(event) => setJudgeSortOrder(event.target.value as JudgeSortOrder)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-bold dark:border-gray-700 dark:bg-black"
            >
              <option value="original">標準</option>
              <option value="desc">得点: 高い順</option>
              <option value="asc">得点: 低い順</option>
            </select>
          </div>
        )}

        <div className="-mx-4 divide-y divide-gray-100 border-y border-gray-200 bg-white shadow-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-black md:mx-0 md:rounded-b-2xl md:border-x">
          {displayPosts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-black/50 dark:text-white/50">
              {isLoading && <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#1DA1F2]" />}
              {isLoading ? "読み込み中..." : "投稿がありません。"}
            </div>
          ) : (
            displayPosts.map((post) => {
              const isOwnPost = post.userId === user?.id;
              const commentsOpen = Boolean(openComments[post.id]);
              return (
                <article key={post.id} className="px-3 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 sm:p-5">
                  <div className="flex items-start gap-3">
                    {isOwnPost ? (
                      <img src={user?.profileImageUrl || "https://via.placeholder.com/40"} alt={user?.name || ""} className="h-10 w-10 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-gray-100 dark:bg-gray-900"><UserIcon className="h-6 w-6 text-gray-400" /></div>
                    )}
                    <div className="min-w-0 flex-grow">
                      <p className="mb-1 text-sm font-bold">{isOwnPost ? user?.name : "匿名さん"}</p>
                      <p className="mb-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}{"\u200B"}</p>
                      {post.images.length > 0 && <ImageGrid images={post.images} />}

                      <div className={`mt-2 flex w-full items-end gap-2 ${access.canVote && isJudgeMode ? "justify-between" : "justify-end"}`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOpenComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold ${commentsOpen || post.hasCommented || commentedPosts[post.id] ? "border-[#1DA1F2]/20 bg-[#1DA1F2]/10 text-[#1DA1F2]" : "border-transparent text-gray-500"}`}
                          >
                            <MessageSquare className="h-4 w-4" />コメント
                          </button>
                          {access.canVote && !isJudgeMode && (
                            <GeneralVoteButton
                              postId={post.id}
                              selected={state.votes[post.id] === 1}
                              disabled={isVoteDeadlineExceeded || isOwnPost}
                              onChange={(postId, score) => dispatch({ type: "set-vote", postId, score })}
                            />
                          )}
                        </div>
                        {access.canVote && isJudgeMode && (
                          <JudgeVoteSelector
                            postId={post.id}
                            score={state.votes[post.id] ?? null}
                            maxScore={contest.judgeMaxScore}
                            disabled={isVoteDeadlineExceeded || isOwnPost}
                            onChange={(postId, score) => dispatch({ type: "set-vote", postId, score })}
                          />
                        )}
                      </div>

                      <div className={commentsOpen ? "mt-3" : "hidden"}>
                        <CommentList
                          postId={post.id}
                          currentUser={user}
                          contestStatus="voting"
                          isJudgeMode={isJudgeMode}
                          isOpenProp={commentsOpen}
                          initialComments={prefetchedComments[post.id] ?? []}
                          onClose={() => setOpenComments((current) => ({ ...current, [post.id]: false }))}
                          onCommentAdded={() => setCommentedPosts((current) => ({ ...current, [post.id]: true }))}
                          onCommentDeleted={() => setCommentedPosts((current) => ({ ...current, [post.id]: false }))}
                        />
                      </div>

                      {access.canVote && isJudgeMode && (
                        <div className="mt-2 w-full border-t border-gray-200 pt-2 dark:border-gray-800">
                          <label className={`flex items-center ${isOwnPost ? "opacity-50" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="judgeAward"
                              checked={state.judgeAward.postId === post.id}
                              disabled={isVoteDeadlineExceeded || isOwnPost}
                              onChange={() => {
                                if (state.judgeAward.postId !== post.id) {
                                  dispatch({ type: "toggle-judge-award", postId: post.id });
                                }
                              }}
                              onClick={() => {
                                if (state.judgeAward.postId === post.id) dispatch({ type: "toggle-judge-award", postId: post.id });
                              }}
                            />
                            <span className="ml-2 flex items-center text-xs font-bold text-yellow-600"><Trophy className="mr-1 h-4 w-4" />審査員賞に選ぶ</span>
                          </label>
                          {state.judgeAward.postId === post.id && (
                            <textarea
                              value={state.judgeAward.comment}
                              onChange={(event) => dispatch({ type: "set-judge-comment", comment: event.target.value })}
                              disabled={isVoteDeadlineExceeded}
                              placeholder="選評コメントを入力してください..."
                              className="mt-2 min-h-[60px] w-full resize-y rounded-lg border border-yellow-300 bg-white p-2 text-sm text-black dark:bg-black dark:text-white"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {access.canVote && (
        <div className="sticky bottom-0 z-40 -mx-4 mt-auto flex flex-col items-center border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/90">
          {isJudgeMode && (
            <div className="mb-2 flex w-full max-w-md items-center justify-between border-b border-gray-200 px-1 pb-2 text-xs font-bold text-gray-600 dark:border-gray-800 dark:text-gray-300">
              <span className={progress.voted === progress.total ? "text-lime-500" : ""}>投票: {progress.voted}/{progress.total}</span>
              <span className={progress.hasCompleteJudgeAward ? "text-lime-500" : ""}>審査員賞: {progress.hasCompleteJudgeAward ? <CheckCircle className="inline h-4 w-4" /> : <X className="inline h-4 w-4" />}</span>
              <span className={progress.commented === progress.total ? "text-lime-500" : ""}>コメント: {progress.commented}/{progress.total}</span>
            </div>
          )}
          <button
            onClick={submitVotes}
            disabled={isSubmitting || isVoteDeadlineExceeded}
            className="flex w-full max-w-md items-center justify-center rounded-full bg-[#1DA1F2] px-6 py-3.5 text-[15px] font-bold text-white shadow-md hover:bg-[#1788cc] disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isSubmitting ? "送信中..." : userHasVoted ? "投票を更新する" : "投票する"}
          </button>
        </div>
      )}

      <AlertDialog open={restoreBackup !== null} onOpenChange={(open) => !open && setRestoreBackup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投票の復元</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{restoreFileName}</strong> の内容で現在の投票を上書きしますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreBackup) {
                  dispatch({
                    type: "restore",
                    state: {
                      votes: backupVotesToRecord(restoreBackup),
                      judgeAward: restoreBackup.judgeAwardSelection,
                    },
                  });
                  toast({ title: "成功", description: "投票を復元しました。" });
                }
                setRestoreBackup(null);
              }}
              className="bg-[#1DA1F2] text-white hover:bg-[#1788cc]"
            >
              復元する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
