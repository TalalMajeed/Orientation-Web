import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwTickets from "@/components/website/dw/DwTickets";
import DwContact from "@/components/website/dw/DwContact";

export const metadata = { title: "Tickets — NUST Orientation '26" };

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
