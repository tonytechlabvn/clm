"use client";

// KB index page for Image Template System — bilingual (VI/EN)

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Users, Shield } from "lucide-react";

type Lang = "vi" | "en";

export default function ImageTemplateKbIndexPage() {
  const [lang, setLang] = useState<Lang>("vi");
  const t = lang === "vi";

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/cma">
            <button aria-label="Go back" className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t ? "Hệ Thống Mẫu Hình Ảnh — Tài Liệu" : "Image Template System — Knowledge Base"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t ? "Hướng dẫn sử dụng và quản trị hệ thống mẫu hình ảnh" : "Guides for using and managing the image template system"}
            </p>
          </div>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setLang("vi")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${lang === "vi" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            🇻🇳 Tiếng Việt
          </button>
          <button onClick={() => setLang("en")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${lang === "en" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Guide cards */}
      <div className="grid gap-4">
        <Link href="/admin/cma/kb/image-templates/user-guide" className="group block rounded-lg border p-6 hover:border-primary/50 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                {t ? "Hướng Dẫn Sử Dụng" : "User Guide"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t
                  ? "Hướng dẫn tạo hình ảnh mạng xã hội từ mẫu có sẵn. Bao gồm: duyệt mẫu, điền biến, xem trước trực tiếp, tạo ảnh và xuất bản."
                  : "Learn how to create branded social media images from templates. Covers template browsing, variable filling, live preview, image generation, and publishing."}
              </p>
              <span className="text-xs text-primary mt-2 inline-block">
                {t ? "Đọc hướng dẫn →" : "Read guide →"}
              </span>
            </div>
          </div>
        </Link>

        <Link href="/admin/cma/kb/image-templates/admin-guide" className="group block rounded-lg border p-6 hover:border-primary/50 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                {t ? "Hướng Dẫn Quản Trị & Phát Triển" : "Admin & Developer Guide"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t
                  ? "Vận hành hệ thống, tạo mẫu tùy chỉnh, kiến trúc tổng quan, triển khai, và lộ trình phát triển."
                  : "System operation, custom template creation, architecture overview, deployment considerations, and development roadmap."}
              </p>
              <span className="text-xs text-primary mt-2 inline-block">
                {t ? "Đọc hướng dẫn →" : "Read guide →"}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
