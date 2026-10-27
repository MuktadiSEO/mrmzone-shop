# Contabo VPS-এ MRM Zone Shop চালু করার গাইড

এই গাইড ধরে নিচ্ছে আপনার কাছে আছে:
- Contabo VPS (কমপক্ষে **Cloud VPS 1 / 4 GB RAM**, ৮ GB হলে আরও ভালো), OS: **Ubuntu 24.04**
- ডোমেইন **mrmzone.shop** (Namecheap)
- GitHub রিপো **MuktadiSEO/mrmzone-shop**

পুরো সিস্টেম Docker দিয়ে চলে। একটা কমান্ডেই ওয়েবসাইট, অ্যাডমিন প্যানেল, API, ডাটাবেস আর ফ্রি SSL (HTTPS) চালু হয়।

```
mrmzone.shop        → স্টোরফ্রন্ট + /admin (Next.js)
api.mrmzone.shop    → Laravel API (ওয়েবসাইট, অ্যাডমিন ও ভবিষ্যতের মোবাইল অ্যাপ সবাই এটা ব্যবহার করবে)
```

---

## ধাপ ১ — DNS সেট করুন (Namecheap)

Namecheap → Domain List → mrmzone.shop → **Manage → Advanced DNS**। আগের URL Redirect / parking রেকর্ড মুছে এগুলো যোগ করুন (`VPS_IP` = Contabo থেকে পাওয়া IPv4):

| Type | Host | Value |
|---|---|---|
| A Record | `@` | `VPS_IP` |
| A Record | `www` | `VPS_IP` |
| A Record | `api` | `VPS_IP` |

> আগে যদি Lovable-এর জন্য `185.158.133.1` বা `_lovable` রেকর্ড দিয়ে থাকেন, সেগুলো মুছে দিন।

DNS ছড়াতে ৫ মিনিট থেকে কয়েক ঘণ্টা লাগতে পারে। চেক করতে: `ping api.mrmzone.shop` — VPS-এর IP দেখালে ঠিক আছে।

## ধাপ ২ — VPS-এ লগইন ও প্রাথমিক নিরাপত্তা

Contabo ইমেইলে root পাসওয়ার্ড পাঠায়। কম্পিউটার থেকে (Windows-এ PowerShell):

```bash
ssh root@VPS_IP
```

তারপর VPS-এ:

```bash
apt update && apt upgrade -y
# Firewall: শুধু SSH, HTTP, HTTPS খোলা থাকবে
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
# 4GB RAM হলে 2GB swap যোগ করুন (বিল্ডের সময় কাজে লাগে)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab
timedatectl set-timezone Asia/Dhaka
```

## ধাপ ৩ — Docker ইনস্টল

```bash
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

## ধাপ ৪ — কোড নামান

রিপো private হলে GitHub-এ একটা **Personal Access Token** (Settings → Developer settings → Fine-grained token, শুধু এই রিপোর Contents: Read) বানিয়ে নিন।

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/MuktadiSEO/mrmzone-shop.git
cd mrmzone-shop
```

(ইউজারনেম চাইলে GitHub ইউজারনেম, পাসওয়ার্ডের জায়গায় token দিন।)

## ধাপ ৫ — কনফিগারেশন (.env)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
nano .env
```

`.env`-এ বসান:
- `ACME_EMAIL` = আপনার ইমেইল (SSL সার্টিফিকেটের জন্য)
- `DB_PASSWORD`, `DB_ROOT_PASSWORD` = দুটো আলাদা শক্ত পাসওয়ার্ড (`openssl rand -base64 24` দিয়ে বানাতে পারেন)

```bash
nano backend/.env
```

`backend/.env`-এ বসান:
- `DB_PASSWORD` = ওপরের একই `DB_PASSWORD`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` = অ্যাডমিন প্যানেলের লগইন (কমপক্ষে ১২ অক্ষরের পাসওয়ার্ড)
- `ADMIN_PHONE` = 01302919979 (ঐচ্ছিক)
- প্রথমবার ডেমো পণ্য দেখতে চাইলে `SEED_DEMO=true`

সেভ: `Ctrl+O`, Enter, `Ctrl+X`।

## ধাপ ৬ — চালু করুন

```bash
docker compose build          # প্রথমবার ৫-১৫ মিনিট লাগতে পারে
docker compose run --rm api php artisan key:generate --show
```

শেষ কমান্ড `base64:...` এর মতো একটা key দেখাবে। সেটা কপি করে `backend/.env`-এ `APP_KEY=` এর পরে বসান। তারপর:

```bash
docker compose up -d
docker compose exec api php artisan db:seed --force     # অ্যাডমিন + পলিসি পেজ (+ ডেমো পণ্য)
docker compose exec api php artisan optimize
docker compose ps                                       # সব সার্ভিস "running/healthy" দেখাবে
```

এখন ব্রাউজারে খুলুন:
- https://mrmzone.shop — স্টোর
- https://mrmzone.shop/admin — অ্যাডমিন প্যানেল (ধাপ ৫-এর ADMIN_EMAIL / ADMIN_PASSWORD)
- https://api.mrmzone.shop/up — "Application up" দেখালে API ঠিক আছে

SSL Caddy নিজে থেকেই Let's Encrypt থেকে নেয় ও রিনিউ করে। কিছু করতে হবে না।

## ধাপ ৭ — অ্যাডমিন প্যানেলে প্রথম সেটআপ

**Settings** পেজে:
1. **Store info**: ফোন, WhatsApp, ঠিকানা, Facebook পেজ লিংক, ঘোষণা বার
2. **Delivery**: ঢাকার ভেতরে/বাইরের চার্জ, কতটা পণ্যে ফ্রি ডেলিভারি
3. **Courier**:
   - Steadfast: portal.packzy.com → API → API Key ও Secret Key
   - Pathao: merchant.pathao.com → Developer API → Client ID/Secret, লগইন ইমেইল/পাসওয়ার্ড, Store ID
   - RedX: redx.com.bd মার্চেন্ট প্যানেল → API token
4. **SMS**: bulksmsbd.net অ্যাকাউন্টের API key ও Sender ID (না থাকলে provider "log" রাখুন, SMS যাবে না কিন্তু লগ থাকবে)
5. **Tracking**: Meta Pixel ID (Events Manager থেকে)
6. **Fraud check** (ঐচ্ছিক): bdcourier.com-এর API key দিলে সব কুরিয়ারের ডেলিভারি রেকর্ড দেখাবে। না দিলে শুধু আপনার নিজের অর্ডার ইতিহাস দেখাবে।

তারপর **Categories → Products** যোগ করুন (ছবি সরাসরি আপলোড করা যায়), **Banners**-এ হোমপেজের ব্যানার দিন।

`SEED_DEMO=true` দিয়ে থাকলে ডেমো পণ্যগুলো মুছে দিন এবং `backend/.env`-এ আবার `SEED_DEMO=false` করুন।

## ধাপ ৮ — ব্যাকআপ চালু করুন (জরুরি)

```bash
crontab -e
```
শেষ লাইনে যোগ করুন:
```
30 3 * * * /var/www/mrmzone-shop/deploy/backup.sh >> /var/log/mrmzone-backup.log 2>&1
```
প্রতিদিন রাত ৩:৩০-এ ডাটাবেস ও ছবির ব্যাকআপ `/var/backups/mrmzone`-এ জমা হবে (১৪ দিন রাখা হয়)। মাঝে মাঝে ব্যাকআপ ফাইল নিজের কম্পিউটারে বা Google Drive-এ নামিয়ে রাখুন। Contabo-র নিজস্ব snapshot ফিচারও চালু রাখতে পারেন।

---

## দৈনন্দিন কাজ

| কাজ | কমান্ড (VPS-এ `/var/www/mrmzone-shop` ফোল্ডারে) |
|---|---|
| নতুন কোড আপডেট (GitHub থেকে) | `./deploy/update.sh` |
| সব সার্ভিসের অবস্থা | `docker compose ps` |
| API-এর লগ দেখা | `docker compose logs -f api` |
| ওয়েবসাইটের লগ | `docker compose logs -f web` |
| রিস্টার্ট | `docker compose restart` |
| নতুন অ্যাডমিন/স্টাফ | অ্যাডমিন প্যানেল → Staff |
| কুরিয়ার স্ট্যাটাস সাথে সাথে আপডেট | `docker compose exec api php artisan orders:sync-courier` |

কুরিয়ার স্ট্যাটাস প্রতি ঘণ্টায় নিজে থেকে আপডেট হয় (scheduler সার্ভিস)। ডেলিভারড/রিটার্ন হলে অর্ডারের স্ট্যাটাসও বদলে যায়।

## সমস্যা হলে

- **SSL আসছে না**: DNS ঠিকমতো VPS-এর IP দেখাচ্ছে কি না দেখুন, তারপর `docker compose restart caddy`, লগ: `docker compose logs caddy`
- **502 Bad Gateway**: `docker compose ps` দিয়ে দেখুন কোন সার্ভিস বন্ধ; `docker compose logs api` বা `web`
- **ছবি আপলোড হচ্ছে না**: ২০MB-এর বেশি ছবি দেবেন না; লগ দেখুন
- **বিল্ডে মেমরি শেষ**: ধাপ ২-এর swap যোগ করা আছে কি না দেখুন
- **অ্যাডমিন পাসওয়ার্ড ভুলে গেছেন**:
  ```bash
  docker compose exec api php artisan tinker --execute="App\Models\User::where('email','admin@mrmzone.shop')->update(['password'=>bcrypt('NewStrongPass123')]);"
  ```

## DBID ও আইনি পেজ

`/page/terms`, `/page/return-policy`, `/page/delivery-policy`, `/page/privacy` পেজগুলো বাংলায় তৈরি করা আছে (ট্রেড লাইসেন্স নম্বরসহ)। অ্যাডমিন → CMS Pages থেকে এডিট করতে পারবেন। DBID আবেদনে ওয়েবসাইটের লিংক হিসেবে mrmzone.shop দিন।
