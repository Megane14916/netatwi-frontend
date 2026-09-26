import type { Metadata } from "next";
import { getServerContest } from "@/lib/api/endpoints/server";
import { resolveMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return resolveMetadata(
    () => getServerContest(Number(params.id)),
    (contest) => ({ title: { absolute: `${contest.name} | ネタツイグランプリ` } }),
    { title: "大会" },
    `contest:${params.id}`,
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
