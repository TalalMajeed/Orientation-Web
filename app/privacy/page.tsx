import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import Footer from "@/components/section/footer";
import LegalSections, { type LegalSection } from "@/components/section/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy — NUST Orientation '26",
  description: "Privacy Policy for the NUST Orientation Week website.",
  path: "/privacy",
});

const sections: LegalSection[] = [
  {
    title: "Information we collect",
    body: [
      "When you register for Orientation or sign up for the newsletter, we collect basic details like your name, NUST email address, and CMS/registration number.",
      "We also collect standard technical data — device, browser, and pages visited — to keep the site working reliably.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "Your information is used to send you schedule updates and keep you posted on Orientation Week news.",
      "Cookies help us remember your session and understand which parts of the site are actually useful, so we can improve it year over year.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We don't sell your data. Information is only shared with NUST societies and volunteers directly involved in running Orientation Week, and only as needed to run the event.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can decline non-essential cookies from the consent banner at any time, unsubscribe from the newsletter via the link in any email, and request that we delete your data by reaching out through the Contact page.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about this policy? Reach the Orientation team through the contact form — we're happy to help.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />
      <LegalSections title="Privacy Policy" updated="August 1, 2026" sections={sections} />
      <Footer />
    </main>
  );
}
