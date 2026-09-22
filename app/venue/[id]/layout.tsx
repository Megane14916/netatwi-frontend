import type { Metadata } from "next";
import { getServerContest } from "@/lib/api/endpoints/server";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const contest = await getServerContest(Number(params.id));
    return { title: { absolute: `${contest.name} | ネタツイグランプリ` } };
  } catch {
  }
  return { title: "大会" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
