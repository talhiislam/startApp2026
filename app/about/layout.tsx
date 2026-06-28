import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "SahaTour is an Algerian campsite booking platform built to connect campers with the best spots across Algeria — from the Sahara to the Mediterranean coast.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}