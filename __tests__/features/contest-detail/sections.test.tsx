import { render, screen } from "@testing-library/react";
import { ContestPostingSection } from "@/features/contest-detail/components/ContestPostingSection";
import { ContestResultsSection } from "@/features/contest-detail/components/ContestResultsSection";
import { ContestVotingSection } from "@/features/contest-detail/components/ContestVotingSection";
import type { Contest } from "@/types/domain";

jest.mock("@/components/venue/PostForm", () =>
  function MockPostForm() {
    return <div>投稿フォーム</div>;
  },
);

const contest: Contest = {
  id: 7,
  name: "テスト大会",
  theme: null,
  hasTheme: false,
  hasQualifier: false,
  type: "daily",
  parentContestId: null,
  startTime: "2026-01-01T10:00:00.000Z",
  endTime: "2026-01-01T11:00:00.000Z",
  votingEndTime: "2026-01-01T12:00:00.000Z",
  totalPosters: 0,
  totalVoters: 0,
  totalJudges: 0,
  scoringMethod: "general",
  imageRule: "optional",
  isVotingVisible: false,
  advancementNumerator: null,
  advancementDenominator: null,
  judgeAwardAdvancement: false,
  generalVoteWeight: 1,
  judgeMaxScore: 10,
  isAdvancedToFinal: null,
  resultCommentTop: null,
  resultCommentBottom: null,
  postCount: 0,
};

describe("contest detail sections", () => {
  it("shows the upcoming state without mounting the post form", () => {
    render(<ContestPostingSection contest={contest} status="upcoming" onPostSuccess={jest.fn()} />);
    expect(screen.getByText("投稿開始までしばらくお待ちください。")).toBeInTheDocument();
    expect(screen.queryByText("投稿フォーム")).not.toBeInTheDocument();
  });

  it("mounts the single PostForm during the ongoing state", () => {
    render(<ContestPostingSection contest={contest} status="ongoing" onPostSuccess={jest.fn()} />);
    expect(screen.getByText("投稿フォーム")).toBeInTheDocument();
  });

  it("hides voting posts when the user has no viewing permission", () => {
    render(
      <ContestVotingSection
        contest={contest}
        posts={[]}
        user={null}
        access={{
          canSubmitPost: false,
          canViewVotingPosts: false,
          canVote: false,
          canJudgeLogin: false,
        }}
        isJudgeMode={false}
        isVoteDeadlineExceeded={false}
        isLoading={false}
        userHasVoted={false}
        onPostsChanged={jest.fn()}
      />,
    );
    expect(screen.getByText("現在投票期間中のため、投稿は非公開です。")).toBeInTheDocument();
  });

  it("shows the explicit result aggregation state", () => {
    render(
      <ContestResultsSection
        contest={contest}
        data={{ results: [], judgeAwards: [], totalPosters: 0, totalVoters: 0, totalJudges: 0 }}
        state="aggregating"
        currentUser={null}
      />,
    );
    expect(screen.getByText("現在、結果を集計中です")).toBeInTheDocument();
  });
});
