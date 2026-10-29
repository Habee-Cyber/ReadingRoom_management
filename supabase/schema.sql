-- ============================================================
-- Reading Room Management Database Schema (Supabase)
-- ============================================================

create extension if not exists "pgcrypto";

-- Enum Types
do $$ begin
  create type seat_status as enum ('available', 'reserved', 'occupied');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('paid', 'pending', 'overdue');
exception
  when duplicate_object then null;
end $$;

-- 1. SEATS TABLE
create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null unique,
  area text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'occupied')),
  occupant_name text,
  monthly_fee numeric(10,2) not null default 1200,
  created_at timestamptz not null default now()
);

-- 2. STUDENTS TABLE
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  seat_number text,
  plan text not null default 'Full Day',
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending', 'overdue')),
  amount numeric(10,2) not null default 1200,
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 3. PAYMENTS / TRANSACTIONS TABLE
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null unique,
  student_name text not null,
  seat_number text not null,
  amount numeric(10,2) not null default 1200,
  payment_date text not null default to_char(current_date, 'DD Mon YYYY'),
  payment_method text not null default 'UPI / GPay',
  status text not null default 'paid' check (status in ('paid', 'pending')),
  created_at timestamptz not null default now()
);

-- 4. BOOKINGS TABLE (STUDENT REQUESTS)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null,
  student_name text not null,
  email text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

-- 5. SETTINGS TABLE
create table if not exists public.room_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Serenity Study Hall',
  tagline text not null default 'Reading Space & Dedicated Study Hall',
  address text not null default '4th Floor, Apex Tower, Near Central Library, Ernakulam',
  phone text not null default '+91 98470 11223',
  email text not null default 'contact@stillroom.space',
  open_time text not null default '06:00 AM',
  close_time text not null default '11:00 PM',
  monthly_fee numeric(10,2) not null default 1200,
  deposit numeric(10,2) not null default 500,
  locker_fee numeric(10,2) not null default 200,
  wifi_ssid text not null default 'Stillroom_HighSpeed_5G',
  wifi_pass text not null default 'focusquiet2024',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
alter table public.seats enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.bookings enable row level security;
alter table public.room_settings enable row level security;

-- Drop existing policies if any
drop policy if exists "Enable all for anon on seats" on public.seats;
drop policy if exists "Enable all for anon on students" on public.students;
drop policy if exists "Enable all for anon on payments" on public.payments;
drop policy if exists "Enable all for anon on bookings" on public.bookings;
drop policy if exists "Enable all for anon on room_settings" on public.room_settings;

-- Allow full read & write for public anon client
create policy "Enable all for anon on seats" on public.seats for all using (true) with check (true);
create policy "Enable all for anon on students" on public.students for all using (true) with check (true);
create policy "Enable all for anon on payments" on public.payments for all using (true) with check (true);
create policy "Enable all for anon on bookings" on public.bookings for all using (true) with check (true);
create policy "Enable all for anon on room_settings" on public.room_settings for all using (true) with check (true);

-- ============================================================
-- SEED INITIAL 32 REAL DESKS
-- ============================================================
insert into public.seats (seat_number, area, status, occupant_name, monthly_fee) values
  ('A-01', 'Quiet zone', 'available', null, 1200),
  ('A-02', 'Quiet zone', 'available', null, 1200),
  ('A-03', 'Quiet zone', 'available', null, 1200),
  ('A-04', 'Quiet zone', 'available', null, 1200),
  ('A-05', 'Quiet zone', 'available', null, 1200),
  ('A-06', 'Quiet zone', 'available', null, 1200),
  ('A-07', 'Quiet zone', 'available', null, 1200),
  ('A-08', 'Quiet zone', 'available', null, 1200),
  ('A-09', 'Quiet zone', 'available', null, 1200),
  ('A-10', 'Quiet zone', 'available', null, 1200),
  ('A-11', 'Quiet zone', 'available', null, 1200),
  ('A-12', 'Quiet zone', 'available', null, 1200),
  ('A-13', 'Quiet zone', 'available', null, 1200),
  ('A-14', 'Quiet zone', 'available', null, 1200),
  ('A-15', 'Quiet zone', 'available', null, 1200),
  ('A-16', 'Quiet zone', 'available', null, 1200),
  ('B-01', 'Window side', 'available', null, 1200),
  ('B-02', 'Window side', 'available', null, 1200),
  ('B-03', 'Window side', 'available', null, 1200),
  ('B-04', 'Window side', 'available', null, 1200),
  ('B-05', 'Window side', 'available', null, 1200),
  ('B-06', 'Window side', 'available', null, 1200),
  ('B-07', 'Window side', 'available', null, 1200),
  ('B-08', 'Window side', 'available', null, 1200),
  ('B-09', 'Window side', 'available', null, 1200),
  ('B-10', 'Window side', 'available', null, 1200),
  ('B-11', 'Window side', 'available', null, 1200),
  ('B-12', 'Window side', 'available', null, 1200),
  ('B-13', 'Window side', 'available', null, 1200),
  ('B-14', 'Window side', 'available', null, 1200),
  ('B-15', 'Window side', 'available', null, 1200),
  ('B-16', 'Window side', 'available', null, 1200)
on conflict (seat_number) do nothing;

-- Default settings seed
insert into public.room_settings (name, tagline, address, phone, email)
values ('Serenity Study Hall', 'Reading Space & Dedicated Study Hall', '4th Floor, Apex Tower, Near Central Library, Ernakulam', '+91 98470 11223', 'contact@stillroom.space')
on conflict do nothing;
