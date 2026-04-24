const links = [
  { href: "#about", label: "About Clario" },
  { href: "#mission", label: "Our Mission" },
  { href: "#contact", label: "Contact" },
  { href: "#privacy", label: "Privacy Policy" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="mx-auto mt-20 w-full max-w-content px-[clamp(20px,5vw,64px)] pb-12 pt-10">
      <nav aria-label="Footer">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {links.map((link, i) => (
            <li key={link.href} className="flex items-center gap-6">
              <a
                href={link.href}
                className="text-[14px] transition-opacity duration-150 hover:opacity-60"
                style={{ color: "var(--ink)" }}
              >
                {link.label}
              </a>
              {i < links.length - 1 && (
                <span
                  aria-hidden="true"
                  className="inline-block h-[3px] w-[3px] rounded-full"
                  style={{ background: "var(--ink-faint)" }}
                />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
};
