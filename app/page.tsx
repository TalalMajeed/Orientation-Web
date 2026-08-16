import SiteChrome from "@/components/site/chrome";
import EntryGate from "@/components/site/gate";
import ContactSection from "@/components/section/contact";
import EventsSection from "@/components/section/events";
import Footer from "@/components/section/footer";
import HeroSection from "@/components/section/hero";
import ScheduleSection from "@/components/section/schedule";
import WelcomeSection from "@/components/section/welcome";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: "NUST Orientation 2026",
  description:
    "Official NUST Orientation Week hub for incoming students — event schedule, campus map, societies and everything you need to start your story at NUST H-12.",
  url: "https://orientation.nust.edu.pk",
  image: "https://orientation.nust.edu.pk/logo-v2.png",
  organizer: {
    "@type": "Organization",
    name: "National University of Sciences and Technology (NUST)",
    url: "https://nust.edu.pk",
  },
  location: {
    "@type": "Place",
    name: "NUST H-12 Campus",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Islamabad",
      addressRegion: "H-12",
      addressCountry: "PK",
    },
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteChrome />
      <EntryGate />
      <HeroSection />
      <WelcomeSection />
      <ScheduleSection />
      <EventsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
