import type { Metadata } from "next";
import { getServerProfile } from "@/lib/api/endpoints/server";

export async function generateMetadata({ params }: { params: { screen_name: string } }): Promise<Metadata> {
  try {
    const decodedScreenName = decodeURIComponent(params.screen_name);
    const profile = await getServerProfile(decodedScreenName);
    return { title: { absolute: `${profile.user.name}さん | ネタツイグランプリ` } };
  } catch {
  }
  return { title: "ユーザー" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
