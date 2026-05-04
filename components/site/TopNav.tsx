import Link from "next/link";

export const TopNav: React.FC = () => {
  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-5 py-5 md:px-8 md:py-6">
      <Link
        href="/"
        aria-label="hrs home"
        className="font-serif text-2xl lowercase text-primary-container transition-transform duration-200 ease-out hover:scale-95"
      >
        hrs
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
