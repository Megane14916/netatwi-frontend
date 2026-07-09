export default function Footer() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 ネタツイグランプリ. All Rights Reserved.</p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <a href="#" className="text-xs hover:underline underline-offset-4">
          利用規約
        </a>
        <a href="#" className="text-xs hover:underline underline-offset-4">
          プライバシーポリシー
        </a>
      </nav>
    </footer>
  );
}
