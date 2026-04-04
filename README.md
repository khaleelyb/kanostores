Here's the full README.md content you can copy:

---

```
# KanoStores

A marketplace app for buying and selling items in Kano, Nigeria. Built with React, TypeScript, Vite, and Supabase.

## Features

- **Browse Products** - Filter by category, search, and view product details
- **Sell Items** - Post new ads with up to 3 images
- **Messaging** - Real-time chat between buyers and sellers
- **Call Sellers** - Click-to-call button (requires phone number in profile)
- **Save Favorites** - Save products to view later
- **User Profiles** - Edit your profile, profile picture, and phone number
- **Dark Mode** - System theme support
- **Admin Dashboard** - Manage users and products (admin only)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database and realtime)

### Installation

```bash
git clone https://github.com/khaleelyb/kanostores.git
cd kanostores
npm install
cp env.local .env
```

### Environment Variables

Create a `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server
```
npm run dev
```

### Build for Production
```
npm run build
```

## Supabase Setup

Run this SQL in your Supabase SQL editor:

```sql
create table public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  username text not null unique,
  profile_picture text not null,
  phone text,
  created_at timestamptz default now()
);

create table public.products (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric not null,
  category text not null,
  image text not null,
  location text not null,
  date text not null,
  description text not null,
  seller_id uuid references public.users(id),
  created_at timestamptz default now()
);

create table public.saved_products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  product_id uuid references public.products(id),
  created_at timestamptz default now()
);

create table public.message_threads (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  product_title text not null,
  participant1_id uuid references public.users(id),
  participant2_id uuid references public.users(id),
  last_message_timestamp bigint not null,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.message_threads(id),
  sender_id uuid references public.users(id),
  text text not null,
  timestamp bigint not null,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table public.messages;
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)

## License

MIT
```
