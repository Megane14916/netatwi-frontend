import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Googleフォントの読み込みを停止
import "./globals.css"; // 相対パスに変更
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

// const inter = Inter({ subsets: ["latin"] }); // Googleフォントの読み込みを停止

export const metadata: Metadata = {
  title: "ネタツイ大会",
  description: "オンライン ネタツイ大会 プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* bodyにflexコンテナを設定し、縦方向に要素を配置 */}
      <body className={`bg-gray-950 text-white flex flex-col min-h-screen`}> {/* ${inter.className} を削除 */}
        <AuthProvider>
          <Header />
          {/* main要素が利用可能なスペースをすべて埋めるようにする */}
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

