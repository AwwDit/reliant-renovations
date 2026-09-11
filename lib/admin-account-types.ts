/** Fields safe to expose to the dashboard. Credentials never leave the server. */
export interface AdminAccount {
  id: string;
  name: string;
  email: string | null;
  role: "owner" | "admin";
  active: boolean;
  createdAt: string;
}
