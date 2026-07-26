"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import useSWR from "swr";
import dynamic from "next/dynamic";

const DynamicTweet = dynamic(() => import("@/components/DynamicTweet"), {
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
  ),
});

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

function TweetItem({ news }: { news: { id: number; tweet_id: string } }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // 一度表示されたら監視を終了
        }
      },
      { rootMargin: "400px" } // 画面に入る400px前で読み込み開始
    );
    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="snap-start flex-none w-[280px] md:w-[400px] flex justify-center"
    >
      <div className="w-full max-w-full pointer-events-none select-none">
        {isVisible ? (
          <DynamicTweet id={news.tweet_id} />
        ) : (
          <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
        )}
      </div>
    </div>
  );
}

export default function NewsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const {
    data: newsList = [],
    error: newsError,
    isLoading: newsLoading,
  } = useSWR<{ id: number; tweet_id: string }[]>("/api/news", fetcher);

  // ツイート埋め込み等によるスクロール位置のバグを防ぐため初期状態では左端に戻す
  useEffect(() => {
    if (scrollRef.current && newsList.length > 0) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [newsList]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section id="news" className="bg-white dark:bg-black py-24 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-center justify-between px-6 md:px-10">
          <h2 className="text-2xl font-bold text-black dark:text-white md:text-[40px]">
            最新のニュース
          </h2>
          <a
            href="https://x.com/_n1gp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center rounded-full bg-[#1DA1F2] px-4 py-2 md:px-8 md:py-3 text-xs md:text-sm font-bold text-white transition hover:bg-[#1788cc]"
          >
            公式Xへ
            <ExternalLink className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
          </a>
        </div>

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex overflow-x-auto gap-6 pb-8 snap-mandatory scroll-pl-6 md:scroll-pl-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDragging ? "snap-none cursor-grabbing" : "snap-x cursor-grab"}`}
        >
          {/* 左端の余白 (スナップ用) */}
          <div className="snap-start flex-none w-0 md:w-4"></div>

          {newsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="snap-start flex-none w-[280px] md:w-[400px]">
                  <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                </div>
              ))}
            </>
          ) : newsError ? (
            <p className="text-black dark:text-white">エラーが発生しました</p>
          ) : newsList.length === 0 ? (
            <p className="text-black dark:text-white">ニュースはありません</p>
          ) : (
            newsList.map((news) => <TweetItem key={news.id} news={news} />)
          )}

          {/* 右端の余白 */}
          <div className="flex-none w-0 md:w-4"></div>
        </div>
      </div>
    </section>
  );
}
