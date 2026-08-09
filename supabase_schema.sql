-- ============================================================
-- FatafatKart database schema
-- Run this in Supabase: Project → SQL Editor → New query → Run
-- ============================================================

-- 1. PRODUCTS -------------------------------------------------
create table if not exists products (
  id bigint primary key,
  cat text not null,
  name text not null,
  qty text not null,
  price integer not null,
  mrp integer not null,
  emoji text not null,
  rating numeric(2,1) default 4.5
);

-- 2. ORDERS -----------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  customer_name text,
  address text,
  pay_method text,              -- 'upi' | 'card' | 'cod'
  payment_status text default 'pending',   -- 'pending' | 'paid' | 'failed'
  razorpay_order_id text,
  razorpay_payment_id text,
  item_total integer not null,
  delivery_fee integer not null default 0,
  handling_fee integer not null default 0,
  grand_total integer not null
);

-- 3. ORDER ITEMS -------------------------------------------------
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id bigint references products(id),
  product_name text not null,   -- snapshot, in case product changes later
  price integer not null,       -- snapshot price at time of order
  quantity integer not null
);

-- 4. ROW LEVEL SECURITY -------------------------------------------
-- Enable RLS and allow public read on products, public insert on orders.
-- (Fine for a demo/portfolio app. Tighten this before handling real money/PII.)

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public can read products"
  on products for select
  using (true);

create policy "Public can insert orders"
  on orders for insert
  with check (true);

create policy "Public can read own orders"
  on orders for select
  using (true);

create policy "Public can insert order items"
  on order_items for insert
  with check (true);

create policy "Public can read order items"
  on order_items for select
  using (true);

-- 5. SEED PRODUCTS -------------------------------------------------
insert into products (id, cat, name, qty, price, mrp, emoji, rating) values
(1, 'fruitveg', 'Alphonso Mango', '1 kg', 249, 320, '🥭', 4.6),
(2, 'fruitveg', 'Banana Robusta', '6 pcs', 42, 48, '🍌', 4.4),
(3, 'fruitveg', 'Tomato Local', '500 g', 22, 28, '🍅', 4.2),
(4, 'fruitveg', 'Spinach Palak', '250 g', 18, 20, '🥬', 4.3),
(5, 'fruitveg', 'Onion', '1 kg', 34, 40, '🧅', 4.5),
(6, 'fruitveg', 'Potato', '1 kg', 28, 32, '🥔', 4.5),
(7, 'dairy', 'Amul Toned Milk', '500 ml', 27, 27, '🥛', 4.7),
(8, 'dairy', 'Farm Eggs', '6 pcs', 45, 52, '🥚', 4.6),
(9, 'dairy', 'Amul Butter', '100 g', 58, 62, '🧈', 4.8),
(10, 'dairy', 'Paneer Fresh', '200 g', 89, 99, '🧀', 4.5),
(11, 'snacks', "Lay's Magic Masala", '52 g', 20, 20, '🍟', 4.4),
(12, 'snacks', 'Parle-G Biscuits', '376 g', 40, 45, '🍪', 4.7),
(13, 'snacks', 'Haldiram Bhujia', '200 g', 55, 60, '🥨', 4.5),
(14, 'beverages', 'Coca-Cola', '750 ml', 40, 45, '🥤', 4.3),
(15, 'beverages', 'Real Fruit Juice', '1 L', 110, 130, '🧃', 4.4),
(16, 'beverages', 'Tata Tea Gold', '250 g', 138, 150, '🍵', 4.6),
(17, 'staples', 'India Gate Basmati', '1 kg', 145, 165, '🍚', 4.6),
(18, 'staples', 'Fortune Sunflower Oil', '1 L', 132, 145, '🛢️', 4.5),
(19, 'staples', 'Toor Dal', '1 kg', 158, 175, '🌾', 4.4),
(20, 'personal', 'Dove Soap', '75 g x3', 129, 145, '🧼', 4.6),
(21, 'personal', 'Colgate Toothpaste', '150 g', 89, 99, '🪥', 4.5),
(22, 'household', 'Vim Dishwash Gel', '500 ml', 99, 110, '🧴', 4.4),
(23, 'household', 'Harpic Toilet Cleaner', '500 ml', 95, 105, '🧹', 4.5),
(24, 'baby', 'Pampers Diapers', 'M, 24 pcs', 449, 499, '🍼', 4.7)
on conflict (id) do nothing;
