"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";
import { useToast } from "@/components/ui/use-toast";
import type { Post } from '@/types/domain';
import { submitContestVotes } from '@/lib/api/endpoints/votes';
import { getApiErrorMessage } from '@/lib/api/core';
import { useContest, useContestPosts, useContestResults } from '@/hooks/api/useContests';
import { getContestTiming } from '@/features/contest-detail/model/contestStatus';
import { useJudgePostOrder, useScoreSortedPosts } from '@/features/contest-detail/hooks/useJudgePostOrder';
import { usePrefetchedComments } from '@/features/contest-detail/hooks/usePrefetchedComments';
import { useVoteEditor } from '@/features/contest-detail/hooks/useVoteEditor';
import { backupVotesToRecord, createVoteBackup, parseVoteBackup, type VoteBackup } from '@/features/contest-detail/model/voteBackup';
import { buildVotePayload, getVoteValidationMessage } from '@/features/contest-detail/model/voting';

export function useContestDetailController() {
  const { toast } = useToast();
  const params = useParams();
  const contestId = parseInt(params?.id as string, 10);
  const { user, judgeContests, refetchUser } = useAuth();

  // 1. SWRによるデータ取得を一番上に移動
  const { data: contestData, error: contestError, mutate: mutateContest } = useContest(
    contestId || null,
  );

  const [currentTime, setCurrentTime] = useState(new Date());

  // 2. contestDataから状態を導出
  const contest = contestData || null;
  const timing = useMemo(
    () => contestData ? getContestTiming(contestData, currentTime) : null,
    [contestData, currentTime],
  );
  const contestStatus = timing?.status ?? null;
  const isPostDeadlineExceeded = timing?.isPostDeadlineExceeded ?? false;
  const isVoteDeadlineExceeded = timing?.isVoteDeadlineExceeded ?? false;

  // SWRのデータ取得後、後でuseMemo等を用いて導出するため、ここでは削除します。
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "random">("desc");

  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);

  const [judgeSortOrder, setJudgeSortOrder] = useState<"original" | "asc" | "desc">("original");

  const isJudgeMode = judgeContests.includes(contestId);

  const isVotePeriod = !isVoteDeadlineExceeded && contestStatus === "voting";
  const showVoteUI =
    contestStatus === "voting" &&
    ((contest?.scoringMethod !== "judge" && user) || isJudgeMode);
  const voteUIDisabled = false;

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [hideJudgeBanner, setHideJudgeBanner] = useState(false);

  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<VoteBackup | null>(null);
  const [pendingRestoreFileName, setPendingRestoreFileName] = useState("");
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const sortSentinelRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isJudgeMode) return;
    const handleScroll = () => {
      if (sortSentinelRef.current && stickyContainerRef.current) {
         const top = sortSentinelRef.current.getBoundingClientRect().top;
         const headerHeight = window.innerWidth >= 768 ? 64 : 48;
         if (top <= headerHeight) {
            stickyContainerRef.current.classList.remove("md:rounded-t-2xl");
            stickyContainerRef.current.classList.add("border-t-0");
         } else {
            stickyContainerRef.current.classList.add("md:rounded-t-2xl");
            stickyContainerRef.current.classList.remove("border-t-0");
         }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isJudgeMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("voted") === "true") {
        setShowSuccessBanner(true);
        // URLをクリーンにする
        window.history.replaceState({}, "", window.location.pathname);
        // 数秒後にバナーを消す
        setTimeout(() => setShowSuccessBanner(false), 5000);
      }
    }
  }, []);

  // postsData の取得（ongoing, votingのときのみ）
  const { data: postsData, error: postsError, mutate: mutatePosts } = useContestPosts(
    contestId,
    contestStatus === "ongoing" || contestStatus === "voting",
  );

  // resultsData の取得（closedのときのみ）
  const { data: resultsDataRaw, error: resultsError } = useContestResults(
    contestId,
    contestStatus === "closed",
  );

  // loading と error の導出
  const loading = !contestData && !contestError;
  const error = contestError || postsError || resultsError ? "データの取得に失敗しました" : "";

  // ----------------------------------------------------
  // 以下、SWRのデータから各状態を直接導出（useEffect不要）
  // ----------------------------------------------------

  const results = useMemo(
    () => resultsDataRaw?.results || [],
    [resultsDataRaw?.results],
  );
  const judgeAwardsResults = resultsDataRaw?.judgeAwards || [];

  const sortedResults = useMemo(() => {
    const newResults = [...results];
    if (sortOrder === "desc") {
      newResults.reverse();
    } else if (sortOrder === "random") {
      newResults.sort(() => Math.random() - 0.5);
    }
    return newResults;
  }, [results, sortOrder]);
  
  const totalPosters = contestData?.postCount ?? 0;
  const totalVoters = contestData?.totalVoters ?? 0;
  const totalJudges = contestData?.totalJudges ?? 0;
  const userHasVoted = postsData?.userHasVotedInContest || false;
  
  const visiblePosts = useMemo(() => {
    if (!postsData || !postsData.posts) return [];
    const allPosts: Post[] = postsData.posts;
    
    if (contestStatus === "ongoing") {
      if (user) {
         const myPost = allPosts.find(p => p.userId === user.id);
         return myPost ? [myPost] : [];
      }
      return [];
    }
    
    if (contestStatus === "voting") return allPosts;
    return [];
  }, [postsData, contestStatus, user]);

  const posts = useJudgePostOrder(
    visiblePosts,
    contestId,
    isJudgeMode && contestStatus === "voting",
  );
  const { state: voteEditorState, dispatch: dispatchVote, resetFromServer } = useVoteEditor(posts);
  const votes = voteEditorState.votes;
  const judgeAwardSelection = voteEditorState.judgeAward;
  const scoreSortedPosts = useScoreSortedPosts(posts, votes, judgeSortOrder);
  const displayPosts = contestStatus === "voting" && isJudgeMode ? scoreSortedPosts : posts;
  // ----------------------------------------------------
  // コメント状態および追加計算（SWRデータ導出後に配置）
  // ----------------------------------------------------

  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [sessionCommentedPosts, setSessionCommentedPosts] = useState<Record<number, boolean>>({});
  const prefetchedComments = usePrefetchedComments(
    posts,
    results,
    contestStatus ?? "upcoming",
  );

  const toggleComments = (postId: number) =>
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  const handleCommentAdded = (postId: number) =>
    setSessionCommentedPosts((prev) => ({ ...prev, [postId]: true }));
  const handleCommentDeleted = (postId: number) =>
    setSessionCommentedPosts((prev) => ({ ...prev, [postId]: false }));

  useEffect(() => {
    // 結果発表後は contestStatus が変化しないため、監視タイマーは不要。
    // 不要な親コンポーネントの再描画を止め、結果本文のテキスト選択を維持する。
    if (!contest || contestStatus === "closed") return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [contest, contestStatus]);

  const handleVoteChange = (postId: number, newCount: number | null) => {
    dispatchVote({ type: "set-vote", postId, score: newCount });
  };

  const handleJudgeAwardSelect = (postId: number) => {
    dispatchVote({ type: "toggle-judge-award", postId });
  };
  const handleJudgeCommentChange = (val: string) => {
    dispatchVote({ type: "set-judge-comment", comment: val });
  };

  const handleBackupVotes = () => {
    const data = createVoteBackup(contestId, votes, posts, judgeAwardSelection);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    a.download = `netatwi_votes_backup_contest_${contestId}_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseVoteBackup(
          JSON.parse(event.target?.result as string) as unknown,
          contestId,
        );
        if (parsed) {
          setPendingRestoreData(parsed);
          setPendingRestoreFileName(file.name);
          setIsRestoreDialogOpen(true);
        } else {
          throw new Error("Invalid format");
        }
      } catch {
        toast({ title: "エラー", description: "ファイルの読み込みに失敗しました。正しいフォーマットか確認してください。", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const fillUnvotedWithZero = () => {
    dispatchVote({
      type: "fill-unvoted",
      postIds: posts
        .filter((post) => !user || String(post.userId) !== String(user.id))
        .map((post) => post.id),
      score: 0,
    });
    toast({ title: "一括入力", description: "未投票の投稿に0点を入力しました。" });
  };

  const confirmRestoreVotes = () => {
    if (pendingRestoreData) {
      dispatchVote({
        type: "restore",
        state: {
          votes: backupVotesToRecord(pendingRestoreData),
          judgeAward: pendingRestoreData.judgeAwardSelection,
        },
      });
      toast({ title: "成功", description: "投票を復元しました" });
    }
    setIsRestoreDialogOpen(false);
    setPendingRestoreData(null);
    setPendingRestoreFileName("");
  };

  const handleVoteClick = () => {
    if (isVoteDeadlineExceeded) {
      toast({ title: "エラー", description: "終了しました。", variant: "destructive" });
      return;
    }
    handleSubmitVotes();
  };

  const handleSubmitVotes = async () => {
    const result = buildVotePayload({
      posts,
      state: voteEditorState,
      userId: user?.id ?? null,
      isJudgeMode,
      judgeMaxScore: contest?.judgeMaxScore ?? 10,
    });
    if (!result.ok) {
      toast({
        title: "入力内容を確認してください",
        description: getVoteValidationMessage(result.errors[0]),
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingVotes(true);
    try {
      await submitContestVotes(contestId, result.payload);
      await mutatePosts();
      resetFromServer();
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    } catch (requestError) {
      toast({
        title: "エラー",
        description: getApiErrorMessage(requestError, "通信エラーが発生しました。"),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingVotes(false);
    }
  };

  return {
    contestId,
    user,
    refetchUser,
    contestData,
    contestError,
    mutateContest,
    contest,
    contestStatus,
    isPostDeadlineExceeded,
    isVoteDeadlineExceeded,
    sortOrder,
    setSortOrder,
    isSubmittingVotes,
    judgeSortOrder,
    setJudgeSortOrder,
    isJudgeMode,
    isVotePeriod,
    showVoteUI,
    voteUIDisabled,
    showSuccessBanner,
    hideJudgeBanner,
    setHideJudgeBanner,
    isRestoreDialogOpen,
    setIsRestoreDialogOpen,
    pendingRestoreData,
    pendingRestoreFileName,
    restoreFileInputRef,
    sortSentinelRef,
    stickyContainerRef,
    postsData,
    mutatePosts,
    resultsDataRaw,
    loading,
    error,
    results,
    judgeAwardsResults,
    sortedResults,
    totalPosters,
    totalVoters,
    totalJudges,
    userHasVoted,
    posts,
    votes,
    judgeAwardSelection,
    displayPosts,
    openComments,
    setOpenComments,
    sessionCommentedPosts,
    prefetchedComments,
    toggleComments,
    handleCommentAdded,
    handleCommentDeleted,
    handleVoteChange,
    handleJudgeAwardSelect,
    handleJudgeCommentChange,
    handleBackupVotes,
    handleRestoreFileChange,
    fillUnvotedWithZero,
    confirmRestoreVotes,
    handleVoteClick,
  };
}

export type ContestDetailController = ReturnType<typeof useContestDetailController>;
