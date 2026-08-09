# FatafatKart

A 10-minute grocery delivery app — React + Vite + Tailwind frontend, Supabase (Postgres) for products/orders, Razorpay for UPI/card checkout.

## What's in this project

```
src/App.jsx           the whole app UI
src/supabaseClient.js  Supabase connection
api/create-order.js    serverless fn: creates a Razorpay order (needs secret key)
api/verify-payment.js  serverless fn: verifies Razorpay payment signature
supabase_schema.sql    run this once in Supabase to create your tables
.env.example           copy to .env and fill in your keys
```

---

## 1. Set up Supabase (free database)

1. Go to [supabase.com](https://supabase.com) → sign up (free) → **New project**.
2. Once it's created, go to **SQL Editor → New query**, paste the entire contents of `supabase_schema.sql`, and click **Run**. This creates the `products`, `orders`, and `order_items` tables and seeds the 24 products.
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. Copy `.env.example` to `.env` and paste those two values in.

Your product list, and every order placed, now lives in a real Postgres database you can browse under **Table Editor** in Supabase.

## 2. Set up Razorpay (UPI + card payments)

1. Go to [razorpay.com](https://razorpay.com) → sign up (free).
2. Go to **Settings → API Keys → Generate Test Key**. Copy the **Key Id** and **Key Secret**.
3. Add the Key Id to `.env` as `VITE_RAZORPAY_KEY_ID`.
4. The Key **Secret** must never go in `.env`/frontend code — it's added as a server-side environment variable when you deploy (step 4 below).
5. While testing, Razorpay's test mode lets you "pay" with dummy card `4111 1111 1111 1111`, any future expiry, any CVV — or the test UPI flow — without moving real money.
6. When you're ready for real payments, complete Razorpay's KYC/activation in their dashboard to switch from Test to Live keys.

Cash on Delivery needs no payment gateway — it just saves the order directly.

## 3. Run it locally

```bash
npm install
npm run dev
```

Note: the `/api/*` payment routes are Vercel serverless functions — they only run when deployed on Vercel (or via `vercel dev` locally, see below). Locally with plain `npm run dev`, COD orders will work fully; UPI/Card checkout needs step 4.

To test the payment routes locally too:
```bash
npm install -g vercel
vercel dev
```

## 4. Deploy to Vercel

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "FatafatKart with Supabase + Razorpay"
   git remote add origin https://github.com/<your-username>/fatafatkart.git
   git push -u origin main
   ```
2. At [vercel.com](https://vercel.com), **Add New → Project**, import the repo. Vercel auto-detects Vite.
3. Before deploying, add **Environment Variables** in the Vercel project settings:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | from Supabase |
   | `VITE_SUPABASE_ANON_KEY` | from Supabase |
   | `VITE_RAZORPAY_KEY_ID` | from Razorpay |
   | `RAZORPAY_KEY_ID` | same Razorpay Key Id (used server-side by `/api`) |
   | `RAZORPAY_KEY_SECRET` | your Razorpay Key **Secret** — only ever set here, never in `.env` or committed to git |
4. Click **Deploy**. You'll get a live link like `fatafatkart.vercel.app` with real products, saved orders, and working UPI/card checkout.

---

## Viewing your orders

In Supabase → **Table Editor → orders**, you'll see every order as it's placed, with payment status, and in **order_items** the line items for each. This is your basic "admin view" for now — a proper dashboard UI would be a good next step.

## Security notes

- Row Level Security (RLS) is enabled with permissive public policies so the demo works without login. Before handling real customers/money, you'll want to add authentication and tighten these policies (e.g. a customer should only read their own orders).
- The Razorpay Key Secret must only ever live in Vercel's server-side environment variables — never in `.env`, never in frontend code, never committed to git (`.gitignore` already excludes `.env`).

## What's still a good next step

- Login/auth (Supabase Auth supports phone OTP, which fits an Indian audience well)
- An admin view to manage orders and inventory
- Real delivery-partner assignment/tracking instead of the simulated countdown
