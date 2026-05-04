import Image from "next/image";
import Link from "next/link";

export const TopNav: React.FC = () => {
  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-5 py-5 md:px-8 md:py-6">
      <Link href="/" aria-label="hrs home" className="flex items-center">
        <Image
          src="/hrs-logo-light.png"
          alt="hrs"
          width={696}
          height={358}
          priority
          className="h-7 w-auto"
        />
      </Link>
      <span
        aria-hidden
        className="material-symbols-outlined text-primary-container md:hidden"
      >
        menu
      </span>
    </nav>
  );
};
