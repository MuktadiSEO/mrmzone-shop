import type { OrderStatus } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "নতুন",
  confirmed: "কনফার্মড",
  processing: "প্রসেসিং",
  shipped: "কুরিয়ারে",
  delivered: "ডেলিভারড",
  partial: "আংশিক ডেলিভারি",
  cancelled: "বাতিল",
  returned: "ফেরত",
  on_hold: "হোল্ড",
};

export const ORDER_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export const STATUS_TONE: Record<string, "gray" | "blue" | "teal" | "amber" | "green" | "red" | "indigo" | "navy"> = {
  pending: "amber",
  confirmed: "blue",
  processing: "indigo",
  shipped: "teal",
  delivered: "green",
  partial: "teal",
  cancelled: "red",
  returned: "red",
  on_hold: "gray",
};

export const COURIERS = [
  { value: "steadfast", label: "Steadfast" },
  { value: "pathao", label: "Pathao" },
  { value: "redx", label: "RedX" },
] as const;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Convert Bangla digits to ASCII digits and strip spaces/dashes/+88 prefix. */
export function normalizePhone(input: string): string {
  let s = toEnglishDigits(input).replace(/[\s\-()]/g, "");
  if (s.startsWith("+88")) s = s.slice(3);
  else if (s.startsWith("88") && s.length === 13) s = s.slice(2);
  return s;
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export const BD_PHONE_RE = /^01[3-9]\d{8}$/;

export function isValidBdPhone(input: string): boolean {
  return BD_PHONE_RE.test(normalizePhone(input));
}

export function money(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0));
  return "৳" + v.toLocaleString("en-IN");
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const BD_DISTRICTS = [
  "Dhaka", "Gazipur", "Narayanganj", "Narsingdi", "Munshiganj", "Manikganj", "Tangail", "Kishoreganj", "Faridpur",
  "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Noakhali",
  "Lakshmipur", "Chandpur", "Brahmanbaria", "Rangamati", "Khagrachhari", "Bandarban", "Sylhet", "Moulvibazar",
  "Habiganj", "Sunamganj", "Rajshahi", "Bogura", "Pabna", "Sirajganj", "Natore", "Naogaon", "Chapainawabganj",
  "Joypurhat", "Khulna", "Jashore", "Satkhira", "Bagerhat", "Kushtia", "Jhenaidah", "Magura", "Narail",
  "Chuadanga", "Meherpur", "Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokati", "Rangpur",
  "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Lalmonirhat", "Thakurgaon", "Panchagarh", "Mymensingh",
  "Jamalpur", "Netrokona", "Sherpur",
];
