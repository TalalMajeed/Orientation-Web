import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwContact from "@/components/website/dw/DwContact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy — NUST Orientation '26",
  description: "Privacy Policy for the NUST Orientation Week website.",
  path: "/privacy",
});

const sections: { title: string; body: string[] }[] = [
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
      <WebsiteChrome />
      <PageNav />

      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <p className="font-italic text-sm italic text-fg/50">— Legal</p>
        <h1 className="mt-4 font-serif text-[13vw] font-bold leading-[0.9] text-fg sm:text-[7vw]">
          Privacy Policy
        </h1>
        <p className="mt-4 font-italic text-sm italic text-fg/50">
          Last updated August 1, 2026
        </p>

        <div className="mt-16 space-y-12 border-t border-dashed border-fg/20 pt-12">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-serif text-2xl font-bold text-fg sm:text-3xl">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 font-italic text-base italic leading-relaxed text-fg/70">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>

      <DwContact />
    </main>
  );
}
