import Image from "next/image";
import Link from "next/link";
import logo from "../public/logo.png";
import GithubIcon from "./github-icon";

export default function Header() {
  return (
    <header className="relative mx-auto mt-5 flex w-full items-center justify-center px-2 pb-7 sm:px-4">
     <Link href="/" className="absolute flex flex-col items-center gap-1 text-gray-900 dark:text-gray-100">
  <div className="flex items-center gap-2">
    <Image alt="header text" src={logo} className="h-5 w-5" />
    <h1 className="text-xl tracking-tight">
      <span className="text-primary-600 dark:text-primary-400">Codinera</span> Mini
    </h1>
  </div>
  <p className="text-xs text-gray-600 dark:text-gray-400">
    Powered by <a href="https://codinera.com" className="hover:underline text-primary-600 dark:text-primary-400">Codinera</a>
  </p>
</Link>
      <a
        href="https://github.com/mertksk/Codinera-mini"
        target="_blank"
        // Updated background, text, and border colors
        className="ml-auto hidden items-center gap-3 rounded-2xl bg-white dark:bg-primary-900/60 text-gray-700 dark:text-gray-300 px-6 py-2 sm:flex border border-gray-300 dark:border-primary-700 hover:bg-gray-50 dark:hover:bg-primary-800/60"
      >
        {/* Updated icon color */}
        <GithubIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span>GitHub Repo</span>
      </a>
    </header>
  );
}
