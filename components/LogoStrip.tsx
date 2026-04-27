import { BrandLogo, brandLabels } from "./BrandLogo";

const brands = ["instagram", "square", "canva", "whatsapp", "google"] as const;

export const LogoStrip: React.FC = () => {
  return (
    <section
      className="mx-auto mt-24 w-full max-w-content px-[clamp(20px,5vw,64px)]"
      aria-label="Tools Hours may recommend"
    >
      <div
        className="pt-12"
        style={{ borderTop: "1px solid rgba(30, 26, 20, 0.12)" }}
      >
        <p
          className="text-center text-[13px]"
          style={{ color: "var(--ink-soft)" }}
        >
          Not affiliated. Tools Hours may recommend.
        </p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 sm:gap-x-16">
          {brands.map((brand) => (
            <li
              key={brand}
              className="flex items-center gap-2 opacity-80"
              style={{ color: "var(--ink)" }}
            >
              <BrandLogo brand={brand} size={24} />
              <span className="text-[15px] font-bold">
                {brandLabels[brand]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
