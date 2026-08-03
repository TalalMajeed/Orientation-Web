import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwContact from "@/components/website/dw/DwContact";
import Leaderboard from "@/components/hunt/Leaderboard";

export const metadata = { title: "Scavenger Hunt — NUST Orientation '26" };

export default function ScavengerHuntPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <WebsiteChrome />
      <PageNav />
      <Leaderboard />
      <DwContact />
    </main>
  );
}
