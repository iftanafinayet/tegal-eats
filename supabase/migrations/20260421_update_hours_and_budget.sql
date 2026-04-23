-- Update coffee shop details with opening hours, budget, and exact coordinates
begin;

-- Starbucks Coffee Tegal
update public.places 
set hours = '08:00 - 22:00', price_range = '$$$', lat = -6.86979, lng = 109.12867
where name = 'Starbucks Coffee Tegal';

-- Fore Coffee - Tegal Plaza
update public.places 
set hours = '10:00 - 22:00', price_range = '$$', lat = -6.86498, lng = 109.12097
where name = 'Fore Coffee - Tegal Plaza';

-- TOMORO COFFEE - A.R Hakim Tegal
update public.places 
set hours = '07:00 - 22:00', price_range = '$', lat = -6.87481, lng = 109.13619
where name = 'TOMORO COFFEE - A.R Hakim Tegal';

-- Bento Kopi Tegal
update public.places 
set hours = '09:00 - 00:00', price_range = '$', lat = -6.88525, lng = 109.12660
where name = 'Bento Kopi Tegal';

-- Kopi Kenangan - AR Hakim Tegal
update public.places 
set hours = '07:00 - 22:00', price_range = '$', lat = -6.87481, lng = 109.13619
where name = 'Kopi Kenangan - AR Hakim Tegal';

-- Piyama Cafe Tegal
update public.places 
set hours = '06:00 - 22:00', price_range = '$$', lat = -6.86750, lng = 109.13750
where name = 'Piyama Cafe Tegal';

-- North Beach Cafe & Space
update public.places 
set hours = '10:00 - 22:00', price_range = '$$', lat = -6.86498, lng = 109.12097
where name = 'North Beach Cafe & Space';

-- Yudhistira Coffee Tegal
update public.places 
set hours = '15:00 - 03:00', price_range = '$', lat = -6.89500, lng = 109.13000
where name = 'Yudhistira Coffee Tegal';

-- Wico Coffee Tegal
update public.places 
set hours = '10:00 - 22:00', price_range = '$$', lat = -6.87317825, lng = 109.12790382
where name = 'Wico Coffee Tegal';

-- Sae coffee tegal
update public.places 
set hours = '09:00 - 23:00', price_range = '$', lat = -6.95000, lng = 109.13000
where name = 'Sae coffee tegal';

-- Kopi Soe Tegal
update public.places 
set hours = '07:00 - 22:00', price_range = '$', lat = -6.86500, lng = 109.14000
where name = 'Kopi Soe Tegal';

-- AH BANG Kopitiam Tegal
update public.places 
set hours = '10:00 - 22:00', price_range = '$$', lat = -6.86498, lng = 109.12097
where name = 'AH BANG Kopitiam Tegal';

-- Kopi Lori Tegal
update public.places 
set hours = '14:00 - 00:00', price_range = '$$', lat = -6.87000, lng = 109.14000
where name = 'Kopi Lori Tegal';

-- Sujoe Cafe
update public.places 
set hours = '06:00 - 23:00', price_range = '$', lat = -6.87500, lng = 109.14000
where name = 'Sujoe Cafe';

-- Kedai Kopi Kulo Tegal
update public.places 
set hours = '10:00 - 22:00', price_range = '$', lat = -6.87000, lng = 109.12000
where name = 'Kedai Kopi Kulo Tegal';

-- Kedai Kopi Jodoh
update public.places 
set hours = '09:00 - 22:00', price_range = '$', lat = -6.98000, lng = 109.13000
where name = 'Kedai Kopi Jodoh';

-- Maju Cafe
update public.places 
set hours = '06:00 - 23:00', price_range = '$', lat = -6.87500, lng = 109.14000
where name = 'Maju Cafe';

-- Fill others with defaults if they are null
update public.places
set hours = coalesce(hours, '10:00 - 22:00'),
    price_range = coalesce(price_range, '$$')
where hours is null or price_range is null;

commit;
