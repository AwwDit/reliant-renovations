import Link from "next/link";
import { authConfigured, isAuthenticated } from "@/lib/auth";
import { getInquiries, getProjects } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminAuthShell, AdminLogin } from "@/components/admin/AdminLogin";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  if (!authConfigured())
    return (
      <AdminAuthShell>
        <section
          className="ad-auth-card ad-auth-setup"
          aria-labelledby="admin-setup-title"
        >
          <div className="ad-auth-kicker">
            <div className="ad-eyebrow">OWNER WORKSPACE</div>
          </div>
          <h1 id="admin-setup-title">A home for your work.</h1>
          <p>
            Configure the owner account to start managing projects and
            inquiries.
          </p>
          <ol className="ad-setup-steps">
            <li>
              Run <code>npm run admin:setup</code> in the project directory.
            </li>
            <li>
              Add the generated password hash and session secret to{" "}
              <code>.env.local</code> or your hosting environment.
            </li>
            <li>Restart the application, then refresh this page.</li>
          </ol>
          <div className="ad-callout">
            Your dashboard is locked until credentials are configured. Project
            and inquiry data is stored in MongoDB. Uploaded files remain in your
            persistent data directory.
          </div>
          <Link className="ad-text-link" href="/">
            ← Back to the website
          </Link>
        </section>
      </AdminAuthShell>
    );
  if (!(await isAuthenticated())) return <AdminLogin />;
  const { view } = await searchParams;
  const initialTab = view === "inquiries" ? "inquiries" : "projects";
  const [projects, inquiries] = await Promise.all([
    getProjects({ includeHidden: true }),
    getInquiries(),
  ]);
  return (
    <AdminDashboard
      key={initialTab}
      initialTab={initialTab}
      initialProjects={projects}
      initialInquiries={inquiries}
    />
  );
}
