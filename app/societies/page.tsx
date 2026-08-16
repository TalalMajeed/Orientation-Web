import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import Footer from "@/components/section/footer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "NUST Societies — NUST Orientation '26",
  description:
    "Explore student societies at NUST — from arts and culture to tech and debate — and find your community during Orientation Week.",
  path: "/societies",
});

const societies = [
  { name: "Dramatics Society", category: "Arts & Culture" },
  { name: "Debating Society", category: "Arts & Culture" },
  { name: "Music Society", category: "Arts & Culture" },
  { name: "ACM Student Chapter", category: "Tech" },
  { name: "IEEE Student Branch", category: "Tech" },
  { name: "Entrepreneurship Society", category: "Business" },
  { name: "Sports Society", category: "Sports" },
  { name: "Community Service Society", category: "Community" },
];

export default function SocietiesPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />
      <section className="mx-auto max-w-[1600px] px-6 py-24 sm:px-12">
        <p className="font-italic text-sm italic text-fg/50">— Find your people</p>
        <h1 className="mt-4 font-serif text-[10vw] font-bold leading-[0.9] text-fg sm:text-[5vw]">
          NUST Societies
        </h1>
        <p className="mt-6 max-w-2xl font-italic text-sm italic text-fg/60 sm:text-base">
          NUST&apos;s societies run stalls, workshops and events throughout Orientation Week.
          Here&apos;s a look at the communities you can join — full profiles and stall locations
          will be added as societies confirm participation.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {societies.map((society) => (
            <div
              key={society.name}
              className="rounded-2xl border-2 border-dotted border-fg/20 bg-fg/[0.03] p-6"
            >
              <p className="font-italic text-xs italic text-fg/40">{society.category}</p>
              <h2 className="mt-2 font-serif text-lg font-bold text-fg">{society.name}</h2>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
