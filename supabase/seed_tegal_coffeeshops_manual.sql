begin;

with seed(name) as (
  values
    ('Starbucks Coffee Tegal'),
    ('Fore Coffee - Tegal Plaza'),
    ('Yudhistira Coffee Tegal'),
    ('Wico Coffee Tegal'),
    ('Tegal Celco Coffee'),
    ('Tegal Kaba Coffee'),
    ('TOMORO COFFEE - A.R Hakim Tegal'),
    ('Pesona Coffee Tegal'),
    ('TOMORO COFFEE - Ruko Citraland Tegal'),
    ('Sae coffee tegal'),
    ('Bento Kopi Tegal'),
    ('Rumah Kopi Tegal'),
    ('Kopi Soe Tegal'),
    ('Kopi Kenangan - AR Hakim Tegal'),
    ('AH BANG Kopitiam Tegal'),
    ('hallu kopi tegal'),
    ('Kopi Kae Tegal'),
    ('Kopi Lori Tegal'),
    ('Suka Kopi Tegal'),
    ('Biji Kopi Tegal'),
    ('Piyama Cafe Tegal'),
    ('Lataran Cafe Tegal'),
    ('S Cafe'),
    ('Sujoe Cafe'),
    ('North Beach Cafe & Space'),
    ('QMilk Cafe'),
    ('Cafe Susu Sapi Abadi'),
    ('Papa Brew Cafe'),
    ('Cafe SEKARJAGAD.'),
    ('Seisi Cafe and Space'),
    ('Kedai Kopi Kulo Tegal'),
    ('Kedai Kopi PDKT'),
    ('Kedai Kopi Jatinan Tarub'),
    ('Kedai Kopi Mantu & JackBread Patung obor, Pakembaran'),
    ('Kedai Kopi WIJAYA'),
    ('Kedai Kopi PDKT.ind SLEROK'),
    ('Kedai kopi'),
    ('Kedai Kopi Jodoh'),
    ('Kedai Kopi Warta Oetara'),
    ('Kedai Kopi Tumplek'),
    ('WARKOP AA / AA Coffee Shop Tegal'),
    ('Coffee Shop Coffee Tradisine'),
    ('Coffee Shop ACC Kopi'),
    ('Jati Coffee Shop'),
    ('Kilometer Coffee Shop'),
    ('Sepadan Coffee Shop'),
    ('Offaz Coffee and Barbershop'),
    ('Amani Coffee Shop'),
    ('DM Coffee Shop'),
    ('CEMARA Coffee Shop'),
    ('Caffe Pirlly'),
    ('Maju Cafe')
)
insert into public.places (
  name,
  category,
  address,
  lat,
  lng,
  description,
  hours,
  price_range,
  avg_rating,
  review_count,
  image_url
)
select
  s.name,
  'coffee',
  'Tegal, Jawa Tengah',
  null,
  null,
  'Seed awal dari hasil provider internet. Detail alamat dan koordinat perlu diverifikasi/dilengkapi.',
  null,
  null,
  0,
  0,
  null
from seed s
where not exists (
  select 1
  from public.places p
  where lower(trim(p.name)) = lower(trim(s.name))
);

commit;
