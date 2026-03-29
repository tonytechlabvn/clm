// MAF Running Club — Blog listing page at /maf/blog
// Fetches published CMA posts server-side and renders the full blog layout
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma-client";
import { MafNavbar } from "@/components/maf/maf-navbar";
import { MafFooter } from "@/components/maf/maf-footer";
import { MafBlogCard } from "@/components/maf/maf-blog-card";
import type { MafBlogPost } from "@/components/maf/maf-blog-card";
import { MafNewsletterSection } from "@/components/maf/maf-newsletter-section";
import { MafBlogFilters } from "./maf-blog-filters";

export const dynamic = "force-dynamic";

const POSTS_PER_PAGE = 9;

// Hard-coded category tabs matching the HTML design
const CATEGORIES = [
  "Tat ca bai viet",
  "Y te the thao",
  "Dinh duong",
  "Giao an MAF",
  "Review Trang bi",
];

// Placeholder posts shown when no real published posts exist yet
const PLACEHOLDER_POSTS: MafBlogPost[] = [
  {
    id: "p1",
    title: "IT Band - Noi am anh cua dan chay duong dai va cach khac phuc triet de",
    slug: "it-band-chay-dai",
    excerpt: "Hoi chung dai chau chay (IT Band) la chan thuong pho bien. Cung tim hieu cac bai tap gian co chuyen sau giup day lui con dau nay.",
    featuredImage: "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=600&q=80",
    categories: ["Y te the thao"],
    publishedAt: "2026-03-27T00:00:00Z",
    author: null,
  },
  {
    id: "p2",
    title: "Nap Gel the nao cho dung trong cu ly Full Marathon (42.195km)?",
    slug: "nap-gel-marathon",
    excerpt: "Chien thuat su dung gel nang luong, dien giai va muoi de khong bi duoi suc o nhung km cuoi cung.",
    featuredImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
    categories: ["Dinh duong"],
    publishedAt: "2026-03-25T00:00:00Z",
    author: null,
  },
  {
    id: "p3",
    title: "Cong thuc tinh nhip tim MAF chuan xac cho nguoi moi bat dau",
    slug: "cong-thuc-nhip-tim-maf",
    excerpt: "Quy tac 180-tuoi khong cung nhac. Lam sao de dieu chinh vung nhip tim dua tren tien su suc khoe va thoi quen ca nhan.",
    featuredImage: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&q=80",
    categories: ["Giao an MAF"],
    publishedAt: "2026-03-20T00:00:00Z",
    author: null,
  },
  {
    id: "p4",
    title: "Top 5 doi giay Daily Trainer tot nhat cho cac bai chay phuc hoi (Easy Run)",
    slug: "top-5-giay-daily-trainer",
    excerpt: "Danh gia chi tiet cac mau giay em ai nhat nam 2026, giup bao ve khop goi toi da trong nhung buoi chay MAF cham rai.",
    featuredImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
    categories: ["Review Trang bi"],
    publishedAt: "2026-03-18T00:00:00Z",
    author: null,
  },
  {
    id: "p5",
    title: "Tam quan trong cua giac ngu trong viec phuc hoi co bap sau ngay Long Run",
    slug: "giac-ngu-phuc-hoi",
    excerpt: "Ban co the tap luyen cuc nhoc, nhung neu thieu ngu, moi cong suc se do song do be. Khoa hoc ve giac ngu cho runner.",
    featuredImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",
    categories: ["Phuc hoi"],
    publishedAt: "2026-03-15T00:00:00Z",
    author: null,
  },
  {
    id: "p6",
    title: "Tai sao nhip tim cua ban lai tang dot bien khi chay vao mua he nong buc?",
    slug: "nhip-tim-mua-he",
    excerpt: "Hieu ung Cardiac Drift la gi va lam the nao de dieu chinh Pace chay bo khi nhiet do ngoai troi vuot qua 35 do C.",
    featuredImage: "https://images.unsplash.com/photo-1502224562085-639556652f33?w=600&q=80",
    categories: ["Kien thuc chung"],
    publishedAt: "2026-03-10T00:00:00Z",
    author: null,
  },
];

// Featured post placeholder
const FEATURED_PLACEHOLDER = {
  title: "Giai ma buc tuong 30km trong Marathon: Tai sao va cach vuot qua voi he thong MAF",
  excerpt:
    '"Dung tuong" (Hitting the wall) o km 30-35 la noi am anh cua moi runner. Phuong phap chay cham MAF giup co the chuyen hoa mo thanh nang luong hieu qua hon, tiet kiem glycogen va giup ban ket thuc cuoc dua mot cach manh me nhat.',
  image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80",
  category: "Giao an MAF",
  readTime: "10 Phut doc",
  authorName: "HLV. Minh Phuong",
  authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
  date: "29 Thang 3, 2026",
  href: "/maf/blog/giai-ma-buc-tuong-30km",
};

interface Props {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

export default async function MafBlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(parseInt(params.page || "1", 10), 1);
  const category = params.category || undefined;
  const search = params.search || undefined;

  // Fetch published posts from DB
  let posts: MafBlogPost[] = [];
  let totalPages = 1;

  try {
    const where: Record<string, unknown> = {
      status: "published",
      parentPostId: null,
    };
    if (category) where.categories = { has: category };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [dbPosts, total] = await Promise.all([
      prisma.cmaPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          categories: true,
          publishedAt: true,
          author: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.cmaPost.count({ where }),
    ]);

    if (dbPosts.length > 0) {
      posts = dbPosts.map((p) => ({
        ...p,
        publishedAt: p.publishedAt?.toISOString() || null,
      }));
      totalPages = Math.ceil(total / POSTS_PER_PAGE);
    }
  } catch {
    // DB might not be available — fall through to placeholders
  }

  // Use placeholders when no published posts exist
  const showPlaceholders = posts.length === 0 && page === 1 && !category && !search;
  const displayPosts = showPlaceholders ? PLACEHOLDER_POSTS : posts;
  const displayTotalPages = showPlaceholders ? 1 : totalPages;
  const featured = FEATURED_PLACEHOLDER;

  return (
    <div className="bg-maf-surface text-maf-ink-dark font-maf-body antialiased selection:bg-maf-primary/20 selection:text-maf-primary relative overflow-x-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-maf-primary/10 rounded-full mix-blend-multiply blur-[80px] opacity-70 animate-maf-blob" />
        <div
          className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-maf-secondary/10 rounded-full mix-blend-multiply blur-[80px] opacity-70 animate-maf-blob"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <MafNavbar />

      <main className="min-h-screen pt-32 lg:pt-40">
        {/* Header & Search/Filter */}
        <section className="px-6 lg:px-12 max-w-[1440px] mx-auto animate-maf-fade-in-up">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-maf-display italic font-black text-4xl md:text-6xl uppercase tracking-tighter text-maf-ink-dark mb-4">
              Thu vien{" "}
              <span className="bg-gradient-to-br from-maf-primary to-maf-secondary bg-clip-text text-transparent">
                Kien Thuc
              </span>
            </h1>
            <p className="text-maf-ink-light font-maf-body text-base md:text-lg">
              Cap nhat nhung bai viet chuyen sau moi nhat ve phuong phap chay MAF, meo phuc hoi, giao an dinh duong va review trang bi.
            </p>
          </div>

          <MafBlogFilters categories={CATEGORIES} activeCategory={category} />
        </section>

        {/* Featured Post */}
        <section
          className="px-6 lg:px-12 max-w-[1440px] mx-auto mb-16 animate-maf-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <Link
            href={featured.href}
            className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] group cursor-pointer flex flex-col lg:flex-row h-auto lg:h-[450px]"
          >
            {/* Image */}
            <div className="lg:w-3/5 h-64 lg:h-full relative overflow-hidden">
              <Image
                src={featured.image}
                alt="Featured Article"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maf-ink-dark/60 via-transparent to-transparent lg:hidden" />
              <div className="absolute top-6 left-6 bg-maf-primary text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                Bai noi bat
              </div>
            </div>
            {/* Content */}
            <div className="lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-maf-primary/5 blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 text-xs font-maf-display font-bold uppercase tracking-widest text-maf-ink-light">
                <span className="text-maf-secondary">{featured.category}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{featured.readTime}</span>
              </div>
              <h2 className="font-maf-display font-black text-2xl lg:text-3xl text-maf-ink-dark mb-4 leading-snug group-hover:text-maf-primary transition-colors">
                {featured.title}
              </h2>
              <p className="text-maf-ink-light font-maf-body text-base mb-8 line-clamp-3">
                {featured.excerpt}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <Image
                    src={featured.authorAvatar}
                    alt="Author"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-maf-surface"
                  />
                  <div>
                    <p className="font-maf-display font-bold text-sm text-maf-ink-dark leading-none">
                      {featured.authorName}
                    </p>
                    <p className="font-maf-body text-xs text-maf-ink-light mt-1">{featured.date}</p>
                  </div>
                </div>
                <span className="w-10 h-10 rounded-full bg-maf-surface-alt flex items-center justify-center text-maf-ink-dark group-hover:bg-maf-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Grid Blog Posts */}
        <section
          className="px-6 lg:px-12 py-10 max-w-[1440px] mx-auto bg-maf-surface-alt rounded-[3rem] animate-maf-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex justify-between items-end mb-10 px-4">
            <h3 className="font-maf-display italic font-black text-3xl uppercase tracking-tighter text-maf-ink-dark">
              Bai viet moi nhat
            </h3>
          </div>

          {displayPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {displayPosts.map((post) => (
                <MafBlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-maf-ink-light/30 mb-4 block">
                article
              </span>
              <p className="font-maf-display font-bold text-xl text-maf-ink-light">
                Chua co bai viet nao
              </p>
              <p className="font-maf-body text-sm text-maf-ink-light/70 mt-2">
                Hay thu tim kiem voi tu khoa khac.
              </p>
            </div>
          )}

          {/* Pagination */}
          {displayTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 pb-6">
              {Array.from({ length: Math.min(displayTotalPages, 5) }, (_, i) => i + 1).map(
                (p) => (
                  <Link
                    key={p}
                    href={`/maf/blog?page=${p}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                    className={
                      p === page
                        ? "w-10 h-10 rounded-xl bg-maf-ink-dark text-white font-maf-display font-bold text-sm shadow-md flex items-center justify-center"
                        : "w-10 h-10 rounded-xl bg-white text-maf-ink-dark hover:bg-maf-surface-alt border border-gray-200 font-maf-display font-bold text-sm transition-colors flex items-center justify-center"
                    }
                  >
                    {p}
                  </Link>
                )
              )}
              {displayTotalPages > 5 && (
                <>
                  <span className="text-maf-ink-light px-1">...</span>
                  <Link
                    href={`/maf/blog?page=${displayTotalPages}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                    className="w-10 h-10 rounded-xl bg-white text-maf-ink-dark hover:bg-maf-surface-alt border border-gray-200 font-maf-display font-bold text-sm transition-colors flex items-center justify-center"
                  >
                    {displayTotalPages}
                  </Link>
                </>
              )}
              {page < displayTotalPages && (
                <Link
                  href={`/maf/blog?page=${page + 1}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                  className="w-10 h-10 rounded-xl bg-white text-maf-ink-dark hover:text-maf-primary border border-gray-200 font-maf-display font-bold transition-colors flex items-center justify-center group ml-2"
                >
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Newsletter */}
        <MafNewsletterSection />
      </main>

      <MafFooter />
    </div>
  );
}
