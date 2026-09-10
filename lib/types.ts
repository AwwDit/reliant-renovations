export type Division = "commercial" | "residential";
export interface ProjectImage {
  src: string;
  alt: string;
}
export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  division: Division;
  location: string;
  category: string;
  description: string;
  result: string;
  scope: string[];
  images: ProjectImage[];
  featured: boolean;
  published: boolean;
  order: number;
  updatedAt: string;
}
export interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  projectType: string;
  timing: string;
  description: string;
  attachment: string | null;
  createdAt: string;
  read: boolean;
}
