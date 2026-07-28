import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import EntryExperience from "@/components/website/site/EntryExperience";
import DwHero from "@/components/website/dw/DwHero";
import DwManifesto from "@/components/website/dw/DwManifesto";
import DwSchedule from "@/components/website/dw/DwSchedule";
import DwMap from "@/components/website/dw/DwMap";
import DwTickets from "@/components/website/dw/DwTickets";
import DwContact from "@/components/website/dw/DwContact";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <WebsiteChrome />
      <EntryExperience />
      <DwHero />
      <DwManifesto />
      <DwSchedule />
      <DwMap />
      <DwTickets />
      <DwContact />
    </main>
  );
}
