"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/philosophy", label: "Philosophy" },
  { href: "/approach", label: "Approach" },
  { href: "/contact", label: "Contact" },
];

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const startHref = isHome ? "#phone" : "/#phone";

  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full max-w-full items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-8 py-5 shadow-none">
      <Link href="/" className="flex items-center" aria-label="hrs home">
        <Image
          src="/hrs-logo-light.png"
          alt="hrs"
          width={696}
          height={358}
          priority
          className="h-7 w-auto"
        />
      </Link>

      <div className="hidden items-center gap-8 font-serif text-sm tracking-tight md:flex">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "border-b border-primary-container pb-1 text-primary-container"
                  : "text-white/70 transition-colors hover:text-primary-container"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="hidden md:block">
        <a
          href={startHref}
          className="border border-primary-container bg-[#0a0a0a] px-5 py-2 font-serif text-sm tracking-tight text-primary-container transition-opacity hover:opacity-80"
        >
          Get Started
        </a>
      </div>

      <div className="flex items-center md:hidden">
        <a
          href={startHref}
          aria-label="Get Started"
          className="border border-primary-container px-3 py-1.5 font-serif text-xs tracking-tight text-primary-container"
        >
          Start
        </a>
      </div>
    </nav>
  );
};
