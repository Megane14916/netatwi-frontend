"use client";

import { useState, useEffect } from "react";
import { Clock3 } from "lucide-react";

interface CountdownTimerProps {
  deadline: string | null;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    if (!deadline) {
      setRemainingTime(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        setRemainingTime("締切済み");
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemainingTime(h > 0 ? `${h}時間${m}分${s}秒` : `${m}分${s}秒`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!remainingTime) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Clock3 className="h-4 w-4 text-[#1DA1F2]" />
      残り時間:{" "}
      <span className="font-bold text-[#1DA1F2]">{remainingTime}</span>
    </span>
  );
}
