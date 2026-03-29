// MAF Running Club — reusable blog post card for the grid layout
import Image from "next/image";
import Link from "next/link";

export interface MafBlogPost {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  categories: string[];
  publishedAt: string | null;
  author: { id: string; name: string | null; image: string | null } | null;
}

// Format date as Vietnamese-style "DD Thang M, YYYY"
function formatViDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate()} Thang ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80";

export function MafBlogCard({ post }: { post: MafBlogPost }) {
  const href = `/maf/blog/${post.slug || post.id}`;
  const category = post.categories[0] || "Blog";

  return (
    <Link
      href={href}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={post.featuredImage || PLACEHOLDER_IMG}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-maf-ink-dark text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
          {category}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-maf-display font-bold text-xl text-maf-ink-dark mb-3 group-hover:text-maf-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="font-maf-body text-sm text-maf-ink-light line-clamp-2 mb-6">
          {post.excerpt || ""}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <span className="font-maf-body text-xs text-maf-ink-light">
            {formatViDate(post.publishedAt)}
          </span>
          <span className="font-maf-display text-xs font-bold text-maf-secondary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Doc tiep
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
