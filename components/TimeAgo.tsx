'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ja';

// dayjsのプラグインと言語を設定
dayjs.extend(relativeTime);
dayjs.locale('ja');

/**
 * タイムスタンプを受け取り、"X分前"のような相対時間を動的に更新するコンポーネント
 */
const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  // 最初に表示する相対時間を計算
  const [timeAgo, setTimeAgo] = useState(() => dayjs(timestamp).fromNow());

  useEffect(() => {
    // --- ▼▼▼ ここからが修正点 ▼▼▼ ---
    // 更新間隔を短くして、よりリアルタイムに感じられるようにする
    // 最初の1分間は5秒ごとに更新、その後は1分ごとに更新
    const targetDate = dayjs(timestamp);
    const now = dayjs();
    const diffInSeconds = now.diff(targetDate, 'second');

    let interval = 60000; // デフォルトは1分
    if (diffInSeconds < 60) {
      interval = 5000; // 60秒未満なら5秒ごとに更新
    }
    // --- ▲▲▲ ここまで ▲▲▲ ---

    const intervalId = setInterval(() => {
      setTimeAgo(dayjs(timestamp).fromNow());
    }, interval);

    // コンポーネントが不要になったらタイマーを解除
    return () => clearInterval(intervalId);
  }, [timestamp]); // timestampが変わった場合にも再設定

  return <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">{timeAgo}</span>;
};

export default TimeAgo;

