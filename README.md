# GLAD Training — Registration Form

A single-page registration form (Name, Mobile, WhatsApp, Region → Wilayat → Village
cascading dropdowns) that saves to Supabase, plus an automated daily email summary
sent to region managers and the Oman in-charge via Brevo.

## What's in this folder

```
index.html                         the registration page (host on GitHub Pages)
oman-data.js                       Region -> Wilayat -> Village reference data
assets/poster.jpg                  the training poster shown at the top of the form
schema.sql                         Supabase table setup (run once)
supabase/functions/daily-report/   the scheduled email job
```

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Go to **SQL Editor** → paste in the contents of `schema.sql` → **Run**.
   This creates the `registrations` table (public can only insert, never read)
   and the `report_recipients` table (only readable by the backend).
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
4. Open `index.html` and set these two values near the bottom of the file:
   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```

## 2. Publish the form on GitHub

1. Push this whole folder to a GitHub repo.
2. Repo → **Settings → Pages** → set source to the branch/folder containing
   `index.html` → save. GitHub gives you a URL like
   `https://yourname.github.io/glad-registration/`.
3. That's your shareable registration link.

## 3. Add who should receive the daily report

In Supabase, **Table Editor → report_recipients**, add a row per person:

| email | name | scope | region |
|---|---|---|---|
| muscat.manager@example.com | Muscat Manager | region | Muscat |
| dhofar.manager@example.com | Dhofar Manager | region | Dhofar |
| oman.incharge@example.com | Oman Programme Lead | global | *(leave blank)* |

- `scope = region` → gets only that region's registrations for the day.
- `scope = global` → gets every region's registrations for the day (the
  Oman-wide in-charge).

Add one row per region manager, plus one `global` row for whoever oversees
all of Oman.

## 4. Deploy the daily-report Edge Function (sends the emails via Brevo)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally.

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# Secrets the function needs — get BREVO_API_KEY from Brevo:
# Settings -> SMTP & API -> API Keys -> Generate a new API key
supabase secrets set BREVO_API_KEY=xkeysib-xxxxxxxx
supabase secrets set FROM_EMAIL=training@yourdomain.com
supabase secrets set FROM_NAME="GLAD Training"

supabase functions deploy daily-report
```

Notes on Brevo:
- The `FROM_EMAIL` address must be a **verified sender** in your Brevo account
  (Brevo → Senders, Domains & Dedicated IPs → add & verify).
- Brevo's free tier includes 300 emails/day, which is plenty for a handful of
  regional managers.

## 5. Schedule it to run daily

In Supabase **SQL Editor**, open `supabase/functions/daily-report/cron.sql`,
replace `YOUR-PROJECT-REF` and `YOUR-SERVICE-ROLE-KEY` (Project Settings → API
→ `service_role` secret key — keep this one private, never put it in the
HTML), then run it. Adjust the cron time (`'0 18 * * *'`) to whatever "end of
day" should mean in Muscat time (the example runs at 18:00 UTC = 22:00
Muscat).

You can test the function immediately without waiting for the schedule by
calling it directly:
```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-report \
  -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY"
```

## About the Region / Wilayat / Village data (`oman-data.js`)

- **Region → Wilayat** (11 regions, 62 wilayats listed) is compiled from
  Oman's Ministry of Foreign Affairs (fm.gov.om) and NCSI census breakdowns.
  Oman officially has 63 wilayats; do a quick check against
  [fm.gov.om/about-oman/state/oman-by-region](https://www.fm.gov.om/en/about-oman/state/oman-by-region/)
  before going live in case one was renamed or added recently — it's a
  one-line edit in `oman-data.js`.
- **Village** is the hard part: Oman does not publish a single official,
  structured list of every village in every wilayat — NCSI's locality-level
  census data exists but only as large PDF reports, not an API or clean
  dataset. So the form ships with:
  - A handful of confirmed villages already filled in for a few wilayats
    (as a working example).
  - An **"Other / not listed"** option on every wilayat, which reveals a
    free-text box — so nobody is blocked from registering even where the
    dropdown is incomplete.
  - Over time, look at what people typed into "Other" (the `village_is_other`
    column flags these rows) and add the common ones into `oman-data.js` as
    confirmed options.
  - If you get an authoritative village list from a specific ministry/wali's
    office, send it over and it's a quick job to wire the whole list in.

## Data privacy note

The anon key in `index.html` is meant to be public — Row Level Security
(set up in `schema.sql`) restricts it to insert-only, so no one can read,
edit or export other people's registrations through it. Never put your
`service_role` key in `index.html` or any client-side file.
