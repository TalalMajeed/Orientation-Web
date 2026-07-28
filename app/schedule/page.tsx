import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwSchedule from "@/components/website/dw/DwSchedule";
import DwContact from "@/components/website/dw/DwContact";

export const metadata = { title: "Schedule — NUST Orientation '26" };

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
