-- Master Seeder for Tegal Eats Coffeeshops
-- Consolidates JSON discovery data with accurate coordinates, hours, and budget.
begin;

-- Truncate existing to avoid skew during master seed
-- (Remove this line if you want to keep existing user-added spots)
-- truncate table public.places restart identity cascade;

insert into public.places (name, category, address, lat, lng, description, hours, price_range, avg_rating, review_count)
values
  ('Starbucks Coffee Tegal', 'coffee', 'Jl. AR. Hakim No.116, Tegal, 52131, Indonesia', -6.86979, 109.12867, 'Premium global coffee experience in the heart of Tegal.', '08:00 - 22:00', '$$$', 4.8, 1240),
  ('Fore Coffee - Tegal Plaza', 'coffee', 'DeBe Mall, Tegal, 52125, Indonesia', -6.86498, 109.12097, 'Modern minimalist coffee bar with premium local beans.', '10:00 - 22:00', '$$', 4.7, 850),
  ('Yudhistira Coffee Tegal', 'coffee', 'jl raya, Tegal, 52132, Indonesia', -6.89500, 109.13000, 'Late-night sanctuary for coffee enthusiasts and students.', '15:00 - 03:00', '$', 4.5, 420),
  ('Wico Coffee Tegal', 'coffee', 'Jl. Kapten Sudibyo, Tegal, 52125, Indonesia', -6.87317825, 109.12790382, 'Artisanal local brew with a cozy neighborhood vibe.', '10:00 - 22:00', '$$', 4.4, 310),
  ('Tegal Celco Coffee', 'coffee', 'Jl. Gajah Mada No.83, Tegal, 52121, Indonesia', -6.86561147, 109.13388834, 'Strategic spot for a quick caffeine fix.', '10:00 - 22:00', '$$', 4.2, 150),
  ('Tegal Kaba Coffee', 'coffee', 'Jl. Garuda, Tegal, 52181, Indonesia', -6.87536569, 109.1872611, 'Vibrant social space with great outdoor seating.', '10:00 - 22:00', '$$', 4.3, 210),
  ('TOMORO COFFEE - A.R Hakim Tegal', 'coffee', 'Jl. A. R. Hakim, Tegal, 52131, Indonesia', -6.87481, 109.13619, 'Quality coffee at accessible prices, perfect for daily routine.', '07:00 - 22:00', '$', 4.6, 670),
  ('Pesona Coffee Tegal', 'coffee', 'Jl. Kapten Sudibyo, Tegal, 52131, Indonesia', -6.8810298, 109.12654636, 'Charming cafe with a unique traditional touch.', '10:00 - 22:00', '$$', 4.4, 280),
  ('TOMORO COFFEE - Ruko Citraland Tegal', 'coffee', 'Jl. Sipelem Raya, Tegal, 52112, Indonesia', -6.86596784, 109.12062235, 'Modern grab-and-go coffee point.', '07:00 - 22:00', '$', 4.6, 540),
  ('Sae coffee tegal', 'coffee', 'Jl. Sawo Barat No.33, Tegal, 52111, Indonesia', -6.95000, 109.13000, 'Spacious and creative space for long hangouts.', '09:00 - 23:00', '$', 4.5, 390),
  ('Bento Kopi Tegal', 'coffee', 'Jl. Gatot Subroto No.18-116, Tegal, 52133, Indonesia', -6.88525, 109.12660, 'Huge open-air workspace with student-friendly prices.', '09:00 - 00:00', '$', 4.5, 890),
  ('Rumah Kopi Tegal', 'coffee', 'Jln. Gatot Subroto blok Joma, Tegal, 52133, Indonesia', -6.88174281, 109.1190381, 'Hidden gem for serious coffee lovers.', '10:00 - 22:00', '$$', 4.3, 180),
  ('Kopi Soe Tegal', 'coffee', 'Jl. Waringin No.8, Tegal, 52121, Indonesia', -6.86500, 109.14000, 'Nostalgic vibes with modern coffee blends.', '07:00 - 22:00', '$', 4.5, 410),
  ('Kopi Kenangan - AR Hakim Tegal', 'coffee', 'Jl. AR. Hakim No.17, Tegal, 52123, Indonesia', -6.87481, 109.13619, 'Indonesia''s favorite daily coffee fix.', '07:00 - 22:00', '$', 4.6, 920),
  ('AH BANG Kopitiam Tegal', 'coffee', 'Tegal, 52114, Indonesia', -6.86498, 109.12097, 'Classic kopitiam style with a modern twist.', '10:00 - 22:00', '$$', 4.5, 340),
  ('hallu kopi tegal', 'coffee', 'Belakng smpa 14 kota tegal, Tegal, 52124, Indonesia', -6.8795931, 109.14387852, 'Dreamy atmosphere for chilling and relaxing.', '10:00 - 22:00', '$$', 4.2, 120),
  ('Kopi Kae Tegal', 'coffee', 'Ruko Citraland Tegal Jl. Sipelem No.B03, Tegal, 52112, Indonesia', -6.86550777, 109.12031976, 'Boutique coffee experience with premium beans.', '10:00 - 22:00', '$$', 4.4, 250),
  ('Kopi Lori Tegal', 'coffee', 'Jl. Semeru No.46, Tegal, 52125, Indonesia', -6.87000, 109.14000, 'Rustic train-themed cafe with great manual brews.', '14:00 - 00:00', '$$', 4.5, 470),
  ('Suka Kopi Tegal', 'coffee', 'Jl. Layur No.10, Tegal, 52111, Indonesia', -6.85841433, 109.1337426, 'Minimalist spot for focus and coffee.', '10:00 - 22:00', '$$', 4.3, 190),
  ('Biji Kopi Tegal', 'coffee', 'Jl. H. Abdurahman Gg.Apel, Tegal, 52117, Indonesia', -6.87584539, 109.11359182, 'Authentic roastery and cafe experience.', '10:00 - 22:00', '$$', 4.4, 230),
  ('Piyama Cafe Tegal', 'coffee', 'Kotta GO Hotel Tegal, Tegal, 52131, Indonesia', -6.86750, 109.13750, 'Cozy hotel cafe with great light-bites.', '06:00 - 22:00', '$$', 4.5, 560),
  ('Lataran Cafe Tegal', 'coffee', 'Jl. Gajah Mada No.75, Tegal, 52121, Indonesia', -6.86428869, 109.13432362, 'Modern patio cafe with a great street view.', '10:00 - 22:00', '$$', 4.2, 140),
  ('S Cafe', 'coffee', 'Jl. Ahmad Yani No.169, Tegal, 52123, Indonesia', -6.86451546, 109.13661494, 'Simple, honest, and reliable coffee spot.', '10:00 - 22:00', '$$', 4.1, 90),
  ('Sujoe Cafe', 'coffee', 'Jl. Werkudoro, Tegal, 52192, Indonesia', -6.87500, 109.14000, 'Local favorite for family gatherings.', '06:00 - 23:00', '$', 4.4, 320),
  ('North Beach Cafe & Space', 'coffee', 'Jl. Sipelem No.26, Tegal, 52112, Indonesia', -6.86498, 109.12097, 'Beach-vibe space even in the middle of the city.', '10:00 - 22:00', '$$', 4.5, 480),
  ('QMilk Cafe', 'coffee', 'Jl. Mojokerto, Tegal, 52137, Indonesia', -6.89595749, 109.11547737, 'Great variety of milk and coffee based drinks.', '10:00 - 22:00', '$$', 4.0, 80),
  ('Cafe Susu Sapi Abadi', 'coffee', 'Jl. Raya Pagongan, Tegal, 52192, Indonesia', -6.90073754, 109.13397496, 'Legendary milk-based spot with a cult following.', '10:00 - 22:00', '$$', 4.3, 210),
  ('Papa Brew Cafe', 'coffee', 'Jl. Kompol Suprapto, Tegal, 52115, Indonesia', -6.87305109, 109.12152244, 'Friendly service and solid manual brews.', '10:00 - 22:00', '$$', 4.2, 110),
  ('Cafe SEKARJAGAD.', 'coffee', 'Jl. Puskesmas Bandung, Tegal, 52137, Indonesia', -6.89613114, 109.11654092, 'Traditional atmosphere with classic menu.', '10:00 - 22:00', '$$', 4.1, 70),
  ('Seisi Cafe and Space', 'coffee', 'Jl. Raya Harjosari Lor No.Kel, Tegal, 52194, Indonesia', -6.94907645, 109.12072092, 'A space for everyone, from work to play.', '10:00 - 22:00', '$$', 4.3, 160),
  ('Kedai Kopi Kulo Tegal', 'coffee', 'Jl. Kolonel Sugiono, Tegal, 52114, Indonesia', -6.87000, 109.12000, 'Pioneer of contemporary avocado coffee.', '10:00 - 22:00', '$', 4.5, 530),
  ('Kedai Kopi PDKT', 'coffee', 'Jl. Anggrek 5 Belakang Masjid Al Kautsar No.43, Tegal, 52193, Indonesia', -6.90749613, 109.13305468, 'The perfect spot for a casual first date.', '10:00 - 22:00', '$$', 4.2, 100),
  ('Kedai Kopi Jatinan Tarub', 'coffee', 'Jalan Raya, Tegal, 52184, Indonesia', -6.92928147, 109.18606988, 'Authentic Tegal taste in every cup.', '10:00 - 22:00', '$$', 4.0, 50),
  ('Kedai Kopi Mantu & JackBread Patung obor, Pakembaran', 'coffee', 'Jl. M.T. Haryono, Tegal, 52415, Indonesia', -6.97951699, 109.12626346, 'Bread and coffee combo you can''t miss.', '10:00 - 22:00', '$$', 4.3, 170),
  ('Kedai Kopi WIJAYA', 'coffee', 'Belakang Klinik Rahma, Tegal, 52131, Indonesia', -6.88308288, 109.13564127, 'Solid locals-approved coffee point.', '10:00 - 22:00', '$$', 4.2, 130),
  ('Kedai Kopi PDKT.ind SLEROK', 'coffee', 'Jl. Arjuna, Tegal, 52125, Indonesia', -6.87536995, 109.14556398, 'Cheerful space for youth gatherings.', '10:00 - 22:00', '$$', 4.1, 95),
  ('Kedai Kopi Jodoh', 'coffee', 'Jl. Anoa No.18, Tegal, 52414, Indonesia', -6.98000, 109.13000, 'Finding your coffee match starts here.', '09:00 - 22:00', '$', 4.4, 290),
  ('Kedai Kopi Warta Oetara', 'coffee', 'Tegal, 52192, Indonesia', -6.90295125, 109.13384491, 'News and coffee, a classic morning routine.', '10:00 - 22:00', '$$', 4.0, 45),
  ('Kedai Kopi Tumplek', 'coffee', 'Jl. Nasional 6 No.5"S, Tegal, 52131, Indonesia', -6.87024993, 109.13579937, 'Intimate spot for deep conversations.', '10:00 - 22:00', '$$', 4.2, 115),
  ('WARKOP AA / AA Coffee Shop Tegal', 'coffee', 'utara Quina Bakery, Tegal, 52181, Indonesia', -6.87749312, 109.15268956, 'Traditional touch meet modern brewing.', '10:00 - 22:00', '$$', 4.3, 165),
  ('Coffee Shop Coffee Tradisine', 'coffee', 'Tegal, 52412, Indonesia', -6.97412009, 109.14073281, 'Preserving heritage through coffee.', '10:00 - 22:00', '$$', 4.1, 75),
  ('Coffee Shop ACC Kopi', 'coffee', 'Jl. Jenderal Ahmad Yani No.mor 38, Tegal, 52412, Indonesia', -6.97539746, 109.13966515, 'Quick service, reliable quality.', '10:00 - 22:00', '$$', 4.2, 135),
  ('Jati Coffee Shop', 'coffee', 'Tegal, 52415, Indonesia', -6.9752433, 109.1265337, 'Warm wooden interiors for cozy afternoons.', '10:00 - 22:00', '$$', 4.4, 225),
  ('Kilometer Coffee Shop', 'coffee', 'Jl. Kompol Suprapto depan Taman Sejahtera No.5, Tegal, 52114, Indonesia', -6.874916, 109.12547674, 'Measuring memories one cup at a time.', '10:00 - 22:00', '$$', 4.3, 185),
  ('Sepadan Coffee Shop', 'coffee', 'Jl. Brayan Raya, Tegal, 52412, Indonesia', -6.95868839, 109.14084918, 'Balanced brews for everyone.', '10:00 - 22:00', '$$', 4.1, 85),
  ('Offaz Coffee and Barbershop', 'coffee', 'Jl. Pancasila, Tegal, 52122, Indonesia', -6.86750251, 109.14022357, 'Sharp looks and sharp brews.', '10:00 - 22:00', '$$', 4.5, 310),
  ('Amani Coffee Shop', 'coffee', 'Tegal, 52194, Indonesia', -6.95882285, 109.13252957, 'Peaceful spot for a break.', '10:00 - 22:00', '$$', 4.2, 105),
  ('DM Coffee Shop', 'coffee', 'Jl. Jenderal Ahmad Yani No.1, Tegal, 52412, Indonesia', -6.97479628, 109.1406817, 'Modern hangout for the local community.', '10:00 - 22:00', '$$', 4.3, 195),
  ('CEMARA Coffee Shop', 'coffee', 'Jl. KS. Tubun, Tegal, 52115, Indonesia', -6.88311933, 109.12662024, 'Surrounded by green vibes, great for daytime coffee.', '10:00 - 22:00', '$$', 4.4, 245),
  ('Caffe Pirlly', 'coffee', 'Jl. Slamet, Tegal, 52122, Indonesia', -6.8694632, 109.13986919, 'Boutique cafe with attention to detail.', '10:00 - 22:00', '$$', 4.2, 115),
  ('Maju Cafe', 'coffee', 'Jl. Garuda No.24, Tegal, 52181, Indonesia', -6.87500, 109.14000, 'Moving forward with great coffee and food.', '06:00 - 23:00', '$', 4.3, 215)
on conflict (name) do update set
  category = excluded.category,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  description = excluded.description,
  hours = excluded.hours,
  price_range = excluded.price_range,
  avg_rating = excluded.avg_rating,
  review_count = excluded.review_count;

commit;
