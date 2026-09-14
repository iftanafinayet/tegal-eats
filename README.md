# Tegal Eats

Aplikasi discovery kuliner Tegal berbasis Next.js, Neon Postgres, Better Auth, dan Cloudinary.

## Stack

- Next.js 16 App Router + React 19
- Neon serverless Postgres
- Drizzle ORM dan Drizzle Kit
- Better Auth (email/password, session disimpan di Neon)
- Cloudinary untuk image storage
- Tailwind CSS dan React Leaflet

## Setup Lokal

1. Salin nilai dari `.env.example` ke `.env.local`.
2. Buat database baru di Neon dan isi `DATABASE_URL`.
3. Buat Cloudinary environment lalu isi ketiga kredensial Cloudinary.
4. Generate dan jalankan migration.
5. Jalankan development server.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Buka `http://localhost:3000`. Pendaftaran pertama membuat user biasa. Untuk menjadikannya admin, jalankan query berikut melalui Neon SQL Editor:

```sql
update "user" set role = 'admin' where email = 'admin@example.com';
```

## Environment

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Untuk Vercel, gunakan URL deployment sebagai `BETTER_AUTH_URL` dan `NEXT_PUBLIC_BETTER_AUTH_URL`, lalu tambahkan seluruh environment variable di Project Settings.

## Database

Schema aplikasi dan tabel Better Auth berada di `src/db/schema.ts`. Setelah mengubah schema:

```bash
npm run db:generate
npm run db:migrate
```

Operasi database hanya berjalan di route handler server. Browser mengakses `/api/data`, auth melalui `/api/auth/*`, dan upload melalui `/api/upload`.

## Verifikasi

```bash
npm run typecheck
npm run lint
npm run build
```
