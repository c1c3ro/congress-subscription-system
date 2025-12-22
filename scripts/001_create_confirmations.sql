-- Create confirmations table
create table if not exists public.confirmations (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null unique,
  guest_name text not null,
  status text not null check (status in ('confirmed', 'declined', 'pending')),
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_confirmations_guest_id on public.confirmations(guest_id);
create index if not exists idx_confirmations_status on public.confirmations(status);

-- Enable RLS (Row Level Security)
alter table public.confirmations enable row level security;

-- Create policies - Allow public read/write for this simple use case
-- In production, you might want more restrictive policies
create policy "Allow public to view confirmations"
  on public.confirmations for select
  using (true);

create policy "Allow public to insert confirmations"
  on public.confirmations for insert
  with check (true);

create policy "Allow public to update confirmations"
  on public.confirmations for update
  using (true);
