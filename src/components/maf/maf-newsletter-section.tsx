// MAF Running Club — newsletter subscription CTA section
"use client";

export function MafNewsletterSection() {
  return (
    <section className="py-24 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="bg-gradient-to-br from-maf-ink-dark to-[#1E293B] rounded-[3rem] p-10 lg:p-16 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Decorative blurs */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-maf-primary/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-maf-secondary/30 rounded-full blur-[80px]" />

        <div className="md:w-1/2 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-maf-display font-bold text-xs uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm text-maf-primary">mark_email_unread</span>
            Ban tin hang tuan
          </div>
          <h2 className="font-maf-display italic font-black text-3xl lg:text-5xl uppercase text-white mb-4 tracking-tight">
            Dung bo lo <br />bai viet nao
          </h2>
          <p className="text-white/70 font-maf-body text-base lg:text-lg">
            Tham gia cung 10,000+ runner khac nhan kien thuc va giao an mien phi vao moi sang thu Hai.
          </p>
        </div>

        <div className="md:w-1/2 w-full relative z-10">
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Dia chi email cua ban..."
              className="w-full bg-white/10 border border-white/20 focus:border-maf-primary focus:bg-white/20 focus:ring-4 focus:ring-maf-primary/20 rounded-2xl font-maf-body text-white placeholder-white/50 p-4 transition-all outline-none backdrop-blur-md"
              required
            />
            <button
              type="submit"
              className="bg-maf-primary hover:bg-maf-primary-hover text-white font-maf-display font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-maf-primary/30 transition-all whitespace-nowrap"
            >
              Dang ky ngay
            </button>
          </form>
          <p className="text-white/40 text-xs font-maf-body mt-4 text-center sm:text-left flex items-center gap-1 justify-center sm:justify-start">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Khong spam, huy dang ky bat cu luc nao.
          </p>
        </div>
      </div>
    </section>
  );
}
