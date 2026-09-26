"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function useThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";
  return { mounted, isDark, toggleTheme: () => setTheme(isDark ? "light" : "dark") };
}
