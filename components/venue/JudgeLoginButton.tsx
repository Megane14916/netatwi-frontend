'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface JudgeLoginButtonProps {
  contestId: number;
  contestName: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function JudgeLoginButton({ contestId, contestName }: JudgeLoginButtonProps) {
  const { user, refetchUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ログインしていない場合はボタンを表示しない
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/contests/${contestId}/judge/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include', // 認証に必要
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '認証に失敗しました。');
      }
      await refetchUser();
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setShowModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-1 text-center bg-yellow-700/50 hover:bg-yellow-600/50 text-yellow-300 font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center"
      >
        <KeyRound className="h-4 w-4 mr-1.5" />
        審査員として投票
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-sm relative shadow-xl border border-gray-700">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-2 text-center">{contestName}</h2>
            <p className="text-sm text-gray-400 mb-4 text-center">審査員用パスワードを入力してください</p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 mb-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="パスワード"
              />
              {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50"
              >
                {isLoading ? '認証中...' : '認証する'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}