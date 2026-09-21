import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:5001";
  try {
    const res = await fetch(`${backendUrl}/api/contests/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const contest = await res.json();
      return { title: { absolute: `${contest.name} | ネタツイグランプリ` } };
    }
  } catch {
  }
  return { title: "大会" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
