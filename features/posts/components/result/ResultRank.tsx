import { Crown } from "lucide-react";

export function ResultRank({ rank, score }: { rank: number | null; score: number }) {
  const badge = (() => {
    if (!rank) return null;
    if (rank === 1) return <div className="flex items-center text-yellow-500 font-bold text-xl"><Crown className="w-6 h-6 mr-1.5 fill-current" /> 1位</div>;
    if (rank === 2) return <div className="flex items-center text-gray-400 dark:text-gray-600 font-bold text-xl"><Crown className="w-6 h-6 mr-1.5 fill-current" /> 2位</div>;
    if (rank === 3) return <div className="flex items-center text-amber-600 font-bold text-xl"><Crown className="w-6 h-6 mr-1.5 fill-current" /> 3位</div>;
    return (
      <div className="flex items-center text-gray-600 dark:text-gray-400 font-bold text-xl">
        {rank}位
      </div>
    );
  })();

  return (
    <div className="flex items-center gap-3 mb-3">
      {badge}
      <span className="text-lg font-bold text-gray-600 dark:text-gray-400 ml-1">{score}pt</span>
    </div>
  );
}
