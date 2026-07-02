import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camping Products",
  description: "Browse camping gear and equipment curated by SahaTour.",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
