import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "The Game — NUST Orientation '26",
  description: "Step into the NUST virtual campus.",
  path: "/game",
});

// Full-bleed embed of the SkyOffice virtual campus — no site chrome (nav,
// grain, theme toggle) since the embedded app has its own UI and fills the
// whole viewport.
export default function GamePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-ink">
      <iframe
        src="https://skyoffice-686006131159.us-central1.run.app"
        title="NUST Virtual Campus"
        className="h-full w-full border-0"
        allow="camera; microphone; fullscreen"
      />
    </main>
  );
}
