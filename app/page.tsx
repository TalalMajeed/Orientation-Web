import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import EntryExperience from "@/components/website/site/EntryExperience";
import DwHero from "@/components/website/dw/DwHero";
import DwWelcome from "@/components/website/dw/DwWelcome";
import DwSchedule from "@/components/website/dw/DwSchedule";
import DwMap from "@/components/website/dw/DwMap";
import DwEvents from "@/components/website/dw/DwEvents";
import ContactBlock from "@/components/website/dw/ContactBlock";
import DwContact from "@/components/website/dw/DwContact";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <WebsiteChrome />
      <EntryExperience />
      <DwHero />
      <DwWelcome />
      <DwSchedule />
      <DwMap />
      <DwEvents />
      <ContactBlock />
      <DwContact />
    </main>
  );
}
