import Link from "next/link";

export const TopNav: React.FC = () => {
  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#0B3049]/8 bg-[#F6F4EF]/90 px-5 py-4 backdrop-blur-md md:px-8">
      {/* Text wordmark: the only logo asset is drawn for dark backgrounds. */}
      <Link
        href="/"
        aria-label="hrs home"
        className="font-serif text-2xl lowercase leading-none text-[#0B3049]"
      >
        hrs
      </Link>

      <div className="flex items-center gap-6">
        <a
          href="#pricing"
          className="hidden text-[14px] font-medium text-[#476582] transition-colors hover:text-[#0B3049] sm:block"
        >
          Pricing
        </a>
        <a
          href="#call"
          className="rounded-full bg-[#16a34a] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#15803d]"
        >
          Get your free assessment
        </a>
      </div>
    </nav>
  );
};
