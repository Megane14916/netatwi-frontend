"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, ShieldCheck, Trophy } from "lucide-react";

export const GeneralVoteButton = ({
  postId,
  isLiked,
  onToggle,
  disabled,
}: {
  postId: number;
  isLiked: boolean;
  onToggle: (postId: number, val: number | null) => void;
  disabled: boolean;
}) => (
  <button
    onClick={() => onToggle(postId, isLiked ? null : 1)}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-all group ${
      isLiked
        ? "text-pink-500 bg-pink-50 dark:bg-pink-900/40 border border-pink-200 dark:border-pink-800"
        : "text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/40 hover:text-pink-500 border border-transparent hover:border-pink-200 dark:hover:border-pink-800 active:bg-pink-50 dark:active:bg-pink-900/40 active:text-pink-500"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? "fill-current" : ""}`} />
    <span className="text-xs md:text-sm font-bold">{isLiked ? "いいね！" : "いいね"}</span>
  </button>
);

export const JudgeVoteSelector = ({
  postId,
  currentScore,
  onSelect,
  disabled,
  maxScore,
}: {
  postId: number;
  currentScore: number | null;
  onSelect: (postId: number, val: number | null) => void;
  disabled: boolean;
  maxScore: number;
}) => {
  const [inputValue, setInputValue] = useState<string>(
    currentScore !== undefined && currentScore !== null ? String(currentScore) : ""
  );
  const previousScoreRef = useRef(currentScore);

  useEffect(() => {
    if (previousScoreRef.current !== currentScore) {
      setInputValue(currentScore !== undefined && currentScore !== null ? String(currentScore) : "");
      previousScoreRef.current = currentScore;
    }
  }, [currentScore]);

  return (
    <div className="inline-flex flex-col justify-center">
      <div className="flex items-center mb-1 px-1">
        <span className="text-[10px] md:text-xs text-indigo-600 font-bold flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" /> 審査員評価
        </span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2">
        <input
          type="number"
          min="0"
          max={maxScore}
          step="0.1"
          value={inputValue}
          onChange={(e) => {
            let valStr = e.target.value;
            let val = parseFloat(valStr);
            if (!isNaN(val)) {
              if (val > maxScore) {
                valStr = String(maxScore);
                val = maxScore;
              } else if (val < 0) {
                valStr = "0";
                val = 0;
              }
            }
            setInputValue(valStr);
            onSelect(postId, isNaN(val) ? null : val);
          }}
          disabled={disabled}
          className="w-16 md:w-20 text-sm md:text-base bg-white dark:bg-black border border-indigo-200 rounded-lg px-1.5 py-0.5 md:px-2 md:py-1 text-right text-black dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm"
          placeholder="0"
          onFocus={(e) => e.target.select()}
        />
        <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">点</span>
      </div>
    </div>
  );
};

export const JudgeAwardSelector = ({
  postId,
  isSelected,
  onSelect,
  comment,
  onCommentChange,
  disabled,
}: {
  postId: number;
  isSelected: boolean;
  onSelect: (postId: number) => void;
  comment: string;
  onCommentChange: (val: string) => void;
  disabled: boolean;
}) => (
  <div className="mt-2 px-1 border-t border-gray-200 dark:border-gray-800 pt-2 w-full">
    <label
      className={`flex items-center cursor-pointer ${disabled ? "opacity-50" : ""} group`}
    >
      <input
        type="radio"
        name="judgeAward"
        checked={isSelected}
        onChange={() => {
          if (!isSelected) onSelect(postId);
        }}
        onClick={() => {
          if (isSelected) onSelect(postId);
        }}
        disabled={disabled}
        className="w-4 h-4 text-yellow-500 border-gray-300 dark:border-gray-700 focus:ring-yellow-500 flex-shrink-0 cursor-pointer"
      />
      <span
        className={`ml-2 text-xs font-bold flex items-center transition-colors ${isSelected ? "text-yellow-600" : "text-gray-500 dark:text-gray-400 group-hover:text-yellow-600"}`}
      >
        <Trophy className="w-3.5 h-3.5 mr-1" /> 審査員賞に選ぶ
      </span>
    </label>
    {isSelected && (
      <div className="mt-2 w-full animate-fade-in">
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="選評コメントを入力してください..."
          className="w-full bg-white dark:bg-black border border-yellow-300 rounded-lg p-2 text-sm text-black dark:text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm resize-y min-h-[60px]"
          disabled={disabled}
        />
      </div>
    )}
  </div>
);
