import Image from "next/image";
import Link from "next/link";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-6 border-t border-white/10 bg-[#0a0a0a] px-8 py-12 md:flex-row">
      <Link href="/" className="flex items-center" aria-label="hrs home">
        <Image
          src="/hrs-logo-light.png"
          alt="hrs"
          width={696}
          height={358}
          className="h-6 w-auto"
        />
      </Link>

      <div className="font-serif text-xs uppercase tracking-widest text-primary-container">
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
