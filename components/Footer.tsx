import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-600">
      <p className="text-xs text-gray-500 dark:text-gray-400 order-2 sm:order-1 mt-2 sm:mt-0">© 2026 ネタツイグランプリ. All Rights Reserved.</p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6 order-1 sm:order-2">
        <Link href="/terms" className="text-xs hover:underline underline-offset-4">
          利用規約
        </Link>
        <Link href="/privacy" className="text-xs hover:underline underline-offset-4">
          プライバシーポリシー
        </Link>
      </nav>
    </footer>
  );
}
