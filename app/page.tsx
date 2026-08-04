import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import EntryExperience from "@/components/website/site/EntryExperience";
import DwHero from "@/components/website/dw/DwHero";
import DwWelcome from "@/components/website/dw/DwWelcome";
import DwSchedule from "@/components/website/dw/DwSchedule";
import ContactBlock from "@/components/website/dw/ContactBlock";
import DwContact from "@/components/website/dw/DwContact";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: "NUST Orientation 2026",
  description:
    "Official NUST Orientation Week hub for incoming students — event schedule, campus map, tickets, scavenger hunt and everything you need to start your story at NUST H-12.",
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

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WebsiteChrome />
      <EntryExperience />
      <DwHero />
      <DwWelcome />
      <DwSchedule />
      <ContactBlock />
      <DwContact />
    </main>
  );
}
