-- Seed popular dining spots (makan) in Tegal
begin;

insert into public.places (name, category, address, lat, lng, description, hours, price_range, avg_rating, review_count)
values
  ('Sate Kambing Wendy''s', 'makan', 'Jl. Letjen. Suprapto No.59, Kraton, Tegal Barat.', -6.8664, 109.1252, 'Legendary young goat satay (Sate Kambing Muda), a must-visit in Tegal.', '08:00 - 19:00', '$$', 4.7, 2450),
  ('Warung Pi''an', 'makan', 'Ruko Dwika, Jl. Kolonel Sudiarto No. 25, dekat Stasiun Tegal.', -6.8642, 109.1335, 'The King of Nasi Lengko. Authentic Tegal breakfast spot since 1926.', '06:00 - 16:00', '$', 4.6, 1820),
  ('Kupat Blengong Mas Tusno', 'makan', 'Jl. Sawo Barat, Kraton, Tegal Barat.', -6.8655, 109.1205, 'Specialist in Kupat Blengong (cross-breed duck) with spicy sate.', '16:00 - 22:00', '$', 4.5, 950),
  ('Sate Kambing Batibul Bang Awi', 'makan', 'Jl. Raya II Adiwerna, Kwaden, Ujungrusi.', -6.9251, 109.1285, 'Famous for "Batibul" (under three months old) goat satay. Extremely tender.', '06:00 - 22:00', '$$$', 4.8, 3100),
  ('RM Tempo Doeloe Tegal', 'makan', 'Jl. Abdul Syukur, Margadana, Kota Tegal.', -6.8685, 109.1052, 'Vintage vibe restaurant specializing in fresh seafood and Tegal home cooking.', '10:00 - 21:00', '$$', 4.4, 720),
  ('Ikan Bakar Cianjur Tegal', 'makan', 'Jl. Dr. Sutomo No. 1, Kota Tegal.', -6.8702, 109.1305, 'Family dining spot famous for Gurame Bakar and Sundanese cuisine.', '10:00 - 22:00', '$$$', 4.6, 1200),
  ('Nasi Lengko Gg. Baru', 'makan', 'Gang Baru (dekat Jl. Ahmad Yani), Kota Tegal.', -6.8662, 109.1315, 'Authentic local favorite for Nasi Lengko, tucked in a narrow alley.', '06:00 - 12:30', '$', 4.7, 540),
  ('Ayam Bakar KQ5 Tegal', 'makan', 'Jl. Kapten Sudibyo No. 1, Kota Tegal.', -6.8752, 109.1255, 'Delicious and affordable grilled chicken packages.', '09:00 - 21:00', '$', 4.3, 890),
  ('Bakso Tessy Tegal', 'makan', 'Jl. Kapten Sudibyo No.79, Kemandungan, Tegal Barat.', -6.8782, 109.1252, 'Popular meatball spot known for its clear savory broth and tender meatballs.', '11:00 - 21:00', '$', 4.5, 1500),
  ('Soto Tauco Tegal Pasar Senggol', 'makan', 'Pasar Senggol (Jl. KH Mansyur), utara Alun-alun Tegal.', -6.8665, 109.1325, 'Authentic Soto Tauco (Moro Tresno H. Caup), a signature fermented soy bean soup.', '08:00 - 21:00', '$', 4.6, 680),
  ('Rumah Makan Sidjie', 'makan', 'Jl. AR. Hakim No.45, Tegal.', -6.8715, 109.1360, 'Classic Tegal family restaurant with variety of local dishes.', '09:00 - 21:00', '$$', 4.3, 420)
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
