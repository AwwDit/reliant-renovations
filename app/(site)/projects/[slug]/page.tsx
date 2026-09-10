import { notFound } from "next/navigation";
import { getProject, getProjects } from "@/lib/db";
import { pageMetadata, breadcrumbJsonLd, projectJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { ProjectDetail } from "@/components/craft/project-detail";
import imageManifest from "@/docs/PROJECT-IMAGE-MANIFEST.json";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  return project
    ? pageMetadata(
        `${project.title} | ${project.location}`,
        project.description,
        `/projects/${project.slug}`,
        project.images[0]?.src,
      )
    : { title: "Project not found", robots: { index: false, follow: false } };
}

export default async function CaseStudy({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ photo?: string }>;
}) {
  const [{ slug }] = await Promise.all([params, searchParams]);
  const project = await getProject(slug);
  if (!project) notFound();
  const related = (await getProjects({ division: project.division }))
    .filter((item) => item.id !== project.id)
    .slice(0, 3);
  const imageAspectRatios = Object.fromEntries(
    project.images.map(({ src }) => {
      const knownImage = imageManifest.files.find(
        ({ file }) => file === `public${src}`,
      );
      return [
        src,
        knownImage
          ? knownImage.dimensions.width / knownImage.dimensions.height
          : 3 / 4,
      ];
    }),
  );
  return (
    <>
      <ProjectDetail
        project={project}
        related={related}
        imageAspectRatios={imageAspectRatios}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${slug}` },
        ])}
      />
      <JsonLd data={projectJsonLd(project)} />
    </>
  );
}
