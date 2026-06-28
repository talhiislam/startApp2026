import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Trips",
  description: "Manage your campsite bookings, saved spots, and trip notes.",
};

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}