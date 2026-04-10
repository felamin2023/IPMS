ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS requested_by_designation text,
ADD COLUMN IF NOT EXISTS reviewed_by_designation text;