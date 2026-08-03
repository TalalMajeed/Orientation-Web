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

export const metadata: Metadata = {
  title: "NUST Orientation — Ab Kahani Tumhari Hai",
  description:
    "Orientation Week hub for incoming NUST students — schedule, campus map, tickets and everything you need to start your story.",
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
