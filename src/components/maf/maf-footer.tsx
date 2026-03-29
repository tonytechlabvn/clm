// MAF Running Club — site footer with links and social icons
import Image from "next/image";
import Link from "next/link";

const SECTIONS = [
  { label: "Ve chung toi", href: "#" },
  { label: "Phuong phap MAF", href: "#" },
  { label: "Cua hang trang bi", href: "#" },
  { label: "Blog kien thuc", href: "/maf/blog" },
];

const SUPPORT = [
  { label: "Trung tam tro giup", href: "#" },
  { label: "Chinh sach bao mat", href: "#" },
  { label: "Dieu khoan su dung", href: "#" },
];

export function MafFooter() {
  return (
    <footer className="bg-maf-ink-dark w-full pt-20 pb-10 border-t border-white/5 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 px-6 lg:px-12 w-full max-w-[1440px] mx-auto mb-16">
        {/* Brand column */}
        <div className="lg:col-span-2">
          <Link href="/maf" className="flex items-center gap-4 mb-6 group w-fit">
            <Image
              src="https://cdn.tonytechlab.com/2026/03/29045249/maflogo.png"
              alt="MAF Running Community Logo"
              width={96}
              height={96}
              className="h-20 w-20 md:h-24 md:w-24 rounded-full object-contain bg-white shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-3xl font-maf-display font-black italic tracking-tighter text-white uppercase">
              MAF <span className="text-maf-primary">RUNNING CLUB</span>
            </span>
          </Link>
          <p className="text-white/60 max-w-sm mb-8 font-maf-body leading-relaxed text-sm">
            Xay dung cong dong chay bo chuyen nghiep dua tren khoa hoc nhip tim va hieu nang hieu khi. Chinh phuc gioi han moi cung MAF.
          </p>
          <div className="flex gap-3">
            {["share", "public", "smart_display"].map((icon) => (
              <a
                key={icon}
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-maf-primary flex items-center justify-center transition-all duration-300"
              >
                <span className="material-symbols-outlined text-white text-sm">{icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Sections column */}
        <div>
          <h4 className="font-maf-display text-sm font-bold text-white uppercase tracking-widest mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-1/2 after:h-0.5 after:bg-maf-secondary">
            Phan he
          </h4>
          <ul className="space-y-4">
            {SECTIONS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-white/60 hover:text-white transition-colors font-maf-body text-sm flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-maf-primary" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support column */}
        <div>
          <h4 className="font-maf-display text-sm font-bold text-white uppercase tracking-widest mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-1/2 after:h-0.5 after:bg-maf-primary">
            Ho tro
          </h4>
          <ul className="space-y-4">
            {SUPPORT.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-white/60 hover:text-white transition-colors font-maf-body text-sm">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center border-t border-white/10 pt-8 px-6">
        <p className="font-maf-display text-xs tracking-widest uppercase text-white/40">
          &copy; 2024 MAF RUNNING CLUB. THIET KE DOC QUYEN.
        </p>
      </div>
    </footer>
  );
}
