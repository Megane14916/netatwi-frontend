"use client";

import { Loader2 } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ContestHeaderSection } from "@/features/contest-detail/components/ContestHeaderSection";
import { ContestPostingSection } from "@/features/contest-detail/components/ContestPostingSection";
import { ContestResultsSection } from "@/features/contest-detail/components/ContestResultsSection";
import { ContestVotingSection } from "@/features/contest-detail/components/ContestVotingSection";
import { useContestDetail } from "@/features/contest-detail/hooks/useContestDetail";
import { getContestAccess } from "@/features/contest-detail/model/contestStatus";

const parseContestId = (value: string | string[] | undefined): number | null => {
  if (typeof value !== "string") return null;
  const contestId = Number(value);
  return Number.isInteger(contestId) && contestId > 0 ? contestId : null;
};

const PageLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
    <Loader2 className="h-8 w-8 animate-spin text-[#1DA1F2]" />
  </div>
);

export default function VenueDetailPage() {
  const params = useParams<{ id: string }>();
  const contestId = parseContestId(params?.id);
  const { user, judgeContests, refetchUser } = useAuth();
  const detail = useContestDetail(contestId);

  if (contestId === null || detail.pageState === "not-found") return notFound();
  if (detail.pageState === "loading") return <PageLoading />;
  if (detail.pageState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-red-500 dark:bg-black">
        データの取得に失敗しました。
      </div>
    );
  }
  if (!detail.contest || !detail.timing) return notFound();

  const { contest, timing } = detail;
  const isJudgeMode = judgeContests.includes(contestId);
  const access = getContestAccess({
    status: timing.status,
    scoringMethod: contest.scoringMethod,
    isVotingVisible: contest.isVotingVisible,
    isAuthenticated: Boolean(user),
    isJudge: isJudgeMode,
  });

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-white text-black dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-[280px] w-full select-none overflow-hidden bg-[linear-gradient(15deg,#1DA1F2,#70c8f7)] md:h-[320px]">
        <div className="absolute inset-0 flex -rotate-[15deg] scale-150 items-center justify-center text-6xl font-black tracking-widest text-white opacity-[0.07]">
          NETATWEET GRANDPRIX
        </div>
      </div>

      <main className="container relative z-20 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-10">
        <ContestHeaderSection
          contest={contest}
          contestStatus={timing.status}
          timing={timing}
          access={access}
          isJudgeMode={isJudgeMode}
          onJudgeLogin={async () => {
            await refetchUser();
            await detail.mutateContest();
            await detail.mutatePosts();
          }}
        />

        <ContestPostingSection
          contest={contest}
          status={timing.status}
          onPostSuccess={() => void detail.mutatePosts()}
        />

        {timing.status === "voting" && (
          <ContestVotingSection
            contest={contest}
            posts={detail.posts}
            user={user}
            access={access}
            isJudgeMode={isJudgeMode}
            isVoteDeadlineExceeded={timing.isVoteDeadlineExceeded}
            isLoading={!detail.postsData}
            userHasVoted={detail.postsData?.userHasVotedInContest ?? false}
            onPostsChanged={detail.mutatePosts}
          />
        )}

        {timing.status === "closed" && (
          <ContestResultsSection
            contest={contest}
            data={detail.resultsData}
            state={detail.resultsState}
            currentUser={user}
          />
        )}
      </main>
    </div>
  );
}
