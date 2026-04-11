// Shared types for the gallery components. The backend returns a Prisma
// CmaImageTemplate row but we only render a subset + don't want to import
// @prisma/client types into presentation files, so we define a view model.

export interface GalleryTemplate {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  width: number;
  height: number;
  thumbnail: string | null;
  isSystem: boolean;
  layerData: unknown; // Opaque — hydrated when loading into the editor
  variableSchema: unknown;
  authCode: string;
}

export const PLATFORM_LABELS: Record<string, string> = {
  all: "All",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  pinterest: "Pinterest",
  "og-image": "Open Graph",
  "blog-header": "Blog header",
  generic: "Generic",
};
