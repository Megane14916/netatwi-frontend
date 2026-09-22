'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserListRow } from '@/components/UserListRow';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { mapRankedUser } from '@/lib/mappers/api';
import type { UsersResponseDto } from '@/types/api';
import type { RankedUser } from '@/types/domain';

interface UsersPageCacheEntry {
  users: RankedUser[];
  totalPages: number;
  page: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const cache = useRef<Record<string, UsersPageCacheEntry>>({});

  const fetchUsers = useCallback(async (q: string, p: number) => {
    const cacheKey = `${q}_${p}`;
    if (cache.current[cacheKey]) {
      setUsers(cache.current[cacheKey].users);
      setTotalPages(cache.current[cacheKey].totalPages);
      setPage(cache.current[cacheKey].page);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/users?q=${encodeURIComponent(q)}&page=${p}`);
      if (res.ok) {
        const data = (await res.json()) as UsersResponseDto;
        const mappedUsers = data.users.map(mapRankedUser);
        setUsers(mappedUsers);
        setTotalPages(data.total_pages);
        setPage(data.page);
        
        cache.current[cacheKey] = {
          users: mappedUsers,
          totalPages: data.total_pages,
          page: data.page
        };
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(searchQuery, page);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, page, fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setIsLoading(true);
      setPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setIsLoading(true);
      setPage((p) => p + 1);
    }
  };

  const renderPageButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => {
            setIsLoading(true);
            setPage(i);
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
            page === i 
              ? 'bg-[#1DA1F2] text-white' 
              : 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white py-12 px-6 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-[#1DA1F2]" />
            <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">ユーザー</h1>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-600" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 focus:border-[#1DA1F2] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 transition-all text-sm font-medium text-black dark:text-white bg-white dark:bg-black"
              placeholder="ユーザー名やIDで検索..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-800 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0"></div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-1 sm:mt-0"></div>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-end gap-3 md:gap-4 mt-2 md:mt-0">
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">
              ユーザーが見つかりませんでした。
            </div>
          ) : (
            users.map((user, index) => (
              <UserListRow key={user.id} user={user} index={index} />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-3 md:gap-4 flex-wrap">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900 text-black dark:text-white hover:bg-[#1DA1F2] hover:text-white disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-black transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {renderPageButtons()}
            </div>

            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900 text-black dark:text-white hover:bg-[#1DA1F2] hover:text-white disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-black transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
