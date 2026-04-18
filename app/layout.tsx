import "./globals.css";
import { Poppins, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer"


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Sahatour — Discover Algeria's Best Campsites",
    template: "%s — SahaTour",
  },
  description:
  "Find and book the best camping spots across Algeria — from Sahara dunes to Kabylie forests and Mediterranean shores.",
  keywords: ["camping Algeria", "campsites Algeria", "Sahara camping", "Algeria outdoor"],
  openGraph: {
    siteName: "SahaTour",
    type: "website",
    locale: "en_US",
    url: "https://sahatour.vercel.app",
    title: "SahaTour — Discover Algeria's Best Campsites",
    description:
      "Find and book the best camping spots across Algeria — from Sahara dunes to Kabylie forests and Mediterranean shores.",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
        alt: "SahaTour — Algeria Campsites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SahaTour — Discover Algeria's Best Campsites",
    description:
      "Find and book the best camping spots across Algeria.",
    images: ["/hero.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans">
        <Providers>
          <Navbar />
          <main className="pt-[44px] md:pt-[72px] pb-16 md:pb-0 min-h-screen bg-[#0a0e17]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
