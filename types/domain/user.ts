export interface UserSummary {
  name: string;
  screenName: string;
  profileImageUrl: string | null;
}

export interface User extends UserSummary {
  id: number;
  isAdmin: boolean;
}

export interface UserStats {
  grandPrixFirst: number;
  grandPrixSecond: number;
  grandPrixThird: number;
  dailyFirst: number;
  dailySecond: number;
  dailyThird: number;
  judgeAwards: number;
}

export interface RankedUser extends UserSummary {
  id: number;
  twitterId: string;
  stats: UserStats;
}
