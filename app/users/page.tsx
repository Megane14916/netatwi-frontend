'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserListRow } from '@/components/UserListRow';
import { Search, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
      const res = await fetch(`${apiUrl}/api/users?q=${encodeURIComponent(q)}&page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.total_pages);
        setPage(data.page);
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
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const renderPageButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
            page === i 
              ? 'bg-[#1DA1F2] text-white' 
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="min-h-screen bg-white text-black py-12 px-6 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-[#1DA1F2]" />
            <h1 className="text-2xl md:text-3xl font-bold text-black">ユーザー一覧</h1>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:border-[#1DA1F2] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 transition-all text-sm font-medium text-black bg-white"
              placeholder="ユーザー名やIDで検索..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="flex flex-col">
          {isLoading && users.length === 0 ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1DA1F2]" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-medium text-lg">
              ユーザーが見つかりませんでした。
            </div>
          ) : (
            users.map((user: any, index: number) => (
              <UserListRow key={user.id} user={user} index={index} />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-3 md:gap-4 flex-wrap">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-black hover:bg-[#1DA1F2] hover:text-white disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-black transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {renderPageButtons()}
            </div>

            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-black hover:bg-[#1DA1F2] hover:text-white disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-black transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
