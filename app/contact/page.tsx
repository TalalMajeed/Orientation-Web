import WebsiteChrome from "@/components/website/site/WebsiteChrome";
import PageNav from "@/components/website/dw/PageNav";
import ContactBlock from "@/components/website/dw/ContactBlock";
import DwContact from "@/components/website/dw/DwContact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact — NUST Orientation '26",
  description:
    "Get in touch with the NUST Orientation team — general queries, support and social channels.",
  path: "/contact",
});

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
