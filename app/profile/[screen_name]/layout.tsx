import type { Metadata } from "next";
import { getServerProfile } from "@/lib/api/endpoints/server";
import { resolveMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: { screen_name: string } }): Promise<Metadata> {
  const decodedScreenName = decodeURIComponent(params.screen_name);
  return resolveMetadata(
    () => getServerProfile(decodedScreenName),
    (profile) => ({ title: { absolute: `${profile.user.name}さん | ネタツイグランプリ` } }),
    { title: "ユーザー" },
    `profile:${decodedScreenName}`,
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
