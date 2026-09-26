"use client";

import { useEffect, useState } from "react";
import { getNotifications, markNotificationsRead } from "@/lib/api/endpoints/notifications";
import type { Notification } from "@/types/domain";

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setIsLoading(true);
    getNotifications()
      .then(async (items) => {
        if (!active) return;
        setNotifications(items);
        if (items.some((item) => !item.isRead)) await markNotificationsRead();
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { notifications, isLoading };
}
