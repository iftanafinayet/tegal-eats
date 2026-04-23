# Tegal Eats

Tegal Eats adalah app discovery kuliner dan hangout berbasis React + Supabase. Fokus produk sekarang:
- discovery yang lebih kontekstual,
- detail page yang bantu user ambil keputusan,
- planner status untuk tempat favorit,
- trust signal untuk review komunitas,
- social graph ringan untuk follow member dan baca pulse komunitas.

## Jalankan Lokal

Di root project:

```bash
npm install
npm start
```

Env yang dibutuhkan di `.env`:

```env
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_SUPABASE_STORAGE_BUCKET=images
```

Catatan Supabase Storage:
- buat bucket public, misalnya `images`, lalu isi `REACT_APP_SUPABASE_STORAGE_BUCKET` dengan nama bucket itu.
- app menyimpan `publicUrl` langsung ke database untuk `image_url`, `photo_urls`, dan `avatar_url`.
- pastikan policy bucket mengizinkan upload untuk user yang kamu pakai di app.

Untuk seed daftar coffeshop dari internet ke database lokal:

```bash
npm run seed:tegal-coffeeshops
```

## Stack

- React + TypeScript
- React Router
- Tailwind CSS
- Supabase Auth / Postgres / Storage
- React Leaflet untuk map

## Struktur Penting

- `src/app/api/contracts.ts`: normalizer contract data app.
- `src/app/api/places.ts`: helper akses data places / reviews / favorites.
- `src/app/api/engagement.ts`: helper planner dan trust/apresiasi review.
- `src/app/screens/*`: layar utama app.
- `supabase/migrations/*`: SQL migration untuk schema tambahan Supabase.

## Supabase Migration

File migration baru:

- `supabase/migrations/20260421_engagement_state.sql`
- `supabase/migrations/20260421_social_graph.sql`
- `supabase/migrations/20260421_standardize_core_contracts.sql`

Migration ini menambahkan:
- `user_place_states`
- `review_appreciations`
- `public_profiles`
- `user_follows`
- trigger `updated_at`
- RLS policy per-user

Migration standardisasi core menambahkan compatibility layer yang aman untuk:
- `places`
- `reviews`
- view `app_places`
- view `app_reviews`
- sync `review_count` dan `avg_rating` dari tabel `reviews`

Kalau kamu belum pakai Supabase CLI, isi file itu bisa langsung dijalankan di Supabase SQL Editor.

## Tabel yang Diasumsikan Sudah Ada

Frontend saat ini sudah memakai tabel berikut:
- `places`
- `reviews`
- `favorites`

Jika migration sosial dijalankan, frontend juga akan memakai:
- `public_profiles`
- `user_follows`

Migration baru sengaja memakai `place_id` dan `review_id` bertipe `text` supaya aman walau tipe ID di schema lama belum distandardisasi.
Untuk social graph, app tetap punya fallback ke data review publik bila tabel sosial belum tersedia.

## Verifikasi

Untuk validasi lokal:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
./node_modules/.bin/eslint src/app/api src/app/screens src/app/routes.tsx src/App.test.js --ext .ts,.tsx,.js
```
