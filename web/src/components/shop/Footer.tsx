import Link from "next/link";
import { Banknote, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FacebookIcon, WhatsAppIcon } from "@/components/BrandIcons";
import type { StoreSettings } from "@/lib/types";

export function TrustStrip() {
  const items = [
    { icon: Truck, title: "দ্রুত ডেলিভারি", text: "সারা বাংলাদেশে" },
    { icon: Banknote, title: "ক্যাশ অন ডেলিভারি", text: "পণ্য হাতে পেয়ে পেমেন্ট" },
    { icon: RotateCcw, title: "সহজ রিটার্ন", text: "ত্রুটিপূর্ণ পণ্যে" },
    { icon: ShieldCheck, title: "মানসম্মত পণ্য", text: "যাচাই করা কোয়ালিটি" },
  ];
  return (
    <section aria-label="আমাদের সুবিধা" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 sm:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-dark sm:h-12 sm:w-12"><Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" /></span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-navy sm:text-[0.95rem]">{title}</span>
            <span className="block text-xs text-muted">{text}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

export function Footer({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 bg-navy text-white/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo variant="light" size={44} />
          <p className="text-sm leading-relaxed">প্রয়োজনের সবকিছু, এক জায়গায়। মানসম্মত পণ্য · সাশ্রয়ী দাম · দ্রুত ডেলিভারি।</p>
          <p className="text-sm font-semibold text-cyan">সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</p>
          <div className="flex gap-2 pt-1">
            <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-[#1877F2]"><FacebookIcon size={18} /></a>
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-[#1fa855]"><WhatsAppIcon size={18} /></a>
          </div>
        </div>
        <nav aria-label="তথ্য">
          <h2 className="mb-3 font-semibold text-white">তথ্য</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-cyan" href="/page/about">আমাদের সম্পর্কে</Link></li>
            <li><Link className="hover:text-cyan" href="/page/terms">শর্তাবলী</Link></li>
            <li><Link className="hover:text-cyan" href="/page/privacy">প্রাইভেসি পলিসি</Link></li>
            <li><Link className="hover:text-cyan" href="/page/return-policy">রিটার্ন পলিসি</Link></li>
            <li><Link className="hover:text-cyan" href="/page/delivery-policy">ডেলিভারি পলিসি</Link></li>
          </ul>
        </nav>
        <nav aria-label="গ্রাহক সেবা">
          <h2 className="mb-3 font-semibold text-white">গ্রাহক সেবা</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-cyan" href="/track-order">অর্ডার ট্র্যাক করুন</Link></li>
            <li><Link className="hover:text-cyan" href="/account">আমার অ্যাকাউন্ট</Link></li>
            <li><Link className="hover:text-cyan" href="/wishlist">উইশলিস্ট</Link></li>
            <li><Link className="hover:text-cyan" href="/products">সব পণ্য</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 font-semibold text-white">যোগাযোগ</h2>
          <ul className="space-y-2.5 text-sm">
            <li><a href={`tel:${settings.phone}`} className="font-display flex items-center gap-2 hover:text-cyan"><Phone className="h-4 w-4 text-cyan" aria-hidden="true" />{settings.phone}</a></li>
            <li><a href={`https://wa.me/${settings.whatsapp}`} className="flex items-center gap-2 hover:text-cyan"><WhatsAppIcon size={16} className="text-cyan" />WhatsApp-এ মেসেজ</a></li>
            {settings.email && <li><a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-cyan"><Mail className="h-4 w-4 text-cyan" aria-hidden="true" />{settings.email}</a></li>}
            {settings.address && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan" aria-hidden="true" />{settings.address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[0.72rem] font-semibold" aria-label="পেমেন্ট ও কুরিয়ার">
            {["Cash on Delivery", "bKash", "Steadfast", "Pathao", "RedX"].map((x) => (
              <span key={x} className="font-display rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/85">{x}</span>
            ))}
          </div>
          <p className="text-xs text-white/60">© {year} MRM Zone · mrmzone.shop · সর্বস্বত্ব সংরক্ষিত</p>
        </div>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp({ whatsapp }: { whatsapp: string }) {
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp-এ যোগাযোগ করুন"
      className="fixed right-4 bottom-20 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#1fa855] text-white shadow-pop hover:scale-105 md:bottom-6"
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
