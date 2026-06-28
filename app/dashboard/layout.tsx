import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Dashboard",
  description: "Manage your campsites, bookings, and availability.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}