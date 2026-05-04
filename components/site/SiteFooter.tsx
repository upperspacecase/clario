import Link from "next/link";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-6 border-t border-white/10 bg-[#1a1a1a] px-5 py-10 md:flex-row md:px-8 md:py-12">
      <Link
        href="/"
        aria-label="hrs home"
        className="font-serif text-lg lowercase text-primary-container"
      >
        hrs
      </Link>

      <div className="font-serif text-xs uppercase tracking-widest text-[#a3a3a3]">
        © {new Date().getFullYear()} Hours. Reclaiming the craft of time.
      </div>

      <div className="flex gap-6 font-serif text-xs uppercase tracking-widest text-white/50">
        <a className="transition-colors hover:text-primary-container" href="#">
          Privacy
        </a>
        <a className="transition-colors hover:text-primary-container" href="#">
          Terms
        </a>
        <a className="transition-colors hover:text-primary-container" href="#">
          Studio
        </a>
      </div>
    </footer>
  );
};
