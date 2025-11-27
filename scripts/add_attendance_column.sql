-- Add attended column to guests table
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN guests.attended IS 'Indica se o convidado compareceu ao evento';
