"use client";

import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/lib/api/endpoints/notifications";

export function useUnreadNotificationCount(enabled: boolean, intervalMs = 600_000) {
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }
    const refresh = async () => {
      if (document.hidden) return;
      try {
        setUnreadCount(await getUnreadNotificationCount());
      } catch (error) {
        console.error(error);
      }
    };
    void refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs]);
  return unreadCount;
}
