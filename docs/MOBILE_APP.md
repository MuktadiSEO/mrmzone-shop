# মোবাইল অ্যাপ (Android + iOS) — পরিকল্পনা

ওয়েবসাইট আর অ্যাপ **একই Laravel API** (`https://api.mrmzone.shop/api/v1`) ব্যবহার করবে। তাই অ্যাপ বানাতে ব্যাকএন্ডে নতুন কিছু লিখতে হবে না: পণ্য, অর্ডার, স্টক, অ্যাডমিন সব এক জায়গায় থাকবে।

## প্রস্তাবিত টেকনোলজি: React Native + Expo

- একটা কোড থেকেই Android ও iOS দুই অ্যাপ তৈরি হবে।
- ভাষা TypeScript/React, ওয়েবসাইটের Next.js কোডের মতোই। `web/src/lib/types.ts` আর API client প্রায় হুবহু ব্যবহার করা যাবে।
- Expo EAS Build দিয়ে Mac ছাড়াই iOS বিল্ড করা যায়।

রিপোতে নতুন ফোল্ডার হবে `mobile/`:

```
mrmzone-shop/
  backend/   ← Laravel API (তৈরি)
  web/       ← Next.js স্টোর + অ্যাডমিন (তৈরি)
  mobile/    ← Expo অ্যাপ (পরের ধাপ)
```

## অ্যাপে যা থাকবে (প্রথম ভার্সন)

- হোম (ব্যানার, ক্যাটাগরি, পণ্যের সেকশন): `GET /home`
- ক্যাটাগরি ও সার্চ: `GET /products?category=&search=`
- পণ্যের বিস্তারিত, সাইজ/রঙ বাছাই: `GET /products/{slug}`
- কার্ট ও চেকআউট (ক্যাশ অন ডেলিভারি): `POST /orders` (`source: "app"`)
- লগইন/রেজিস্টার (মোবাইল নম্বর দিয়ে): `POST /auth/login`, `/auth/register` (Sanctum token, `device_name: "android"`)
- আমার অর্ডার ও ট্র্যাকিং: `GET /me/orders`, `GET /orders/track`
- উইশলিস্ট: `/me/wishlist`
- পরে: পুশ নোটিফিকেশন (Expo Notifications + Laravel-এ একটা `device_tokens` টেবিল), বিকাশ পেমেন্ট

## ধাপগুলো (আমি পরে গাইড করব)

1. Expo প্রজেক্ট তৈরি: `npx create-expo-app mobile`
2. ব্র্যান্ড থিম (নেভি #0B1F3A, টিল #078080, Hind Siliguri ফন্ট) ও API client সেটআপ
3. স্ক্রিনগুলো বানানো ও ফোনে Expo Go দিয়ে টেস্ট
4. Google Play Console অ্যাকাউন্ট ($25 একবার) এবং Apple Developer অ্যাকাউন্ট ($99/বছর)
5. `eas build` দিয়ে APK/AAB ও iOS বিল্ড → স্টোরে সাবমিট

যেহেতু API-তে ভার্সন (`/api/v1`) আছে, ভবিষ্যতে API বদলালেও পুরনো অ্যাপ ভেঙে যাবে না।
