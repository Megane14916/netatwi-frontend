"use client";

import useSWR from "swr";
import { getNews } from "@/lib/api/endpoints/news";

const newsKey = "/api/news";

export const useNews = () => useSWR(newsKey, getNews);
