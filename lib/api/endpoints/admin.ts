import type { AdminCreateContestPayload, AdminManagedContest, AdminUpdateContestPayload } from "@/types/api";
import type { NewsItem } from "@/types/domain";
import { browserRequest } from "../browser";
import { asArray, asRecord, validateNews } from "../validation";
import { mapNewsItem } from "./news";

export const getManagedContests = async (): Promise<AdminManagedContest[]> =>
  asArray(
    await browserRequest<unknown>("/api/admin/contests/management"),
    "managed contests",
  ) as AdminManagedContest[];

export const createContest = async (payload: AdminCreateContestPayload): Promise<number> => {
  const response = await browserRequest<unknown>("/api/admin/contests", {
    method: "POST",
    json: payload,
  });
  const record = asRecord(response, "create contest response");
  if (typeof record.id !== "number") throw new Error("contest id must be a number");
  return record.id;
};

export const updateContest = (
  contestId: number,
  payload: AdminUpdateContestPayload,
): Promise<unknown> =>
  browserRequest(`/api/admin/contests/${contestId}`, {
    method: "PUT",
    json: payload,
  });

export const deleteContest = (contestId: number): Promise<unknown> =>
  browserRequest(`/api/admin/contests/${contestId}`, { method: "DELETE" });

export const getAdminNews = async (): Promise<NewsItem[]> =>
  (await browserRequest("/api/admin/news", { validate: validateNews })).map(mapNewsItem);

export const addNews = (tweetIdOrUrl: string): Promise<unknown> =>
  browserRequest("/api/admin/news", {
    method: "POST",
    json: { tweet_id: tweetIdOrUrl },
  });

export const deleteNews = (newsId: number): Promise<unknown> =>
  browserRequest(`/api/admin/news/${newsId}`, { method: "DELETE" });
