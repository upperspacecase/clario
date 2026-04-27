import { TopNav } from "./TopNav";
import { SiteFooter } from "./SiteFooter";

export const PlaceholderPage: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
}> = ({ eyebrow, title, body }) => {
  return (
    <>
      <TopNav />
      <main className="relative z-10 min-h-screen bg-[#121212] bg-grain pt-[80px] text-surface-container">
        <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-[1120px] flex-col justify-center px-8 py-[120px]">
          <span className="mb-6 inline-block w-fit rounded-full border border-primary-container px-4 py-1.5 font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-primary-container">
            {eyebrow}
          </span>
          <h1 className="mb-8 max-w-3xl font-serif text-[clamp(40px,6vw,64px)] leading-[1.1] tracking-[-0.02em] text-surface-container">
            {title}
          </h1>
          <p className="max-w-2xl font-[Inter] text-lg leading-[1.6] text-[#a3a3a3]">
            {body}
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
};
