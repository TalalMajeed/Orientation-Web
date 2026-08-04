import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwTickets from "@/components/website/dw/DwTickets";
import DwContact from "@/components/website/dw/DwContact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tickets — NUST Orientation '26",
  description:
    "Get your NUST Orientation Week pass — pricing, perks and everything included with each ticket tier.",
  path: "/passes",
});

// Public showcase of the two passes — same section shown on the homepage,
// just reachable directly from nav ("Tickets" used to point at the
// admin-only /event-tickets dashboard, which just bounced visitors to login).
export default function PassesPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <WebsiteChrome />
      <PageNav />
      <DwTickets />
      <DwContact />
    </main>
  );
}
