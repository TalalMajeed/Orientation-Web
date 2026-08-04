import type { Metadata } from "next";
import { Poppins, League_Spartan, Rakkas, Anton, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const themeInit = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const rakkas = Rakkas({
  variable: "--font-rakkas",
  subsets: ["arabic"],
  weight: "400",
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = "https://orientation.nust.edu.pk";
const title = "NUST Orientation 2026 — Ab Kahani Tumhari Hai";
const description =
  "Official NUST Orientation Week hub for incoming students — event schedule, campus map, tickets, scavenger hunt and everything you need to start your story at NUST H-12.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | NUST Orientation",
  },
  description,
  keywords: [
    "NUST Orientation",
    "NUST Orientation 2026",
    "NUST H-12",
    "NUST freshers",
    "NUST orientation week",
    "NUST tickets",
    "NUST campus map",
    "National University of Sciences and Technology orientation",
  ],
  authors: [{ name: "NUST Orientation" }],
  applicationName: "NUST Orientation",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "NUST Orientation",
    title,
    description,
    locale: "en_PK",
    images: [
      {
        url: "/logo-v2.png",
        width: 491,
        height: 508,
        alt: "NUST Orientation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo-v2.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${leagueSpartan.variable} ${rakkas.variable} ${anton.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
