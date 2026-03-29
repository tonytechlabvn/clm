// MAF Running Club — public-facing layout with custom branding fonts & colors
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MAF Running Club",
  description: "Cộng đồng chạy bộ chuyên nghiệp dựa trên khoa học nhịp tim và hiệu năng hiếu khí",
};

export default function MafLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="maf-scope">
      {/* Google Fonts for MAF pages */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  );
}
