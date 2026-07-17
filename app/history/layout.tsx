import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "過去ログ",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
