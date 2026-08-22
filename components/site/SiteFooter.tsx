import Link from "next/link";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-6 border-t border-[#0B3049]/8 px-5 py-10 md:flex-row md:px-8 md:py-12">
      <Link
        href="/"
        aria-label="hrs home"
        className="font-serif text-lg lowercase text-[#0B3049]"
      >
        hrs
      </Link>

      <div className="font-serif text-xs uppercase tracking-widest text-[#6B8199]">
        © {new Date().getFullYear()} Hours. Reclaiming the craft of time.
      </div>

      <div className="flex gap-6 font-serif text-xs uppercase tracking-widest text-[#6B8199]">
        <a className="transition-colors hover:text-[#0B3049]" href="/privacy">
          Privacy
        </a>
        <a className="transition-colors hover:text-[#0B3049]" href="#">
          Terms
        </a>
        <a className="transition-colors hover:text-[#0B3049]" href="#">
          Studio
        </a>
      </div>
    </footer>
  );
};
