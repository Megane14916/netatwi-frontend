import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "会場",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
