import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(projectRoot, "tmp");
const cachePath = path.join(cacheDir, "tegal-coffeeshops.json");
const sqlSeedPath = path.join(projectRoot, "supabase", "seed_tegal_coffeeshops.sql");
const manualSeedPath = path.join(projectRoot, "supabase", "seed_tegal_coffeeshops_manual.sql");

function loadEnvFile() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const foursquareApiKey = process.env.REACT_APP_FOURSQUARE_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
}

if (!foursquareApiKey) {
  throw new Error("Missing provider key. Set REACT_APP_FOURSQUARE_API_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const searchPoints = [
  { name: "Tegal Tengah", lat: -6.8792, lng: 109.1256 },
  { name: "Alun-Alun Tegal", lat: -6.8693, lng: 109.1402 },
  { name: "Tegal Timur", lat: -6.8585, lng: 109.1545 },
  { name: "Tegal Barat", lat: -6.8765, lng: 109.1172 },
  { name: "Margadana", lat: -6.9054, lng: 109.1297 },
];

const searchTerms = [
  "coffee",
  "kopi",
  "cafe",
  "kedai kopi",
  "coffee shop",
  "espresso",
];

function normalizeText(value) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function escapeSql(value) {
  return String(value || "").replace(/'/g, "''");
}

function categoryFromPlace(place) {
  const categoryBlob = JSON.stringify(place.categories || []).toLowerCase();
  if (categoryBlob.includes("coffee") || categoryBlob.includes("cafe") || categoryBlob.includes("kopi")) {
    return "coffee";
  }
  return "nongkrong";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadManualSeedNames() {
  if (!fs.existsSync(manualSeedPath)) return [];
  const content = fs.readFileSync(manualSeedPath, "utf8");
  const matches = [...content.matchAll(/\('([^']*(?:''[^']*)*)'\)/g)];
  return matches.map((match) => match[1].replace(/''/g, "'"));
}

async function fetchFoursquare(endpoint, params) {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: foursquareApiKey,
      "X-Places-Api-Version": "1970-01-01",
    },
  });

  if (!response.ok) {
    throw new Error(`Foursquare HTTP ${response.status}`);
  }

  return await response.json();
}

async function collectInternetPlaces() {
  const collected = [];
  for (const point of searchPoints) {
    for (const term of searchTerms) {
      const [searchPayload, nearbyPayload] = await Promise.all([
        fetchFoursquare("https://api.foursquare.com/v3/places/search", {
          query: term,
          ll: `${point.lat},${point.lng}`,
          radius: 7000,
          limit: 20,
          sort: "RELEVANCE",
          fields: "fsq_id,name,location,geocodes,categories,chains",
        }),
        fetchFoursquare("https://api.foursquare.com/v3/places/nearby", {
          query: term,
          ll: `${point.lat},${point.lng}`,
          limit: 20,
          fields: "fsq_id,name,location,geocodes,categories,chains",
        }),
      ]);

      collected.push(...(searchPayload.results || []), ...(nearbyPayload.results || []));
    }
  }

  const deduped = [];
  const seen = new Set();

  for (const place of collected) {
    const key =
      place.fsq_id ||
      `${normalizeText(place.name)}::${normalizeText(place.location?.formatted_address)}`;

    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(place);
  }

  return deduped;
}
async function fetchWithRetry(url, options, label) {
  let lastError = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }

    if (response.status !== 429) {
      throw new Error(`${label} HTTP ${response.status}`);
    }

    lastError = new Error(`${label} HTTP 429`);
    await sleep(1200 * (attempt + 1));
  }

  throw lastError || new Error(`${label} failed`);
}

async function loadExistingPlaces() {
  const { data, error } = await supabase.from("app_places").select("id,name,address");
  if (error) throw error;

  return new Set(
    (data || []).flatMap((place) => [
      normalizeText(place.name),
      `${normalizeText(place.name)}::${normalizeText(place.address)}`,
    ])
  );
}

async function importPlaces() {
  const sqlOnly = process.argv.includes("--sql-only");
  console.log("Collecting internet places for Tegal coffee shops...");
  const [internetPlaces, existingKeys] = await Promise.all([
    collectInternetPlaces(),
    loadExistingPlaces(),
  ]);

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(internetPlaces, null, 2));
  console.log(`Saved ${internetPlaces.length} fetched candidates to ${path.relative(projectRoot, cachePath)}.`);

  console.log(`Fetched ${internetPlaces.length} unique candidates from internet.`);

  const sqlRows = [];

  let imported = 0;
  let skipped = 0;

  for (const place of internetPlaces) {
    const name = cleanText(place.name);
    const address = cleanText(
      place.location?.formatted_address ||
      [place.location?.address, place.location?.locality, place.location?.region].filter(Boolean).join(", ")
    );
    const lat = place.geocodes?.main?.latitude;
    const lng = place.geocodes?.main?.longitude;

    if (!name || !address) {
      skipped += 1;
      continue;
    }

    const nameKey = normalizeText(name);
    const fullKey = `${nameKey}::${normalizeText(address)}`;
    if (existingKeys.has(nameKey) || existingKeys.has(fullKey)) {
      skipped += 1;
      continue;
    }

    sqlRows.push(`insert into public.places (name, category, address, lat, lng, description, hours, price_range, avg_rating, review_count, image_url)
values ('${escapeSql(name)}', '${escapeSql(categoryFromPlace(place))}', '${escapeSql(address)}', ${Number.isFinite(lat) ? lat : "null"}, ${Number.isFinite(lng) ? lng : "null"}, 'Diimpor otomatis dari internet.', null, null, 0, 0, null)
on conflict do nothing;`);

    if (sqlOnly) {
      existingKeys.add(nameKey);
      existingKeys.add(fullKey);
      imported += 1;
      continue;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase.from("places").insert({
      name,
      category: categoryFromPlace(place),
      address,
      lat,
      lng,
      description: "Diimpor otomatis dari internet via Foursquare Places.",
      hours: null,
      price_range: null,
      avg_rating: 0,
      review_count: 0,
      image_url: null,
    });

    if (error) {
      console.error(`Failed to import ${name}:`, error.message);
      skipped += 1;
      continue;
    }

    existingKeys.add(nameKey);
    existingKeys.add(fullKey);
    imported += 1;
    console.log(`Imported: ${name}`);
  }

  if (sqlRows.length > 0) {
    fs.writeFileSync(
      sqlSeedPath,
      [
        "-- Generated by scripts/import-tegal-coffeeshops.mjs",
        "begin;",
        ...sqlRows,
        "commit;",
        "",
      ].join("\n")
    );
    console.log(`Saved SQL seed to ${path.relative(projectRoot, sqlSeedPath)}.`);
  }

  console.log(`Done. Imported ${imported}, skipped ${skipped}.`);
}

importPlaces().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
