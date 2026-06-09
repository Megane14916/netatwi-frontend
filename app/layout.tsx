import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script"; // Scriptコンポーネントをインポート
import { Noto_Sans_JP, Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "ネタツイグランプリ",
  description: "オンライン ネタツイ プラットフォーム",
};

// Google Analyticsの測定IDを環境変数から取得
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Google Analytics Script */}
        {/* GA_IDが設定されている場合のみスクリプトを出力 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${notoSansJP.variable} ${inter.variable} bg-gray-950 text-white flex flex-col min-h-screen`}>
        <AuthProvider>
          {/* ヘッダーの裏に配置するページトップ用の白い背景 */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-white z-0"></div>
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
