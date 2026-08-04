import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwMap from "@/components/website/dw/DwMap";
import DwContact from "@/components/website/dw/DwContact";
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
      <WebsiteChrome />
      <PageNav />
      <DwMap />
      <DwContact />
    </main>
  );
}
