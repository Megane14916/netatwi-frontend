import Link from 'next/link';

interface UserStats {
  gp_1st: number;
  gp_2nd: number;
  gp_3rd: number;
  daily_1st: number;
  daily_2nd: number;
  daily_3rd: number;
  judge_awards: number;
}

interface UserProps {
  id: number;
  name: string;
  screen_name: string;
  twitter_id: string;
  profile_image_url: string | null;
  stats: UserStats;
}

export function UserListRow({ user, index }: { user: UserProps; index: number }) {
  const bgClass = index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-950';

  return (
    <Link href={`/profile/${user.screen_name}`} className={`group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 transition-colors duration-200 hover:bg-[#1DA1F2]/5 border-b border-gray-200 dark:border-gray-800 ${bgClass}`}>
      
      {/* Left Side: User Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex-shrink-0">
          {user.profile_image_url ? (
            <img src={user.profile_image_url} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[#1DA1F2]/20" />
          )}
        </div>
        <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h3 className="text-base md:text-lg font-bold text-black dark:text-white truncate">{user.name}</h3>
          <p className="text-xs md:text-sm text-black/60 dark:text-white/60 truncate">@{user.screen_name}</p>
        </div>
      </div>

      {/* Right Side: Stats */}
      <div className="flex flex-row items-start md:items-center justify-end gap-3 md:gap-4 flex-shrink-0 mt-2 md:mt-0">
        {/* GP Stats */}
        <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2">
          <span className="text-[10px] md:text-xs font-bold text-black/50 dark:text-white/50">グランプリ</span>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-0.5 md:gap-2">
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none">
              🥇 {user.stats.gp_1st}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none">
              🥈 {user.stats.gp_2nd}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none">
              🥉 {user.stats.gp_3rd}
            </span>
          </div>
        </div>
        
        {/* Daily Stats */}
        <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2 border-l border-gray-300 dark:border-gray-700 pl-3 md:pl-4">
          <span className="text-[10px] md:text-xs font-bold text-black/50 dark:text-white/50">日めくり</span>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-0.5 md:gap-2">
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none">
              🥇 {user.stats.daily_1st}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none">
              🥈 {user.stats.daily_2nd}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none">
              🥉 {user.stats.daily_3rd}
            </span>
          </div>
        </div>

        {/* Judge Stats */}
        <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2 border-l border-gray-300 dark:border-gray-700 pl-3 md:pl-4 h-full">
          <span className="text-[10px] md:text-xs font-bold text-black/50 dark:text-white/50">審査員賞</span>
          <span className="flex items-center gap-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-black dark:text-white leading-none mt-1 md:mt-0">
            🏵️ {user.stats.judge_awards}
          </span>
        </div>
      </div>
    </Link>
  );
}
