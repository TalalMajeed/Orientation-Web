import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import ContactSection from "@/components/section/contact";
import Footer from "@/components/section/footer";
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
      <SiteChrome />
      <SiteNav />
      <ContactSection />
      <Footer />
    </main>
  );
}
