import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwSchedule from "@/components/website/dw/DwSchedule";
import DwContact from "@/components/website/dw/DwContact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Schedule — NUST Orientation '26",
  description:
    "Full day-by-day schedule for NUST Orientation Week — sessions, timings and venues across H-12 campus.",
  path: "/schedule",
});

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <WebsiteChrome />
      <PageNav />
      <DwSchedule />
      <DwContact />
    </main>
  );
}
