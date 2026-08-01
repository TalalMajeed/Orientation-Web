import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import DwContact from "@/components/website/dw/DwContact";

export const metadata = { title: "Terms of Service — NUST Orientation '26" };

const sections: { title: string; body: string[] }[] = [
  {
    title: "Acceptance of terms",
    body: [
      "By registering for Orientation Week, buying a ticket, or otherwise using this site, you agree to these terms. If you don't agree, please don't use the site.",
    ],
  },
  {
    title: "Tickets & registration",
    body: [
      "E-tickets are issued to the name and email used at registration and are non-transferable unless stated otherwise for a specific event.",
      "You're responsible for keeping your ticket QR code and login details private — we can't be held responsible for tickets used by someone else after being shared.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Use the site and attend events respectfully. Don't attempt to disrupt the platform, forge tickets, or misuse the map, schedule, or contact tools.",
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
      <WebsiteChrome />
      <PageNav />

      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <p className="font-italic text-sm italic text-fg/50">— Legal</p>
        <h1 className="mt-4 font-serif text-[13vw] font-bold leading-[0.9] text-fg sm:text-[7vw]">
          Terms of Service
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
