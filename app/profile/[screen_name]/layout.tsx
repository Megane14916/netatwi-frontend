import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { screen_name: string } }): Promise<Metadata> {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:5001";
  try {
    const decodedScreenName = decodeURIComponent(params.screen_name);
    const res = await fetch(`${backendUrl}/api/profile/${decodedScreenName}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.user && data.user.name) {
        return { title: { absolute: `${data.user.name}さん | ネタツイグランプリ` } };
      }
    }
  } catch (e) {
    // console.error(e);
  }
  return { title: "ユーザー" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
