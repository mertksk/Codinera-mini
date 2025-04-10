import Image from "next/image";
import bgImg from "@/public/halo.png";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Removed flex properties from body
    <body className="bg-brand dark:bg-dark antialiased dark:text-gray-100 relative">
      {/* Background elements */}
      <div className="absolute inset-0 dark:bg-dark-radial" />
      <div className="absolute inset-x-0 flex justify-center">
        <Image
          src={bgImg}
          alt=""
          className="w-full max-w-[1200px] mix-blend-screen dark:mix-blend-plus-lighter dark:opacity-10"
          priority
        />
      </div>

      {/* Main content container - Removed min-h-screen */}
      <div className="relative isolate flex flex-col items-center py-2">
        {/* Theme Toggle */}
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>

        {/* Width constraint and centering for content */}
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
          <Header />
          {/* Children (page content) */}
          {children}
          <Footer />
        </div>
      </div>
    </body>
  );
}
