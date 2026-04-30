import "./globals.css";
import { poppins, playfair } from "@/lib/fonts";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";

export { playfair };

export const metadata: Metadata = {
  title: {
    default: "Sahatour — Discover Algeria's Best Campsites",
    template: "%s — SahaTour",
  },
  description:
    "Find and book the best camping spots across Algeria — from Sahara dunes to Kabylie forests and Mediterranean shores.",
  keywords: [
    "camping Algeria",
    "campsites Algeria",
    "Sahara camping",
    "Algeria outdoor",
  ],
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
    description: "Find and book the best camping spots across Algeria.",
    images: ["/hero.jpg"],
  },
  verification: {
    google: "cUyoUqTw1QXrYrxRQR6j0eIfqGDiTK2v5itLDRICJVg",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans">
        <Providers>
          <ToastProvider>
            <Navbar />
            <main
              className="pt-[44px] md:pt-[72px] pb-16 md:pb-0 min-h-screen"
              style={{ background: "var(--bg-base)" }}
              >
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
