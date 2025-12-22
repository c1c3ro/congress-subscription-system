-- Create guests table
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  companion text,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_guests_name on public.guests(name);

-- Enable RLS (Row Level Security)
alter table public.guests enable row level security;

-- Create policies - Allow public read/write for this simple use case
create policy "Allow public to view guests"
  on public.guests for select
  using (true);

create policy "Allow public to insert guests"
  on public.guests for insert
  with check (true);

create policy "Allow public to update guests"
  on public.guests for update
  using (true);

create policy "Allow public to delete guests"
  on public.guests for delete
  using (true);
