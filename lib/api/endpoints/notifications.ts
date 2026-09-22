import { mapNotification } from "@/lib/mappers/api";
import type { Notification } from "@/types/domain";
import { browserRequest } from "../browser";
import { asRecord, validateNotifications } from "../validation";

export const getNotifications = async (): Promise<Notification[]> =>
  (await browserRequest("/api/notifications", { validate: validateNotifications })).map(mapNotification);

export const markNotificationsRead = (): Promise<unknown> =>
  browserRequest("/api/notifications/read", { method: "POST" });

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await browserRequest<unknown>("/api/notifications/unread-count");
  const record = asRecord(response, "unread notifications response");
  if (typeof record.unread_count !== "number") throw new Error("unread_count must be a number");
  return record.unread_count;
};
