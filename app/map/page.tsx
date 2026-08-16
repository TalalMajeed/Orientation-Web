import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import Footer from "@/components/section/footer";
import MapSection from "@/components/section/map";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Campus Map — NUST Orientation '26",
  description:
    "Interactive NUST H-12 campus map for Orientation Week — find venues, halls and key locations at a glance.",
  path: "/map",
});

export default function MapPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />
      <MapSection />
      <Footer />
    </main>
  );
}
