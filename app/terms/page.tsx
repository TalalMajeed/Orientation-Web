import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import Footer from "@/components/section/footer";
import LegalSections, { type LegalSection } from "@/components/section/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service — NUST Orientation '26",
  description: "Terms of Service for the NUST Orientation Week website.",
  path: "/terms",
});

const sections: LegalSection[] = [
  {
    title: "Acceptance of terms",
    body: [
      "By registering for Orientation Week or otherwise using this site, you agree to these terms. If you don't agree, please don't use the site.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Use the site and attend events respectfully. Don't attempt to disrupt the platform or misuse the map, schedule, or contact tools.",
    ],
  },
  {
    title: "Changes to the schedule",
    body: [
      "Orientation Week is a live, student-run event — sessions, venues, and timings on the Schedule and Map pages may change. We'll do our best to keep them current.",
    ],
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these terms as the event evolves. Continued use of the site after a change means you accept the updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />
      <LegalSections title="Terms of Service" updated="August 1, 2026" sections={sections} />
      <Footer />
    </main>
  );
}
