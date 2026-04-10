"use client";

// KB page layout — consistent wrapper for knowledge base articles with TOC sidebar and language toggle

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

// ── Language context — shared across KB components ──

export type KbLang = "en" | "vi";

const KbLangContext = createContext<KbLang>("en");
export function useKbLang() { return useContext(KbLangContext); }

/** Shorthand: returns vi text when Vietnamese is active, en text otherwise */
export function T({ en, vi }: { en: React.ReactNode; vi: React.ReactNode }) {
  const lang = useKbLang();
  return <>{lang === "vi" ? vi : en}</>;
}

// ── Layout ──

interface TocItem {
  id: string;
  en: string;
  vi: string;
}

interface Props {
  titleEn: string;
  titleVi: string;
  subtitleEn: string;
  subtitleVi: string;
  backHref: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export function CmaKbPageLayout({ titleEn, titleVi, subtitleEn, subtitleVi, backHref, toc, children }: Props) {
  const [lang, setLang] = useState<KbLang>("vi");

  return (
    <KbLangContext.Provider value={lang}>
      <div className="p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
                {lang === "vi" ? titleVi : titleEn}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === "vi" ? subtitleVi : subtitleEn}
              </p>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLang("vi")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                lang === "vi" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                lang === "en" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Body: TOC sidebar + Content */}
        <div className="flex gap-8">
          {/* Sticky TOC sidebar */}
          <nav className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {lang === "vi" ? "Mục lục" : "On this page"}
              </p>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                >
                  {lang === "vi" ? item.vi : item.en}
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
    </KbLangContext.Provider>
  );
}
