# stillroom · Reading Room Management

A two-sided reading room experience built with Next.js, Supabase, and Vercel. The first version is a polished, interactive prototype: admins can review occupancy, student and payment summaries, and the floor plan; newcomers can switch to the student preview, see open seats by area, and submit a seat request.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm run dev` and open http://localhost:3000.

The dashboard currently uses sample student, seat, and payment data. Booking requests update the in-memory preview so the shared seat map reflects a request while the app is open. They are not yet saved to Supabase. The schema starter is in `supabase/schema.sql`; authentication, role-based access, row-level security policies, and live persistence need to be implemented before using real student data.

## Supabase and Vercel

Apply `supabase/schema.sql` in the Supabase SQL editor, then configure the two `NEXT_PUBLIC_SUPABASE_*` environment variables in Vercel and deploy. The browser client must use the Supabase anon key; never expose a service-role key in a public environment variable.

The current schema intentionally leaves row-level security enabled without permissive policies. Add and review policies for each role before connecting the UI to live records.
