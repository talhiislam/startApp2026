import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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