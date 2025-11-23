'use client';

import { useState } from 'react';
import { Gavel, Lock, X } from 'lucide-react';

// 型定義に onLoginSuccess を追加
interface JudgeLoginButtonProps {
  contestId: number;
  onLoginSuccess: () => void;
}

export default function JudgeLoginButton({ contestId, onLoginSuccess }: JudgeLoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 相対パスでリクエスト (Next.js Rewrite経由)
      const res = await fetch(`/api/contests/${contestId}/judge/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookieを送信
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsOpen(false);
        setPassword('');
        // 認証成功時に親コンポーネントのコールバックを実行（データ再取得など）
        onLoginSuccess();
      } else {
        const data = await res.json();
        setError(data.error || '認証に失敗しました');
      }
    } catch (err) {
      console.error(err);
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full hover:bg-indigo-600/30 transition-colors text-sm font-medium border border-indigo-500/30"
      >
        <Gavel className="w-4 h-4" />
        審査員として参加
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">審査員認証</h3>
                <p className="text-gray-400 text-sm mt-1">
                  主催者から配布されたパスワードを入力してください
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワード"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '認証中...' : '認証する'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}