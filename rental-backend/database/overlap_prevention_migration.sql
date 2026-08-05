-- Prevents double booking overlap concurrency issues in the database
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
ALTER TABLE public.bookings ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  product_id WITH =,
  tstzrange(start_date, end_date, '[]') WITH &&
) WHERE (status IN ('pending', 'approved', 'active'));
