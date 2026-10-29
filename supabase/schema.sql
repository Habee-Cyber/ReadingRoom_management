create extension if not exists "pgcrypto";

create type seat_status as enum ('available', 'reserved', 'occupied');
create type payment_status as enum ('paid', 'pending', 'overdue');

create table public.seats (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null unique,
  area text not null,
  status seat_status not null default 'available',
  monthly_fee numeric(10,2) not null default 1200,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  seat_id uuid references public.seats(id),
  payment_status payment_status not null default 'pending',
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references public.seats(id),
  student_name text not null,
  email text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.seats enable row level security;
alter table public.students enable row level security;
alter table public.bookings enable row level security;

-- Add role-specific RLS policies before connecting real admin and student accounts.
