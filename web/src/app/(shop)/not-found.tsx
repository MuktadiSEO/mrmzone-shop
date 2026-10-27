import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="font-display text-6xl font-bold text-teal">404</p>
      <h1 className="mt-2 text-xl font-semibold">পেজটি পাওয়া যায়নি</h1>
      <p className="mt-1 text-muted">আপনি যে পেজটি খুঁজছেন সেটি সরিয়ে ফেলা হয়েছে বা লিংকটি ভুল।</p>
      <ButtonLink href="/" variant="accent" className="mt-6">হোমে ফিরে যান</ButtonLink>
    </div>
  );
}
