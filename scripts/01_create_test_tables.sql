-- Create test_guests table (identical to guests)
CREATE TABLE IF NOT EXISTS test_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  companion TEXT,
  attended BOOLEAN DEFAULT false
);

-- Create test_confirmations table (identical to confirmations)
CREATE TABLE IF NOT EXISTS test_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Enable RLS on test_guests
ALTER TABLE test_guests ENABLE ROW LEVEL SECURITY;

-- Create policies for test_guests (same as guests)
CREATE POLICY "Allow public to view test guests" ON test_guests
  FOR SELECT USING (true);

CREATE POLICY "Allow public to insert test guests" ON test_guests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to update test guests" ON test_guests
  FOR UPDATE USING (true);

CREATE POLICY "Allow public to delete test guests" ON test_guests
  FOR DELETE USING (true);

-- Enable RLS on test_confirmations
ALTER TABLE test_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policies for test_confirmations (same as confirmations)
CREATE POLICY "Allow public to view test confirmations" ON test_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Allow public to insert test confirmations" ON test_confirmations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to update test confirmations" ON test_confirmations
  FOR UPDATE USING (true);

CREATE POLICY "Allow public to delete test confirmations" ON test_confirmations
  FOR DELETE USING (true);
