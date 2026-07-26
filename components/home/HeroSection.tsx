"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function HeroSection() {
  const heroTitleMeasureRef = useRef<HTMLSpanElement | null>(null);
  const heroTaglinesRef = useRef<HTMLDivElement | null>(null);
  const [heroTitleFontSize, setHeroTitleFontSize] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const updateHeroTitleFontSize = () => {
      const measureEl = heroTitleMeasureRef.current;
      const taglinesEl = heroTaglinesRef.current;
      if (!measureEl || !taglinesEl) return;

      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        setHeroTitleFontSize(null);
        return;
      }

      const baseWidth = measureEl.offsetWidth;
      const taglinesWidth = taglinesEl.offsetWidth;
      if (baseWidth === 0 || taglinesWidth === 0) return;

      const baseFontSize = parseFloat(
        window.getComputedStyle(measureEl).fontSize || "0",
      );
      if (!baseFontSize) return;

      const targetWidth = taglinesWidth * 0.9;
      const ratio = Math.min(targetWidth / baseWidth, 1);
      const nextFontSize = baseFontSize * ratio;

      setHeroTitleFontSize((prev) => {
        if (prev === null && Math.abs(ratio - 1) < 0.01) return prev;
        if (prev !== null && Math.abs(prev - nextFontSize) < 0.5) return prev;
        return nextFontSize;
      });
    };

    updateHeroTitleFontSize();
    document.fonts?.ready?.then(updateHeroTitleFontSize);
    window.addEventListener("resize", updateHeroTitleFontSize);
    return () => window.removeEventListener("resize", updateHeroTitleFontSize);
  }, []);

  return (
    <section className="relative z-0 flex h-[calc(100vh-4rem)] min-h-[640px] items-center bg-white dark:bg-black">
      {/* Top Left Separator */}
      <svg
        className="pointer-events-none absolute left-0 top-0 z-10 w-[50vw] lg:w-[33.333vw]"
        viewBox="0 0 100 26.8"
      >
        <polygon points="0,0 100,0 0,26.8" fill="#1DA1F2" />
      </svg>

      {/* Bottom Right Separator (Triangle) */}
      <svg
        className="pointer-events-none absolute right-0 z-10 w-[66.666vw] lg:min-w-[700px] lg:w-[50vw]"
        style={{ top: "100%", transform: "translateY(-34.45%)" }}
        viewBox="0 0 89.18 84.53"
      >
        <path
          d="M 89.18 0 L 5.02 22.56 A 6.8 6.8 0 0 0 3.38 35.0 L 89.18 84.53 Z"
          fill="#1DA1F2"
        />
      </svg>

      {/* Main Content */}
      <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-end px-6 pb-24 md:px-10">
        <div className="w-full">
          <h1
            className="relative leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            <span
              ref={heroTitleMeasureRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-[2.25rem] font-normal text-black dark:text-white opacity-0 md:text-4xl"
            >
              ネタツイグランプリ
            </span>
            <span
              className="block whitespace-nowrap text-[2.25rem] font-normal text-black dark:text-white md:text-4xl"
              style={
                heroTitleFontSize
                  ? { fontSize: `${heroTitleFontSize}px` }
                  : undefined
              }
            >
              ネタツイグランプリ
            </span>
            <div
              ref={heroTaglinesRef}
              className="mt-4 inline-flex flex-col items-start"
            >
              <span className="block text-[3.25rem] font-black leading-none text-black/80 dark:text-white md:text-7xl lg:text-[5.25rem]">
                <span className="block md:inline">Tiny</span>
                <span className="block md:inline md:ml-2">Tweets.</span>
              </span>
              <span className="mt-2 block text-[3.25rem] font-black leading-none text-black/80 dark:text-white md:text-7xl lg:text-[5.25rem]">
                <span className="block md:inline">Huge</span>
                <span className="block md:inline md:ml-2">Laughs.</span>
              </span>
            </div>
          </h1>
          <Link
            href="/venue"
            className="mt-7 inline-flex items-center rounded-full bg-[#1DA1F2] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1788cc]"
          >
            参加する
          </Link>
        </div>
      </div>
    </section>
  );
}
