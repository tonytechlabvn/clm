// MAF Blog — client-side category tabs and search input with URL-based filtering
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface Props {
  categories: string[];
  activeCategory?: string;
}

export function MafBlogFilters({ categories, activeCategory }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const category = overrides.category ?? searchParams.get("category") ?? undefined;
      const search = overrides.search ?? searchParams.get("search") ?? undefined;

      if (category) params.set("category", category);
      if (search) params.set("search", search);
      // Always reset to page 1 on filter change
      const qs = params.toString();
      return `/maf/blog${qs ? `?${qs}` : ""}`;
    },
    [searchParams]
  );

  const handleCategoryClick = (cat: string) => {
    // First category = "all" — clear category filter
    const isAll = cat === categories[0];
    router.push(buildUrl({ category: isAll ? undefined : cat }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ search: searchValue || undefined }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 justify-between items-center mb-12">
      {/* Category Tabs */}
      <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-3 whitespace-nowrap">
          {categories.map((cat) => {
            const isAll = cat === categories[0];
            const isActive = isAll ? !activeCategory : activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={
                  isActive
                    ? "bg-maf-ink-dark text-white px-6 py-2.5 rounded-full font-maf-display font-bold text-sm shadow-md transition-colors"
                    : "bg-white hover:bg-maf-surface-alt text-maf-ink-dark border border-gray-200 px-6 py-2.5 rounded-full font-maf-display font-bold text-sm transition-colors"
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 relative">
        <input
          type="text"
          placeholder="Tim kiem bai viet..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-white border border-gray-200 focus:border-maf-primary focus:ring-4 focus:ring-maf-primary/10 rounded-full font-maf-body text-maf-ink-dark py-2.5 pl-12 pr-4 transition-all outline-none"
        />
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-maf-ink-light">
          search
        </span>
      </form>
    </div>
  );
}
