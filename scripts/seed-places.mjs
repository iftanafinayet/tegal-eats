// Seed 12 tempat kuliner Tegal ke Neon via Drizzle.
// Usage: npm run db:seed
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Inline copy of the places table (node can't import .ts schema directly).
const places = pgTable(
  "places",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull().default("venue"),
    address: text("address").notNull().default(""),
    lat: real("lat"),
    lng: real("lng"),
    description: text("description").notNull().default(""),
    hours: text("hours"),
    priceRange: text("price_range"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("places_name_unique").on(table.name)]
);

// Load DATABASE_URL from .env (Next.js convention, no dotenv dep needed).
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
  if (m && !process.env.DATABASE_URL) process.env.DATABASE_URL = m[1].replace(/^["']|["']$/g, "");
}

const db = drizzle(neon(process.env.DATABASE_URL));

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const SPOTS = [
  {
    name: "Kopi Nongkrong Alun-Alun",
    category: "coffee",
    address: "Jl. Pancasila No. 12, Tegal",
    lat: -6.8694, lng: 109.1372,
    description: "Kopi susu gula aren yang konsisten, colokan banyak, dan parkir gampang. Cocok buat kerja ringan sampai nongkrong malam.",
    hours: "09:00 - 23:00",
    priceRange: "$$",
    imageUrl: img("photo-1554118811-1e0d58224f24"),
  },
  {
    name: "Sego Lengko Cap Stasiun",
    category: "makan",
    address: "Jl. Stasiun No. 8, Tegal Timur",
    lat: -6.8668, lng: 109.1421,
    description: "Sego lengko legendaris dekat stasiun. Tempe, tahu, tauge, dan sambal kacang yang medok. Antri jam makan siang.",
    hours: "07:00 - 20:00",
    priceRange: "$",
    imageUrl: img("photo-1512058564366-18510be2db19"),
  },
  {
    name: "Sate Kambing Batibul",
    category: "makan",
    address: "Jl. Batibul No. 45, Margadana, Tegal",
    lat: -6.8742, lng: 109.1235,
    description: "Sate kambing empuk tanpa bau prengus, plus sop balungan yang gurih. Porsi mengenyangkan buat makan bareng.",
    hours: "10:00 - 21:00",
    priceRange: "$$",
    imageUrl: img("photo-1555939594-58d7cb561ad1"),
  },
  {
    name: "Demangan Coffee & Eatery",
    category: "coffee",
    address: "Jl. Demangan No. 21, Tegal",
    lat: -6.8621, lng: 109.1298,
    description: "Manual brew single origin dan rice bowl buat nemenin. Interior terang, enak buat meeting santai.",
    hours: "08:00 - 22:00",
    priceRange: "$$",
    imageUrl: img("photo-1501339847302-ac426a4a7cbb"),
  },
  {
    name: "Tahu Aci Mba Sari",
    category: "makan",
    address: "Jl. A. Yani No. 3, Tegal",
    lat: -6.8715, lng: 109.134,
    description: "Tahu aci crispy di luar, kenyal di dalam. Wajib coba yang isi ayam. Cocok buat oleh-oleh.",
    hours: "08:00 - 19:00",
    priceRange: "$",
    imageUrl: img("photo-1504674900247-0877df9cc836"),
  },
  {
    name: "Skydeck Nongkrong Tegal",
    category: "nongkrong",
    address: "Jl. Gajah Mada No. 88, Tegal",
    lat: -6.8672, lng: 109.1311,
    description: "Rooftop buat ngobrol lama sampai malam. Live music tiap weekend, menu indomie dan sate-satean.",
    hours: "16:00 - 00:00",
    priceRange: "$$",
    imageUrl: img("photo-1517248135467-4c7edcad34c4"),
  },
  {
    name: "Ayam Goreng Kalasan Bu Parmi",
    category: "makan",
    address: "Jl. Kapten Sudibyo No. 17, Tegal",
    lat: -6.8755, lng: 109.1398,
    description: "Ayam goreng kremes yang bumbunya meresap sampai tulang. Sambal ijo-nya juara.",
    hours: "09:00 - 21:00",
    priceRange: "$$",
    imageUrl: img("photo-1562967914-608f82629710"),
  },
  {
    name: "Ronde Jahe Malam Minggu",
    category: "nongkrong",
    address: "Jl. Veteran No. 5, Tegal",
    lat: -6.8702, lng: 109.1262,
    description: "Wedang ronde hangat buat penutup malam. Kuah jahe pekat, isian kacang melimpah.",
    hours: "18:00 - 23:30",
    priceRange: "$",
    imageUrl: img("photo-1544787219-7f47ccb76574"),
  },
  {
    name: "Kopi Tubruk Slawi",
    category: "coffee",
    address: "Jl. Ahmad Yani No. 60, Slawi",
    lat: -6.9798, lng: 109.139,
    description: "Kopi tubruk robusta kental gaya warung klasik. Murah, cepat, dan nendang.",
    hours: "06:00 - 22:00",
    priceRange: "$",
    imageUrl: img("photo-1445116572660-236099ec97a0"),
  },
  {
    name: "Bakso Balungan Pak Haji",
    category: "makan",
    address: "Jl. Teuku Umar No. 33, Tegal",
    lat: -6.8644, lng: 109.1357,
    description: "Bakso urat plus balungan yang bisa dikerokotin. Kuah bening tapi kaldunya kuat.",
    hours: "10:00 - 21:30",
    priceRange: "$",
    imageUrl: img("photo-1547592166-23ac45744acd"),
  },
  {
    name: "Cafe Teras Poci",
    category: "nongkrong",
    address: "Jl. Poci No. 9, Tegal",
    lat: -6.8728, lng: 109.1405,
    description: "Teh poci gula batu plus pisang goreng hangat di teras yang adem. Spot ngobrol santai sore-sore.",
    hours: "14:00 - 23:00",
    priceRange: "$",
    imageUrl: img("photo-1559925393-8be0ec4767c8"),
  },
  {
    name: "Seafood Pantai Alam Indah",
    category: "makan",
    address: "Jl. Pantai Alam Indah, Tegal",
    lat: -6.8501, lng: 109.1478,
    description: "Ikan bakar dan cumi saus padang pinggir pantai. Sunset-nya bonus, anginnya kencang.",
    hours: "11:00 - 22:00",
    priceRange: "$$$",
    imageUrl: img("photo-1552566626-52f8b828add9"),
  },
];

let inserted = 0;
for (const spot of SPOTS) {
  const rows = await db
    .insert(places)
    .values({ id: crypto.randomUUID(), ...spot })
    .onConflictDoNothing({ target: places.name })
    .returning({ id: places.id });
  inserted += rows.length;
  console.log(`${rows.length ? "inserted" : "skipped "} ${spot.name}`);
}

console.log(`\nDone: ${inserted} baru, ${SPOTS.length - inserted} sudah ada.`);
