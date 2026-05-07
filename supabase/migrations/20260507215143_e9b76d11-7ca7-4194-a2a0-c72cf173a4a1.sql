ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_type_check;
ALTER TABLE public.contributions ADD CONSTRAINT contributions_type_check
  CHECK (type IN ('sun_report','beer_price','photo','venue_add','crowd_report'));