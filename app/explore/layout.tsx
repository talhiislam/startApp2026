import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Campsites",
  description:
    "Browse and filter hundreds of campsites across Algeria — Sahara, Kabylie, Hoggar, coastal and more.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}