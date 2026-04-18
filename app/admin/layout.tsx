import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Manage campsite approvals and user roles.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}