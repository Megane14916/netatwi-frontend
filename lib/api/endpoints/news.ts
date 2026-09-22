import type { NewsItem } from "@/types/domain";
import type { NewsItemDto } from "@/types/api";
import { browserRequest } from "../browser";
import { validateNews } from "../validation";

export const mapNewsItem = (dto: NewsItemDto): NewsItem => ({
  id: dto.id,
  tweetId: dto.tweet_id,
  createdAt: dto.created_at ?? null,
});

export const getNews = async (): Promise<NewsItem[]> =>
  (await browserRequest("/api/news", { validate: validateNews })).map(mapNewsItem);
