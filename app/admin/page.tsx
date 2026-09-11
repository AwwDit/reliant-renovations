import Link from "next/link";
import { authConfigured, getCurrentAdmin } from "@/lib/auth";
import { getInquiries, getProjects } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminAuthShell, AdminLogin } from "@/components/admin/AdminLogin";
import { mediaCloudName } from "@/lib/media-urls";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string | string[];
    password?: string | string[];
  }>;
}) {
  if (!authConfigured())
    return (
      <AdminAuthShell>
        <section
          className="rr-admin-auth-card rr-admin-auth-setup"
          aria-labelledby="admin-setup-title"
        >
          <div className="rr-admin-auth-kicker">
            <div className="rr-admin-eyebrow">OWNER WORKSPACE</div>
          </div>
          <h1 id="admin-setup-title">A home for your work.</h1>
          <p>
            Configure the owner account to start managing projects and
            inquiries.
          </p>
          <ol className="rr-admin-setup-steps">
            <li>
              Run <code>npm run admin:setup</code> in the project directory.
            </li>
            <li>
              Add the generated password hash and session secret to{" "}
              <code>.env.local</code> or your hosting environment.
            </li>
            <li>Restart the application, then refresh this page.</li>
          </ol>
          <div className="rr-admin-callout">
            Your dashboard is locked until credentials are configured. Project
            and inquiry data is stored in MongoDB. Uploaded files use the media
            storage configured for this website.
          </div>
          <Link className="rr-admin-text-link" href="/">
            ← Back to the website
          </Link>
        </section>
      </AdminAuthShell>
    );
  const currentAdmin = await getCurrentAdmin();
  const { view, password } = await searchParams;
  if (!currentAdmin)
    return <AdminLogin passwordChanged={password === "changed"} />;
  const initialTab =
    view === "inquiries"
      ? "inquiries"
      : view === "accounts"
        ? "accounts"
        : "projects";
  const [projects, inquiries] = await Promise.all([
    getProjects({ includeHidden: true }),
    getInquiries(),
  ]);
  return (
    <AdminDashboard
      key={initialTab}
      initialTab={initialTab}
      currentAdmin={currentAdmin}
      initialProjects={projects}
      initialInquiries={inquiries}
      cloudName={mediaCloudName()}
    />
  );
}
