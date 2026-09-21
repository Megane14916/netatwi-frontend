import type { ContestType, ImageRule, NotificationType, ScoringMethod } from "@/types/domain";

export interface UserSummaryDto {
  name: string;
  screen_name: string;
  profile_image_url: string | null;
}

export interface UserDto extends UserSummaryDto {
  id: number;
  isAdmin?: boolean;
}

export interface CurrentUserResponseDto {
  logged_in: boolean;
  user?: UserDto;
  judge_contests?: number[];
}

export interface ContestDto {
  id: number;
  name: string;
  theme: string | null;
  hasTheme?: boolean;
  hasQualifier?: boolean;
  type?: ContestType;
  parentContestId?: number | null;
  startTime: string | null;
  endTime: string | null;
  votingEndTime: string | null;
  totalPosters?: number;
  totalVoters?: number;
  totalJudges?: number;
  scoringMethod?: ScoringMethod;
  imageRule?: ImageRule;
  isVotingVisible?: boolean;
  advancementNumerator?: number | null;
  advancementDenominator?: number | null;
  judgeAwardAdvancement?: boolean;
  generalVoteWeight?: number;
  judgeMaxScore?: number;
  isAdvancedToFinal?: boolean | null;
  resultCommentTop?: string | null;
  resultCommentBottom?: string | null;
  postCount?: number;
}

export interface LatestContestResultDto {
  contest_id: number;
  contest_name: string;
  theme: string | null;
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

export interface ContestsResponseDto {
  ongoing: ContestDto[];
  voting: ContestDto[];
  upcoming: ContestDto[];
  closed: ContestDto[];
  latestResult?: LatestContestResultDto | null;
}

export interface PostDto {
  id: number;
  content: string;
  images?: string[] | null;
  created_at: string;
  user_id: number;
  myVotes?: number | null;
  myJudgeAward?: boolean;
  myJudgeComment?: string | null;
  hasCommented?: boolean;
  comment_count?: number;
  commentCount?: number;
}

export interface ResultPostDto {
  post_id: number;
  content: string;
  images?: string[] | null;
  created_at: string;
  score?: number;
  rank?: number | null;
  comment_count?: number;
  commentCount?: number;
  hasCommented?: boolean;
  user: UserSummaryDto;
  voters?: Array<UserSummaryDto & { count: number; is_judge: boolean }>;
  bookmarkCount?: number;
  isBookmarked?: boolean;
  awards?: string[];
  contest?: { id: number; name: string; theme?: string | null; scoringMethod?: string };
  myVotes?: number | null;
  is_advanced?: boolean;
}

export interface JudgeAwardDto {
  judge: UserSummaryDto;
  comment: string | null;
  post: {
    post_id: number;
    content: string;
    images?: string[] | null;
    created_at: string;
    user: UserSummaryDto;
  };
}

export interface ContestPostsResponseDto {
  posts: PostDto[];
  userHasVotedInContest: boolean;
  totalPosters: number;
}

export interface ContestResultsResponseDto {
  results: ResultPostDto[];
  judgeAwards: JudgeAwardDto[];
  totalPosters: number;
  totalVoters: number;
  totalJudges: number;
}

export interface CommentDto {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  is_judge: boolean;
  created_at: string;
  updated_at: string;
  user: UserSummaryDto;
}

export interface NotificationDto {
  id: number;
  type: NotificationType;
  is_read: boolean;
  post_id: number | null;
  contest_id: number | null;
  created_at: string;
  sender: UserSummaryDto | null;
  post: { content: string } | null;
  comment?: { content: string | null } | null;
  contest: { name: string; type: ContestType } | null;
}

export interface UserStatsDto {
  gp_1st: number;
  gp_2nd: number;
  gp_3rd: number;
  daily_1st: number;
  daily_2nd: number;
  daily_3rd: number;
  judge_awards: number;
}

export interface RankedUserDto extends UserSummaryDto {
  id: number;
  twitter_id: string;
  stats: UserStatsDto;
}

export interface UsersResponseDto {
  users: RankedUserDto[];
  page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProfileResponseDto {
  user: UserDto;
  posts: ResultPostDto[];
  bookmarks: ResultPostDto[];
  likes: ResultPostDto[];
}

export type CommentsByPostDto = Record<string, CommentDto[]>;
