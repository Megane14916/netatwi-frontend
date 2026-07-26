import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script"; // Scriptコンポーネントをインポート
import { Noto_Sans_JP, Inter } from "next/font/google";

export const metadata: Metadata = {
  title: {
    template: "%s | ネタツイグランプリ",
    default: "ネタツイグランプリ",
  },
  description: "140字以内に整えるおもしろインターネット賞レース",
  openGraph: {
    title: "ネタツイグランプリ",
    description: "140字以内に整えるおもしろインターネット賞レース",
    url: "https://n-1gp.vercel.app",
    siteName: "ネタツイグランプリ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ネタツイグランプリ",
    description: "140字以内に整えるおもしろインターネット賞レース",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ネタツイグランプリ",
  url: "https://n-1gp.vercel.app",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
      <body className={`${notoSansJP.variable} ${inter.variable} bg-white text-black dark:bg-gray-950 dark:text-white flex flex-col min-h-screen transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* ヘッダーの裏に配置するページトップ用の白い背景 */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 z-0 transition-colors duration-300"></div>
            <Header />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
