// MAF Running Club — top navigation bar with glass morphism effect
"use client";

import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Trang chu", href: "/maf" },
  { label: "Su kien", href: "/maf/events" },
  { label: "Ban do", href: "/maf/map" },
  { label: "Cua hang", href: "/maf/shop" },
  { label: "Blog", href: "/maf/blog", active: true },
  { label: "Lien he", href: "/maf/contact" },
];

export function MafNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-white/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-all duration-300">
      <div className="flex justify-between items-center px-6 lg:px-12 py-4 w-full max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link
          href="/maf"
          className="text-2xl font-maf-display font-black italic tracking-tighter uppercase flex items-center gap-3 group"
        >
          <Image
            src="https://cdn.tonytechlab.com/2026/03/29045249/maflogo.png"
            alt="MAF Running Community Logo"
            width={80}
            height={80}
            className="h-16 w-16 md:h-20 md:w-20 rounded-full object-contain shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          <span className="hidden sm:block bg-gradient-to-br from-maf-primary to-maf-secondary bg-clip-text text-transparent">
            MAF <span className="text-maf-ink-dark font-bold">RUNNING CLUB</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex gap-10 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.active
                  ? "font-maf-display font-bold text-sm tracking-wide text-maf-secondary relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-maf-secondary after:rounded-full"
                  : "font-maf-display font-bold text-sm tracking-wide text-maf-ink-dark hover:text-maf-primary transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button className="text-maf-ink-dark hover:text-maf-primary transition-colors hidden sm:block">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="text-maf-ink-dark hover:text-maf-primary transition-colors relative">
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-maf-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              2
            </span>
          </button>
          <button className="hidden lg:flex items-center justify-center gap-2 bg-maf-ink-dark text-white px-5 py-2.5 rounded-full font-maf-display font-bold text-sm hover:bg-maf-primary transition-colors shadow-lg shadow-maf-ink-dark/20 hover:shadow-maf-primary/30">
            Dang nhap
          </button>
          {/* Mobile Menu Toggle */}
          <button className="lg:hidden text-maf-ink-dark">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
