import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import Footer from "@/components/section/footer";
import ScheduleSection from "@/components/section/schedule";
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
      <SiteChrome />
      <SiteNav />
      <ScheduleSection />
      <Footer />
    </main>
  );
}
