import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import ContactBlock from "@/components/website/dw/ContactBlock";
import DwContact from "@/components/website/dw/DwContact";

export const metadata = { title: "Contact — NUST Orientation '26" };

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <WebsiteChrome />
      <PageNav />
      <ContactBlock />
      <DwContact />
    </main>
  );
}
