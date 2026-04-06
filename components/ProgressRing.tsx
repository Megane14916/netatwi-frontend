'use client';

import React from 'react';

interface ProgressRingProps {
  permillage: number;
  remaining: number;
}

/**
 * X(Twitter)風のプログレスリングコンポーネント
 * - 文字数の使用率を円形で表示
 * - 残り20文字以下で黄色、超過で赤色に変化
 */
const ProgressRing: React.FC<ProgressRingProps> = ({ permillage, remaining }) => {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  // 1000分率なので /1000
  const progress = Math.min(permillage / 1000, 1);
  const dashoffset = circumference - progress * circumference;

  let color = 'text-blue-500'; // 通常
  if (remaining <= 20 && remaining > 0) color = 'text-yellow-500'; // 残り20文字以下
  if (remaining <= 0) color = 'text-red-500'; // 超過

  return (
    <div className="relative flex items-center justify-center w-8 h-8 mr-2">
      <svg className="transform -rotate-90 w-6 h-6">
        <circle
          className="text-gray-700"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="12"
          cy="12"
        />
        <circle
          className={`${color} transition-all duration-300 ease-in-out`}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="12"
          cy="12"
        />
      </svg>
      {remaining <= 20 && (
        <span className={`absolute text-[10px] font-bold ${remaining < 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {remaining}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
