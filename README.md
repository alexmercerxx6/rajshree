# Rajsril

A Nuxt 4 application for managing lottery results.

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Zero Config)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run this SQL in the SQL Editor:

```sql
create table public.results (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  time_slot text not null,
  display_time text not null,
  ra text not null,
  rb text not null,
  rc text not null,
  rd text not null,
  re text not null,
  created_at timestamptz default now(),
  
  CONSTRAINT unique_daily_slot UNIQUE (date, time_slot)
);

create index idx_results_date on public.results (date);
```

NOTE: If data already exists, you need to drop the table first

```sql
drop table results;
```

Then insert the updated data

```sql
INSERT INTO results (date, time_slot, display_time, ra, rb, rc, rd, re)
VALUES ('2025-12-07', '10:40', '10:40 A.M', 'RA01', 'RB23', 'RC45', 'RD67', 'RE89');
```

3. Get your **Project URL** and **Secret Key** from Project Settings → API Keys

### 3. Configure Environment

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_secret_key
```

### 4. Run Locally

```bash
npm run dev
```

## 🔑 Default Credentials

- **Username**: `yryr2020@outlook.com`
- **Password**: `yryr2020`

## Daily Reset Logic

The app uses date-based queries (`WHERE date = 'YYYY-MM-DD'`).

- **New Day**: At 12:00 AM IST, queries return empty for the new date.
- **History**: Old data stays in the database and is viewable in Archive.

## Deployment

Push to GitHub and import into Vercel.

- **Framework Preset**: Nuxt.js
- **Environment Variables**: Add `SUPABASE_URL` and `SUPABASE_KEY`

## Seeding Demo Data

To populate historical data, insert rows with this structure:

## Python Automation Script
- Root Directory: auto_updater
- pip install -r requirements.txt
- python3 app.py

Time slots run from `09:00` to `21:40` in 15-20 minute intervals.
