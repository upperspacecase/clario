import {
  siInstagram,
  siSquare,
  siCanva,
  siWhatsapp,
  siGoogle,
} from "simple-icons";

const icons = {
  instagram: siInstagram,
  square: siSquare,
  canva: siCanva,
  whatsapp: siWhatsapp,
  google: siGoogle,
} as const;

export type BrandKey = keyof typeof icons;

export const BrandLogo: React.FC<{ brand: BrandKey; size?: number }> = ({
  brand,
  size = 24,
}) => {
  const icon = icons[brand];
  return (
    <svg
      role="img"
      aria-label={icon.title}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{icon.title}</title>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
};

export const brandLabels: Record<BrandKey, string> = {
  instagram: "Instagram",
  square: "Square",
  canva: "Canva",
  whatsapp: "WhatsApp",
  google: "Google",
};
