/**
 * Demo catalog + admin data. Used ONLY when NEXT_PUBLIC_DEMO_MODE=true
 * (see lib/demo-api.ts) so the owner can preview the shop without the Laravel API.
 */
import type {
  Banner, Brand, Category, CmsPage, Coupon, Expense, IncompleteOrder, LandingPage,
  Order, OrderStatus, Product, ProductCard, ProductVariant, Review, StoreSettings,
  Supplier, Staff, AdminSettings, AdminProduct, SmsLog, Purchase, StockMovement,
} from "./types";
import { STATUS_LABELS } from "./format";

export const demoSettings: StoreSettings = {
  name: "MRM Zone Shop",
  logo: null,
  phone: "01302919979",
  whatsapp: "8801302919979",
  email: "support@mrmzone.shop",
  address: "ঢাকা, বাংলাদেশ",
  facebook: "https://facebook.com/mrmzoneshop",
  delivery: { inside_dhaka: 70, outside_dhaka: 130, free_delivery_min_qty: 2 },
  payment_methods: ["cod"],
  announcement: "শীতের অফার চলছে! ২টি পণ্য অর্ডারে ডেলিভারি চার্জ ফ্রি 🎉 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
  meta_pixel_id: null,
  gtm_id: null,
};

export const demoCategories: Category[] = [
  { id: 1, name: "ফ্যাশন", slug: "fashion", icon: "shirt", image: null, parent_id: null, products_count: 3, children: [] },
  { id: 2, name: "লাইফস্টাইল", slug: "lifestyle", icon: "bag", image: null, parent_id: null, products_count: 2, children: [] },
  { id: 3, name: "অ্যাক্সেসরিজ", slug: "accessories", icon: "watch", image: null, parent_id: null, products_count: 2, children: [] },
  { id: 4, name: "গ্যাজেট", slug: "gadget", icon: "headphones", image: null, parent_id: null, products_count: 2, children: [] },
  { id: 5, name: "হোম ও লিভিং", slug: "home-living", icon: "home", image: null, parent_id: null, products_count: 3, children: [] },
  { id: 6, name: "সিজনাল", slug: "seasonal", icon: "snowflake", image: null, parent_id: null, products_count: 3, children: [] },
];

export const demoBrands: Brand[] = [
  { id: 1, name: "MRM Zone", slug: "mrm-zone", logo: null, is_active: true },
  { id: 2, name: "UrbanFit", slug: "urbanfit", logo: null, is_active: true },
  { id: 3, name: "SoundMax", slug: "soundmax", logo: null, is_active: true },
];

interface Seed {
  id: number; name: string; slug: string; cat: number; price: number; sale: number | null;
  cost: number; stock: number; badge: string | null; rating: number; reviews: number;
  short: string; points: string[]; colors?: string[]; sizes?: string[]; sizeChart?: boolean;
}

const seeds: Seed[] = [
  { id: 1, name: "ফ্লিস হুডি", slug: "fleece-hoodie", cat: 1, price: 890, sale: 790, cost: 480, stock: 42, badge: "Best Seller", rating: 4.7, reviews: 18,
    short: "নরম ও গরম ফ্লিস কাপড়ের প্রিমিয়াম হুডি — শীতের প্রতিদিনের সঙ্গী।",
    points: ["৩২০ জিএসএম প্রিমিয়াম ফ্লিস", "ভেতরে নরম ব্রাশড লাইনিং", "কাঙ্গারু পকেট ও অ্যাডজাস্টেবল হুড", "ধোয়ার পরও রং ঠিক থাকে"],
    colors: ["কালো", "অ্যাশ", "নেভি"], sizes: ["M", "L", "XL"], sizeChart: true },
  { id: 2, name: "শীতের শাল (কাশ্মীরি স্টাইল)", slug: "winter-shawl", cat: 6, price: 1250, sale: 950, cost: 560, stock: 30, badge: "Hot", rating: 4.8, reviews: 26,
    short: "হালকা কিন্তু উষ্ণ — নকশা করা প্রিমিয়াম উলের শাল।",
    points: ["সফট উল ব্লেন্ড", "৯০ x ২০০ সেমি বড় সাইজ", "পুরুষ-মহিলা দুজনেরই জন্য", "উপহার দেওয়ার উপযোগী প্যাকেজিং"],
    colors: ["মেরুন", "ক্রিম", "অলিভ"] },
  { id: 3, name: "উইন্টার কম্বো সেট (টুপি + মাফলার + গ্লাভস)", slug: "winter-combo-set", cat: 6, price: 1990, sale: 1490, cost: 820, stock: 25, badge: "Combo", rating: 4.9, reviews: 34,
    short: "৩টি শীতের প্রয়োজনীয় পণ্য একসাথে, সাশ্রয়ী কম্বো দামে।",
    points: ["নিটেড উলের টুপি", "লম্বা নরম মাফলার", "টাচস্ক্রিন সাপোর্টেড গ্লাভস", "আলাদা কেনার চেয়ে ৫০০ টাকা সাশ্রয়"],
    colors: ["কালো", "গ্রে", "ব্রাউন"] },
  { id: 4, name: "বাইক উইন্টার গ্লাভস", slug: "bike-winter-gloves", cat: 3, price: 650, sale: 490, cost: 230, stock: 60, badge: "New", rating: 4.5, reviews: 12,
    short: "ওয়াটার রেজিস্ট্যান্ট, উইন্ডপ্রুফ — শীতে বাইক চালানোর জন্য পারফেক্ট।",
    points: ["উইন্ডপ্রুফ ও ওয়াটার রেজিস্ট্যান্ট", "টাচস্ক্রিন ফিঙ্গারটিপ", "অ্যান্টি-স্লিপ গ্রিপ", "ভেতরে থার্মাল লাইনিং"],
    sizes: ["M", "L", "XL"], sizeChart: true },
  { id: 5, name: "প্রিমিয়াম পোলো টি-শার্ট", slug: "premium-polo-tshirt", cat: 1, price: 750, sale: 590, cost: 300, stock: 80, badge: null, rating: 4.4, reviews: 9,
    short: "১০০% কটন পিকে ফেব্রিক — অফিস ও ক্যাজুয়াল দুই জায়গাতেই মানানসই।",
    points: ["১০০% কম্বড কটন", "এমব্রয়ডারি লোগো", "আরামদায়ক রেগুলার ফিট"],
    colors: ["সাদা", "নেভি", "মেরুন"], sizes: ["M", "L", "XL", "XXL"], sizeChart: true },
  { id: 6, name: "জেনুইন লেদার ওয়ালেট", slug: "leather-wallet", cat: 3, price: 990, sale: 690, cost: 310, stock: 4, badge: null, rating: 4.6, reviews: 15,
    short: "আসল চামড়ার স্লিম ওয়ালেট, ৮টি কার্ড স্লট সহ।",
    points: ["১০০% জেনুইন লেদার", "RFID ব্লকিং", "৮ কার্ড স্লট + কয়েন পকেট"] },
  { id: 7, name: "স্মার্ট ওয়াচ T500 Pro", slug: "smart-watch-t500", cat: 4, price: 2500, sale: 1850, cost: 1100, stock: 18, badge: "Best Seller", rating: 4.3, reviews: 22,
    short: "ব্লুটুথ কলিং, হার্ট রেট ও স্টেপ ট্র্যাকিং সহ ফুল টাচ স্মার্ট ওয়াচ।",
    points: ["১.৮৫\" ফুল টাচ ডিসপ্লে", "ব্লুটুথ কলিং", "৭ দিন ব্যাটারি ব্যাকআপ", "IP67 ওয়াটার রেজিস্ট্যান্ট"],
    colors: ["কালো", "সিলভার"] },
  { id: 8, name: "ওয়্যারলেস ইয়ারবাডস Air Pro", slug: "wireless-earbuds", cat: 4, price: 1990, sale: 1290, cost: 720, stock: 3, badge: "Deal", rating: 4.2, reviews: 31,
    short: "ENC নয়েজ ক্যান্সেলেশন ও ৩০ ঘণ্টা প্লেটাইম।",
    points: ["ব্লুটুথ ৫.৩", "ENC নয়েজ ক্যান্সেলেশন", "৩০ ঘণ্টা মোট প্লেটাইম", "টাইপ-সি ফাস্ট চার্জিং"] },
  { id: 9, name: "ট্রাভেল ব্যাকপ্যাক (USB পোর্ট)", slug: "travel-backpack", cat: 2, price: 1850, sale: 1450, cost: 760, stock: 22, badge: null, rating: 4.6, reviews: 11,
    short: "ল্যাপটপ কম্পার্টমেন্ট ও USB চার্জিং পোর্ট সহ ওয়াটারপ্রুফ ব্যাকপ্যাক।",
    points: ["১৫.৬\" ল্যাপটপ পকেট", "USB চার্জিং পোর্ট", "ওয়াটার রেজিস্ট্যান্ট কাপড়"], colors: ["কালো", "গ্রে"] },
  { id: 10, name: "কটন বেডশিট সেট (কিং সাইজ)", slug: "cotton-bedsheet-set", cat: 5, price: 2200, sale: 1690, cost: 900, stock: 15, badge: null, rating: 4.7, reviews: 14,
    short: "১টি বেডশিট + ২টি বালিশের কভার, নরম টুইল কটন।",
    points: ["১০০% টুইল কটন", "কিং সাইজ ৯০ x ১০০ ইঞ্চি", "রং ওঠে না"] },
  { id: 11, name: "এলইডি ডেস্ক ল্যাম্প (রিচার্জেবল)", slug: "led-desk-lamp", cat: 5, price: 1200, sale: 890, cost: 420, stock: 2, badge: "New", rating: 4.5, reviews: 7,
    short: "৩ লেভেল ব্রাইটনেস, চোখের আরামের জন্য ফ্লিকার-ফ্রি আলো।",
    points: ["টাচ কন্ট্রোল", "১২০০ mAh ব্যাটারি", "ফোল্ডেবল ডিজাইন"] },
  { id: 12, name: "মাল্টিপারপাস কিচেন অর্গানাইজার", slug: "kitchen-organizer", cat: 5, price: 850, sale: null, cost: 380, stock: 35, badge: null, rating: 4.1, reviews: 5,
    short: "রান্নাঘর গোছানোর জন্য ২-স্তরের মজবুত র‍্যাক।",
    points: ["রাস্ট-ফ্রি মেটাল", "সহজে অ্যাসেম্বল", "জায়গা বাঁচায়"] },
  { id: 13, name: "উলের কানটুপি", slug: "wool-beanie", cat: 6, price: 350, sale: 250, cost: 90, stock: 120, badge: null, rating: 4.4, reviews: 19,
    short: "নরম নিটেড উলের টুপি, কান পর্যন্ত ঢেকে রাখে।",
    points: ["স্ট্রেচেবল ফ্রি সাইজ", "ডাবল লেয়ার উষ্ণতা"], colors: ["কালো", "মেরুন", "নেভি"] },
  { id: 14, name: "স্টেইনলেস স্টিল ওয়াটার বোতল", slug: "steel-water-bottle", cat: 2, price: 690, sale: 490, cost: 210, stock: 50, badge: null, rating: 4.6, reviews: 10,
    short: "ডাবল ওয়াল ইনসুলেটেড — ১২ ঘণ্টা গরম, ২৪ ঘণ্টা ঠান্ডা।",
    points: ["৭৫০ মিলি", "BPA ফ্রি", "লিক-প্রুফ ঢাকনা"] },
  { id: 15, name: "মেনস জগার প্যান্ট", slug: "mens-jogger-pant", cat: 1, price: 990, sale: 750, cost: 360, stock: 40, badge: null, rating: 4.3, reviews: 8,
    short: "স্ট্রেচেবল কটন টেরি — ঘরে-বাইরে আরামদায়ক।",
    points: ["কটন টেরি ফেব্রিক", "জিপার পকেট", "ইলাস্টিক কোমর"], colors: ["কালো", "অ্যাশ"], sizes: ["M", "L", "XL"], sizeChart: true },
];

const SIZE_CHART = `<table><thead><tr><th>সাইজ</th><th>বুক (ইঞ্চি)</th><th>লম্বা (ইঞ্চি)</th><th>হাতা (ইঞ্চি)</th></tr></thead><tbody>
<tr><td>M</td><td>38</td><td>27</td><td>24</td></tr><tr><td>L</td><td>40</td><td>28</td><td>25</td></tr>
<tr><td>XL</td><td>42</td><td>29</td><td>25.5</td></tr><tr><td>XXL</td><td>44</td><td>30</td><td>26</td></tr></tbody></table>`;

function cardOf(s: Seed): ProductCard {
  const cat = demoCategories.find((c) => c.id === s.cat)!;
  const final = s.sale ?? s.price;
  return {
    id: s.id, name: s.name, slug: s.slug, image: null,
    price: s.price, sale_price: s.sale, final_price: final,
    discount_percent: s.sale ? Math.round(((s.price - s.sale) / s.price) * 100) : 0,
    in_stock: s.stock > 0, rating: s.rating, reviews_count: s.reviews, badge: s.badge,
    category: { id: cat.id, name: cat.name, slug: cat.slug }, stock: s.stock,
  };
}

function variantsOf(s: Seed): ProductVariant[] {
  const colors = s.colors ?? [null];
  const sizes = s.sizes ?? [null];
  if (!s.colors && !s.sizes) return [];
  const out: ProductVariant[] = [];
  let i = 0;
  for (const c of colors) for (const z of sizes) {
    i++;
    const attributes: Record<string, string> = {};
    if (c) attributes.color = c;
    if (z) attributes.size = z;
    out.push({
      id: s.id * 100 + i,
      name: [c, z].filter(Boolean).join(" / "),
      attributes,
      price: (s.sale ?? s.price) + (z === "XXL" ? 50 : 0),
      stock: Math.max(0, Math.round(s.stock / (colors.length * sizes.length)) + ((i % 3) - 1)),
      sku: `${s.slug.slice(0, 3).toUpperCase()}-${String(s.id).padStart(3, "0")}-${i}`,
    });
  }
  return out;
}

export const demoProducts: AdminProduct[] = seeds.map((s) => {
  const card = cardOf(s);
  const options: Record<string, string[]> = {};
  if (s.colors) options.color = s.colors;
  if (s.sizes) options.size = s.sizes;
  const p: AdminProduct = {
    ...card,
    sku: `MRM-${String(s.id).padStart(3, "0")}`,
    short_description: s.short,
    description: `<p>${s.short}</p><h3>বৈশিষ্ট্য</h3><ul>${s.points.map((x) => `<li>${x}</li>`).join("")}</ul><p>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন।</p>`,
    images: [],
    stock: s.stock,
    variants: variantsOf(s),
    options,
    size_chart: s.sizeChart ? SIZE_CHART : null,
    video_url: null,
    meta_title: `${s.name} — MRM Zone Shop`,
    meta_description: s.short,
    related: [],
    cost_price: s.cost,
    status: "active",
    is_featured: s.badge === "Best Seller",
    category_id: s.cat,
    brand_id: s.cat === 4 ? 3 : s.cat === 1 ? 2 : 1,
  };
  return p;
});

export function demoCard(p: Product): ProductCard {
  return {
    id: p.id, name: p.name, slug: p.slug, image: p.image, price: p.price, sale_price: p.sale_price,
    final_price: p.final_price, discount_percent: p.discount_percent, in_stock: p.in_stock,
    rating: p.rating, reviews_count: p.reviews_count, badge: p.badge, category: p.category, stock: p.stock,
    has_variants: (p.variants?.length ?? 0) > 0,
  };
}

export const demoBanners: Banner[] = [
  { id: 1, title: "শীতের মেগা অফার", subtitle: "হুডি, শাল ও কম্বো সেটে ৪০% পর্যন্ত ছাড়", image: null, link: "/category/seasonal", button_text: "এখনই কিনুন", position: "slider", sort_order: 1, is_active: true },
  { id: 2, title: "উইন্টার কম্বো সেট", subtitle: "টুপি + মাফলার + গ্লাভস মাত্র ৳১৪৯০", image: null, link: "/product/winter-combo-set", button_text: "অর্ডার করুন", position: "slider", sort_order: 2, is_active: true },
  { id: 3, title: "স্মার্ট গ্যাজেট", subtitle: "স্মার্ট ওয়াচ ও ইয়ারবাডসে বিশেষ ছাড়", image: null, link: "/category/gadget", button_text: "দেখুন", position: "slider", sort_order: 3, is_active: true },
  { id: 4, title: "ফ্রি ডেলিভারি", subtitle: "২টি পণ্য অর্ডারে", image: null, link: "/products", button_text: "শপ করুন", position: "side", sort_order: 4, is_active: true },
  { id: 5, title: "নতুন কালেকশন", subtitle: "ফ্যাশন ও লাইফস্টাইল", image: null, link: "/category/fashion", button_text: "দেখুন", position: "side", sort_order: 5, is_active: true },
];

const reviewNames = ["সাকিব হাসান", "নুসরাত জাহান", "মাহমুদুল ইসলাম", "তানিয়া আক্তার", "রাকিব হোসেন", "ফারহানা ইয়াসমিন"];
const reviewTexts = [
  "পণ্যের মান খুবই ভালো, ছবির মতোই পেয়েছি। ডেলিভারিও দ্রুত হয়েছে।",
  "দাম অনুযায়ী অসাধারণ। আবার অর্ডার করবো ইনশাআল্লাহ।",
  "প্যাকেজিং সুন্দর ছিল, সাইজ একদম পারফেক্ট।",
  "কাপড় অনেক নরম আর গরম। ধন্যবাদ MRM Zone!",
  "২ দিনে ঢাকার বাইরে ডেলিভারি পেয়েছি, ক্যাশ অন ডেলিভারি সুবিধা দারুণ।",
];

export const demoReviews: Review[] = demoProducts.flatMap((p, pi) =>
  [0, 1, 2].map((k) => ({
    id: pi * 10 + k + 1,
    name: reviewNames[(pi + k) % reviewNames.length],
    rating: k === 2 ? 4 : 5,
    comment: reviewTexts[(pi + k) % reviewTexts.length],
    created_at: new Date(Date.now() - (pi + k + 1) * 86400000 * 2).toISOString(),
    is_approved: k !== 2 || pi % 2 === 0,
    product: { id: p.id, name: p.name, slug: p.slug },
  })),
);

export const demoPages: CmsPage[] = [
  { id: 1, slug: "about", title: "আমাদের সম্পর্কে", is_active: true, content: "<p>MRM Zone Shop একটি বাংলাদেশি অনলাইন শপ। আমাদের লক্ষ্য — প্রয়োজনের সবকিছু এক জায়গায়, মানসম্মত পণ্য ও সাশ্রয়ী দামে, দ্রুত ডেলিভারিতে।</p><p>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।</p>" },
  { id: 2, slug: "terms", title: "শর্তাবলী", is_active: true, content: "<p>অর্ডার কনফার্ম করার আগে আমাদের প্রতিনিধি ফোন করে নিশ্চিত করবেন। ভুল তথ্য দিয়ে অর্ডার করলে অর্ডার বাতিল হতে পারে।</p>" },
  { id: 3, slug: "privacy", title: "প্রাইভেসি পলিসি", is_active: true, content: "<p>আপনার নাম, ফোন নম্বর ও ঠিকানা শুধুমাত্র অর্ডার ডেলিভারির জন্য ব্যবহার করা হয়। আমরা কোনো তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি করি না।</p>" },
  { id: 4, slug: "return-policy", title: "রিটার্ন পলিসি", is_active: true, content: "<p>পণ্যে ত্রুটি থাকলে বা ভুল পণ্য পেলে ডেলিভারিম্যানের সামনেই চেক করে রিটার্ন করতে পারবেন। পরবর্তীতে ৩ দিনের মধ্যে আমাদের জানাতে হবে।</p>" },
  { id: 5, slug: "delivery-policy", title: "ডেলিভারি পলিসি", is_active: true, content: "<p>ঢাকার ভিতরে ১-২ দিন, ঢাকার বাইরে ২-৪ দিনের মধ্যে ডেলিভারি। ঢাকার ভিতরে ৭০ টাকা, বাইরে ১৩০ টাকা ডেলিভারি চার্জ।</p>" },
];

export function demoLanding(): LandingPage {
  const product = demoProducts.find((p) => p.slug === "winter-combo-set")!;
  return {
    id: 1, title: "উইন্টার কম্বো অফার", slug: "winter-combo", product_id: product.id, is_active: true,
    headline: "এই শীতে পুরো পরিবারের উষ্ণতা — উইন্টার কম্বো সেট",
    subheadline: "টুপি + মাফলার + গ্লাভস — ৩টি পণ্য একসাথে মাত্র ৳১৪৯০। সারা দেশে ক্যাশ অন ডেলিভারি।",
    hero_image: null, video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    offer_text: "অফার সীমিত সময়ের জন্য — আজই অর্ডার করুন!",
    theme_color: "#078080",
    sections: [
      { type: "features", title: "কেন এই কম্বো সেট?", items: [
        { title: "প্রিমিয়াম উল", text: "নরম ও আরামদায়ক, ত্বকে চুলকায় না" },
        { title: "টাচস্ক্রিন গ্লাভস", text: "গ্লাভস না খুলেই ফোন চালান" },
        { title: "৫০০ টাকা সাশ্রয়", text: "আলাদা কেনার চেয়ে কম দামে" },
        { title: "পণ্য দেখে পেমেন্ট", text: "হাতে পেয়ে চেক করে টাকা দিন" },
      ] },
      { type: "text", title: "অফারের বিস্তারিত", items: ["প্রতিটি সেটে থাকছে ১টি নিটেড উলের টুপি, ১টি লম্বা মাফলার ও ১ জোড়া টাচস্ক্রিন গ্লাভস। ৩টি রঙে পাওয়া যাচ্ছে।"] },
      { type: "gallery", title: "পণ্যের ছবি", items: ["", "", "", ""] },
      { type: "faq", title: "সাধারণ জিজ্ঞাসা", items: [
        { question: "ডেলিভারি কত দিনে পাবো?", answer: "ঢাকার ভিতরে ১-২ দিন, ঢাকার বাইরে ২-৪ দিন।" },
        { question: "পণ্য পছন্দ না হলে?", answer: "ডেলিভারিম্যানের সামনে চেক করে রিটার্ন করতে পারবেন।" },
        { question: "অগ্রিম টাকা দিতে হবে?", answer: "না, সম্পূর্ণ ক্যাশ অন ডেলিভারি।" },
      ] },
    ],
    product: { ...product, related: [] },
  };
}

export const demoCoupons: Coupon[] = [
  { id: 1, code: "WINTER10", type: "percent", value: 10, min_order: 1000, max_discount: 300, usage_limit: 500, used: 87, starts_at: null, ends_at: null, is_active: true },
  { id: 2, code: "MRM100", type: "fixed", value: 100, min_order: 1500, max_discount: null, usage_limit: null, used: 23, starts_at: null, ends_at: null, is_active: true },
];

const firstNames = ["রহিম", "করিম", "সুমাইয়া", "জান্নাত", "আরিফ", "মাহফুজ", "তাসলিমা", "শাহরিয়ার", "নাঈম", "রুবিনা", "ইমরান", "সাদিয়া", "হাসান", "মিতু", "তানভীর"];
const districts = ["Dhaka", "Gazipur", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Narayanganj", "Cumilla", "Bogura", "Rangpur"];
const statuses: OrderStatus[] = ["pending", "pending", "pending", "confirmed", "confirmed", "processing", "shipped", "shipped", "delivered", "delivered", "delivered", "delivered", "cancelled", "returned", "on_hold"];
const sources = ["web", "web", "web", "landing", "facebook", "pos", "manual"];

function pad(n: number, l = 2) { return String(n).padStart(l, "0"); }

export function buildDemoOrders(): Order[] {
  const out: Order[] = [];
  const now = Date.now();
  for (let i = 1; i <= 36; i++) {
    const created = new Date(now - ((i * 7) % 29) * 86400000 * 0.9 - i * 3600000);
    const st = statuses[i % statuses.length];
    const p1 = demoProducts[i % demoProducts.length];
    const p2 = demoProducts[(i * 3) % demoProducts.length];
    const items = [
      { id: i * 10 + 1, product_id: p1.id, variant_id: p1.variants[0]?.id ?? null, name: p1.name, variant: p1.variants[0]?.name ?? null, image: null, price: p1.final_price, quantity: 1 + (i % 2), total: 0 },
      ...(i % 3 === 0 ? [{ id: i * 10 + 2, product_id: p2.id, variant_id: null, name: p2.name, variant: null, image: null, price: p2.final_price, quantity: 1, total: 0 }] : []),
    ].map((it) => ({ ...it, total: it.price * it.quantity }));
    const qty = items.reduce((a, b) => a + b.quantity, 0);
    const district = districts[i % districts.length];
    const inside = district === "Dhaka";
    const subtotal = items.reduce((a, b) => a + b.total, 0);
    const delivery = qty >= 2 ? 0 : inside ? 70 : 130;
    const discount = i % 7 === 0 ? 100 : 0;
    const d = created;
    const number = `MRM-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(i, 4)}`;
    const courier = ["shipped", "delivered", "returned"].includes(st) ? (["steadfast", "pathao", "redx"] as const)[i % 3] : null;
    const history = [{ status: "pending", note: "Order placed", created_at: created.toISOString() }];
    if (st !== "pending") history.push({ status: st, note: st === "cancelled" ? "কাস্টমার ফোন ধরেননি" : null as unknown as string, created_at: new Date(created.getTime() + 5 * 3600000).toISOString() });
    out.push({
      id: 1000 + i, number, status: st, status_label: STATUS_LABELS[st],
      payment_method: "cod", payment_status: st === "delivered" ? "paid" : "unpaid",
      customer_name: `${firstNames[i % firstNames.length]} ${["আহমেদ", "খান", "ইসলাম", "চৌধুরী", "হোসেন"][i % 5]}`,
      phone: `01${[7, 8, 9, 6, 5, 3][i % 6]}${pad((i * 7919) % 100000000, 8)}`,
      address: `বাসা ${i}, রোড ${(i % 12) + 1}, ${inside ? "মিরপুর" : "সদর"}, ${district}`,
      district, delivery_area: inside ? "inside_dhaka" : "outside_dhaka",
      note: i % 5 === 0 ? "বিকালে ডেলিভারি দিবেন" : null,
      subtotal, delivery_charge: delivery, discount, advance_paid: 0, total: subtotal + delivery - discount,
      coupon_code: discount ? "MRM100" : null, source: sources[i % sources.length],
      courier, consignment_id: courier ? String(8800000 + i) : null, tracking_code: courier ? `${courier.slice(0, 2).toUpperCase()}${9000 + i}` : null,
      courier_status: courier ? (st === "delivered" ? "delivered" : st === "returned" ? "cancelled" : "in_review") : null,
      items, history: history.map((h) => ({ ...h, note: h.note ?? null })), created_at: created.toISOString(),
    });
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export const demoIncomplete: IncompleteOrder[] = [
  { id: 1, name: "সোহেল রানা", phone: "01711223344", address: "উত্তরা, ঢাকা", items: [{ product_id: 1, quantity: 1, name: "ফ্লিস হুডি", price: 790 }], total: 790, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, name: null, phone: "01822334455", address: null, items: [{ product_id: 3, quantity: 2, name: "উইন্টার কম্বো সেট", price: 1490 }], total: 2980, created_at: new Date(Date.now() - 7200000 * 3).toISOString() },
  { id: 3, name: "লাবনী", phone: "01933445566", address: "চট্টগ্রাম", items: [{ product_id: 2, quantity: 1, name: "শীতের শাল", price: 950 }], total: 950, created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const demoSuppliers: Supplier[] = [
  { id: 1, name: "ঢাকা গার্মেন্টস হোলসেল", phone: "01700000001", address: "ইসলামপুর, ঢাকা", balance: 12000 },
  { id: 2, name: "গ্যাজেট ইম্পোর্টার্স", phone: "01800000002", address: "বসুন্ধরা সিটি, ঢাকা", balance: 0 },
];

export const demoPurchases: Purchase[] = [
  { id: 1, supplier_id: 1, supplier: { id: 1, name: "ঢাকা গার্মেন্টস হোলসেল" }, date: new Date(Date.now() - 86400000 * 6).toISOString().slice(0, 10), items: [{ product_id: 1, quantity: 50, unit_cost: 480, name: "ফ্লিস হুডি" }], total: 24000, paid: 12000, note: null },
];

export const demoMovements: StockMovement[] = [
  { id: 1, product_id: 1, product: { id: 1, name: "ফ্লিস হুডি" }, variant: null, type: "purchase", quantity: 50, note: "Purchase #1", created_at: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: 2, product_id: 1, product: { id: 1, name: "ফ্লিস হুডি" }, variant: "কালো / L", type: "sale", quantity: -2, note: "Order MRM-0005", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 3, product_id: 8, product: { id: 8, name: "ওয়্যারলেস ইয়ারবাডস" }, variant: null, type: "adjustment", quantity: -1, note: "Damaged", created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const demoExpenses: Expense[] = [
  { id: 1, category: "Facebook Ads", amount: 5000, date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), note: "Winter campaign" },
  { id: 2, category: "Packaging", amount: 1200, date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10), note: null },
  { id: 3, category: "Office rent", amount: 8000, date: new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10), note: null },
];

export const demoStaff: Staff[] = [
  { id: 1, name: "MRM Admin", email: "admin@mrmzone.shop", phone: "01302919979", role: "admin" },
  { id: 2, name: "অর্ডার ম্যানেজার", email: "manager@mrmzone.shop", phone: "01700000010", role: "manager" },
  { id: 3, name: "কল সেন্টার", email: "staff@mrmzone.shop", phone: "01700000011", role: "staff" },
];

export const demoSmsLogs: SmsLog[] = [
  { id: 1, phone: "01712345678", message: "প্রিয় গ্রাহক, আপনার অর্ডার MRM-261027-0005 গ্রহণ করা হয়েছে। ধন্যবাদ — MRM Zone", status: "sent", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, phone: "01812345678", message: "আপনার অর্ডার কুরিয়ারে পাঠানো হয়েছে। ট্র্যাকিং: SF9002", status: "sent", created_at: new Date(Date.now() - 7200000).toISOString() },
];

export const demoAdminSettings: AdminSettings = {
  store: { name: demoSettings.name, phone: demoSettings.phone, whatsapp: demoSettings.whatsapp, email: demoSettings.email, address: demoSettings.address, facebook: demoSettings.facebook, logo: null, announcement: demoSettings.announcement },
  delivery: { ...demoSettings.delivery },
  courier: {
    default: "steadfast",
    steadfast: { api_key: "", secret_key: "" },
    pathao: { base_url: "https://api-hermes.pathao.com", client_id: "", client_secret: "", username: "", password: "", store_id: "" },
    redx: { token: "", default_area_id: "" },
  },
  sms: { provider: "log", api_key: "", sender_id: "MRMZONE" },
  tracking: { meta_pixel_id: "", gtm_id: "" },
  fraud: { api_key: "", api_url: "https://bdcourier.com/api/courier-check" },
  sms_templates: {
    order_placed: "প্রিয় {name}, আপনার অর্ডার {number} গ্রহণ করা হয়েছে। মোট: {total} টাকা। — MRM Zone",
    order_confirmed: "আপনার অর্ডার {number} কনফার্ম করা হয়েছে। শীঘ্রই পাঠানো হবে।",
    order_shipped: "আপনার অর্ডার {number} কুরিয়ারে পাঠানো হয়েছে। ট্র্যাকিং: {tracking}",
    enabled: { order_placed: true, order_confirmed: true, order_shipped: true },
  },
};
