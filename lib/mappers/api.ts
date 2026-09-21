import type {
  CommentDto,
  ContestPostsResponseDto,
  ContestResultsResponseDto,
  ContestDto,
  ContestsResponseDto,
  NotificationDto,
  PostDto,
  RankedUserDto,
  ProfileResponseDto,
  ResultPostDto,
  UserDto,
  UserSummaryDto,
} from "@/types/api";
import type {
  Comment,
  Contest,
  ContestPosts,
  ContestResults,
  ContestsByStatus,
  ContestSummary,
  Notification,
  Post,
  RankedUser,
  ResultPost,
  User,
  UserProfile,
  UserSummary,
} from "@/types/domain";

export const mapUserSummary = (dto: UserSummaryDto): UserSummary => ({
  name: dto.name,
  screenName: dto.screen_name,
  profileImageUrl: dto.profile_image_url,
});

export const mapUser = (dto: UserDto): User => ({
  id: dto.id,
  ...mapUserSummary(dto),
  isAdmin: dto.isAdmin ?? false,
});

export const mapContestSummary = (dto: ContestDto): ContestSummary => ({
  id: dto.id,
  name: dto.name,
  theme: dto.theme,
  hasTheme: dto.hasTheme ?? dto.theme !== null,
  hasQualifier: dto.hasQualifier ?? false,
  type: dto.type ?? "grandprix",
  parentContestId: dto.parentContestId ?? null,
  startTime: dto.startTime,
  endTime: dto.endTime,
  votingEndTime: dto.votingEndTime,
  totalPosters: dto.totalPosters ?? dto.postCount ?? 0,
  totalVoters: dto.totalVoters ?? 0,
  totalJudges: dto.totalJudges ?? 0,
});

export const mapContest = (dto: ContestDto): Contest => ({
  ...mapContestSummary(dto),
  startTime: dto.startTime ?? "",
  endTime: dto.endTime ?? "",
  votingEndTime: dto.votingEndTime ?? "",
  scoringMethod: dto.scoringMethod ?? "both",
  imageRule: dto.imageRule ?? "optional",
  isVotingVisible: dto.isVotingVisible ?? true,
  advancementNumerator: dto.advancementNumerator ?? null,
  advancementDenominator: dto.advancementDenominator ?? null,
  judgeAwardAdvancement: dto.judgeAwardAdvancement ?? false,
  generalVoteWeight: dto.generalVoteWeight ?? 50,
  judgeMaxScore: dto.judgeMaxScore ?? 10,
  isAdvancedToFinal: dto.isAdvancedToFinal ?? null,
  resultCommentTop: dto.resultCommentTop ?? null,
  resultCommentBottom: dto.resultCommentBottom ?? null,
  postCount: dto.postCount ?? dto.totalPosters ?? 0,
});

export const mapContestsResponse = (dto: ContestsResponseDto): ContestsByStatus => ({
  ongoing: dto.ongoing.map(mapContestSummary),
  voting: dto.voting.map(mapContestSummary),
  upcoming: dto.upcoming.map(mapContestSummary),
  closed: dto.closed.map(mapContestSummary),
  latestResult: dto.latestResult
    ? {
        contestId: dto.latestResult.contest_id,
        contestName: dto.latestResult.contest_name,
        theme: dto.latestResult.theme,
        totalPosters: dto.latestResult.totalPosters,
        totalVoters: dto.latestResult.totalVoters,
        totalJudges: dto.latestResult.totalJudges,
      }
    : null,
});

export const mapPost = (dto: PostDto): Post => ({
  id: dto.id,
  content: dto.content,
  images: dto.images ?? [],
  createdAt: dto.created_at,
  userId: dto.user_id,
  myVotes: dto.myVotes ?? null,
  myJudgeAward: dto.myJudgeAward ?? false,
  myJudgeComment: dto.myJudgeComment ?? null,
  hasCommented: dto.hasCommented ?? false,
  commentCount: dto.commentCount ?? dto.comment_count ?? 0,
});

export const mapResultPost = (dto: ResultPostDto): ResultPost => ({
  id: dto.post_id,
  content: dto.content,
  images: dto.images ?? [],
  createdAt: dto.created_at,
  score: dto.score ?? 0,
  rank: dto.rank ?? null,
  commentCount: dto.commentCount ?? dto.comment_count ?? 0,
  hasCommented: dto.hasCommented ?? false,
  user: mapUserSummary(dto.user),
  voters: (dto.voters ?? []).map((voter) => ({
    ...mapUserSummary(voter),
    count: voter.count,
    isJudge: voter.is_judge,
  })),
  bookmarkCount: dto.bookmarkCount ?? 0,
  isBookmarked: dto.isBookmarked ?? false,
  awards: dto.awards ?? [],
  contest: dto.contest
    ? {
        id: dto.contest.id,
        name: dto.contest.name,
        theme: dto.contest.theme ?? null,
        scoringMethod: dto.contest.scoringMethod,
      }
    : undefined,
  myVotes: dto.myVotes ?? null,
  isAdvanced: dto.is_advanced ?? false,
});

export const mapComment = (dto: CommentDto): Comment => ({
  id: dto.id,
  userId: dto.user_id,
  postId: dto.post_id,
  content: dto.content,
  isJudge: dto.is_judge,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
  user: mapUserSummary(dto.user),
});

export const mapNotification = (dto: NotificationDto): Notification => ({
  id: dto.id,
  type: dto.type,
  isRead: dto.is_read,
  postId: dto.post_id,
  contestId: dto.contest_id,
  createdAt: dto.created_at,
  sender: dto.sender ? mapUserSummary(dto.sender) : null,
  post: dto.post,
  comment: dto.comment ?? null,
  contest: dto.contest,
});

export const mapRankedUser = (dto: RankedUserDto): RankedUser => ({
  id: dto.id,
  twitterId: dto.twitter_id,
  ...mapUserSummary(dto),
  stats: {
    grandPrixFirst: dto.stats.gp_1st,
    grandPrixSecond: dto.stats.gp_2nd,
    grandPrixThird: dto.stats.gp_3rd,
    dailyFirst: dto.stats.daily_1st,
    dailySecond: dto.stats.daily_2nd,
    dailyThird: dto.stats.daily_3rd,
    judgeAwards: dto.stats.judge_awards,
  },
});

export const mapProfile = (dto: ProfileResponseDto): UserProfile => ({
  user: mapUser(dto.user),
  posts: dto.posts.map(mapResultPost),
  bookmarks: dto.bookmarks.map(mapResultPost),
  likes: dto.likes.map(mapResultPost),
});

export const mapContestPosts = (dto: ContestPostsResponseDto): ContestPosts => ({
  posts: dto.posts.map(mapPost),
  userHasVotedInContest: dto.userHasVotedInContest,
  totalPosters: dto.totalPosters,
});

export const mapContestResults = (dto: ContestResultsResponseDto): ContestResults => ({
  results: dto.results.map(mapResultPost),
  judgeAwards: dto.judgeAwards.map((award) => ({
    judge: mapUserSummary(award.judge),
    comment: award.comment,
    post: {
      id: award.post.post_id,
      content: award.post.content,
      images: award.post.images ?? [],
      createdAt: award.post.created_at,
      user: mapUserSummary(award.post.user),
    },
  })),
  totalPosters: dto.totalPosters,
  totalVoters: dto.totalVoters,
  totalJudges: dto.totalJudges,
});
