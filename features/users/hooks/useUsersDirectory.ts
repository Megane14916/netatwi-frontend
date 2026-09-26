"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUsers, type UsersPage } from "@/lib/api/endpoints/users";
import type { RankedUser } from "@/types/domain";

interface UsersCacheEntry extends Pick<UsersPage, "page" | "totalPages"> {
  users: RankedUser[];
}

export function useUsersDirectory() {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const cache = useRef(new Map<string, UsersCacheEntry>());

  const load = useCallback(async (query: string, requestedPage: number) => {
    const key = `${query}\u0000${requestedPage}`;
    const cached = cache.current.get(key);
    if (cached) {
      setUsers(cached.users);
      setTotalPages(cached.totalPages);
      setPage(cached.page);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getUsers(query, requestedPage);
      const entry = {
        users: response.users,
        totalPages: response.totalPages,
        page: response.page,
      };
      cache.current.set(key, entry);
      setUsers(entry.users);
      setTotalPages(entry.totalPages);
      setPage(entry.page);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void load(searchQuery, page), 300);
    return () => clearTimeout(timeout);
  }, [load, page, searchQuery]);

  const changeSearch = (query: string) => {
    setIsLoading(true);
    setSearchQuery(query);
    setPage(1);
  };
  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setIsLoading(true);
    setPage(nextPage);
  };

  return { users, searchQuery, page, totalPages, isLoading, changeSearch, changePage };
}
