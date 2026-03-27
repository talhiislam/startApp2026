import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main className="pt-[72px] min-h-screen bg-[#0a0e17]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}