import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mb-3 mt-5 flex h-16 w-full flex-col items-center justify-between space-y-3 px-3 pt-4 text-center sm:mb-0 sm:h-20 sm:flex-row sm:pt-2">
      {/* Ensure text color adapts to dark mode */}
      <div className="text-gray-700 dark:text-gray-300">
        <div className="font-medium">
          Built with{" "}
          <a
            href="www.codinera.com"
            // Updated link colors
            className="font-semibold text-primary-600 dark:text-primary-400 underline-offset-4 transition hover:text-primary-500 dark:hover:text-primary-300 hover:underline"
            target="_blank"
          >
            Codinera
          </a>{" "}
           
         </div>
      </div>
      
    </footer>
  );
}
