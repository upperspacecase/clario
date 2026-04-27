import { AdminAuthGate } from "@/components/admin/AdminAuthGate";

export const metadata = {
  title: "Admin — Hours",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGate>{children}</AdminAuthGate>;
}
