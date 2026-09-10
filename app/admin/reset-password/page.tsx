import type { Metadata } from "next";
import { AdminResetPassword } from "@/components/admin/AdminPasswordRecovery";

export const metadata: Metadata = {
  title: "Reset password | Reliant Renovations",
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <AdminResetPassword />;
}
