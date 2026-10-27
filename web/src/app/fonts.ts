import localFont from "next/font/local";

export const hind = localFont({
  src: [
    { path: "../fonts/HindSiliguri-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/HindSiliguri-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/HindSiliguri-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/HindSiliguri-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-hind",
  display: "swap",
});

export const outfit = localFont({
  src: [{ path: "../fonts/Outfit-Variable.ttf", weight: "100 900", style: "normal" }],
  variable: "--font-outfit",
  display: "swap",
});
