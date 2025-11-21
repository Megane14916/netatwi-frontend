'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  targetTime: string | null;
  status: 'upcoming' | 'ongoing' | 'voting' | 'qualifier_ongoing' | 'qualifier_voting';
}

export default function Countdown({ targetTime, status }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft('時間未定');
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(targetTime) - +new Date();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);

        let timer = '';
        if (days > 0) timer += `${days}日`;
        if (hours > 0 || days > 0) timer += `${hours}時間`;
        timer += `${minutes}分`;
        setTimeLeft(timer);
      } else {
        switch (status) {
          case 'upcoming': setTimeLeft('開催中'); break;
          case 'qualifier_ongoing': setTimeLeft('予選投票受付中'); break;
          case 'ongoing': setTimeLeft('投票受付中'); break;
          case 'qualifier_voting': setTimeLeft('決勝準備中'); break;
          case 'voting': setTimeLeft('終了'); break;
          default: setTimeLeft('終了');
        }
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000 * 30);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetTime, status]);

  return <span>{timeLeft}</span>;
}