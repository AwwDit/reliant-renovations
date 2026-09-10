import type { Metadata } from "next";
import { AdminForgotPassword } from "@/components/admin/AdminPasswordRecovery";

export const metadata: Metadata = {
  title: "Forgot password | Reliant Renovations",
};

export default function ForgotPasswordPage() {
  return <AdminForgotPassword />;
}
