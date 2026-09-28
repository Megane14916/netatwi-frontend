"use client";

import { useEffect, useRef, useState } from "react";

export function useHeaderMenu(pathname: string) {
  const [isOpen, setIsOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const desktopButton = desktopRef.current?.previousElementSibling;
      const mobileButton = mobileRef.current?.previousElementSibling;
      if (desktopButton?.contains(target) || mobileButton?.contains(target)) return;
      if (desktopRef.current?.contains(target) || mobileRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const handleNewsClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setIsOpen(false);
    if (pathname !== "/") return;
    event.preventDefault();
    const newsSection = document.getElementById("news");
    if (newsSection) {
      window.scrollTo({
        top: newsSection.getBoundingClientRect().top + window.pageYOffset - 64,
        behavior: "smooth",
      });
    }
    window.history.pushState(null, "", "/#news");
  };

  return {
    isOpen,
    setIsOpen,
    desktopRef,
    mobileRef,
    handleNewsClick,
  };
}
