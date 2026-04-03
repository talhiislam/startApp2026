import "./globals.css";
import { Poppins, Playfair_Display } from "next/font/google";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans">
        <Providers>
          <Navbar />
          <main className="pt-[72px] min-h-screen bg-[#0a0e17]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
