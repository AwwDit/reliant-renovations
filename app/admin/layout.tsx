import type { Metadata } from "next";
import "./admin.css";
import "./editor.css";
import "./auth.css";
export const metadata: Metadata = {
  title: "Admin dashboard | Reliant Renovations",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
