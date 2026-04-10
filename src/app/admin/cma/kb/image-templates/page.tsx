"use client";

// KB index page for Image Template System — links to user guide and admin guide

import Link from "next/link";
import { ArrowLeft, BookOpen, Users, Shield } from "lucide-react";

export default function ImageTemplateKbIndexPage() {
  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/cma">
          <button
            aria-label="Go back"
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Image Template System — Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Guides for using and managing the image template system
          </p>
        </div>
      </div>

      {/* Guide cards */}
      <div className="grid gap-4">
        <Link
          href="/admin/cma/kb/image-templates/user-guide"
          className="group block rounded-lg border p-6 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                User Guide
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to create branded social media images from templates.
                Covers template browsing, variable filling, live preview,
                image generation, and publishing.
              </p>
              <span className="text-xs text-primary mt-2 inline-block">
                Read guide &rarr;
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/cma/kb/image-templates/admin-guide"
          className="group block rounded-lg border p-6 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                Admin &amp; Developer Guide
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                System operation, custom template creation, architecture overview,
                deployment considerations, and development roadmap.
              </p>
              <span className="text-xs text-primary mt-2 inline-block">
                Read guide &rarr;
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
