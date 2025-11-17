-- Add DELETE policy for confirmations table
create policy "Allow public to delete confirmations"
  on public.confirmations for delete
  using (true);
