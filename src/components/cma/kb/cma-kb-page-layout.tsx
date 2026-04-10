"use client";

// KB page layout — consistent wrapper for knowledge base articles with TOC sidebar

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

interface TocItem {
  id: string;
  label: string;
}

interface Props {
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export function CmaKbPageLayout({ title, subtitle, backHref, backLabel, toc, children }: Props) {
  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref}>
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
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Body: TOC sidebar + Content */}
      <div className="flex gap-8">
        {/* Sticky TOC sidebar */}
        <nav className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              On this page
            </p>
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Prose content */}
        <article className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-20">
          {children}
        </article>
      </div>
    </div>
  );
}
