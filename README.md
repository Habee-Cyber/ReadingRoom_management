# Reading Room

A clean starting point for a two-sided reading room management app built with Next.js and Supabase, ready to deploy on Vercel.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
3. Run `npm run dev` and open http://localhost:3000.
4. Apply `supabase/schema.sql` to your Supabase project when you are ready to connect live data.

The current dashboard uses sample data so the interface is immediately previewable. Authentication, role-specific row-level security policies, and live booking persistence are the next integration steps. Never expose a Supabase service role key in the browser.

## Deploy

Import this repository into Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` environment variables, and deploy. The included `.env.example` documents the required public client settings.
