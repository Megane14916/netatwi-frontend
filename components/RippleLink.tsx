"use client";

import { useState } from "react";
import Link from "next/link";

type RippleLinkProps = React.ComponentPropsWithoutRef<typeof Link> & {
  rippleColor?: string;
};

export default function RippleLink({ href, children, className, rippleColor = "bg-gray-400 dark:bg-gray-600", ...props }: RippleLinkProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number; size: number; active: boolean }[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const elem = e.currentTarget;
    const rect = elem.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    setRipples((prev) => [...prev, { x, y, id: Date.now(), size, active: true }]);
  };

  const handlePointerUp = () => {
    setRipples((prev) => prev.map((r) => ({ ...r, active: false })));
  };

  return (
    <Link
      href={href}
      className={`relative overflow-hidden ${className}`}
      {...props}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragStart={handlePointerUp}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className={`absolute ${rippleColor} rounded-full animate-ripple-expand pointer-events-none transition-opacity duration-500 ${
            r.active ? "opacity-30" : "opacity-0"
          }`}
          style={{
            top: r.y,
            left: r.x,
            width: r.size,
            height: r.size,
            transform: "scale(0)",
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName === "opacity" && !r.active) {
              setRipples((prev) => prev.filter((ripple) => ripple.id !== r.id));
            }
          }}
        />
      ))}
    </Link>
  );
}
