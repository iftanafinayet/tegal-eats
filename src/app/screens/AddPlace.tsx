import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { uploadImage } from "../../utils/uploadImage";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { createPlace } from "../api/places";

// Create custom premium pin for the map picker matching MapScreen
const createCustomIcon = () => {
  const html = `
    <div class="relative flex flex-col items-center group transition-transform duration-300 scale-110 drop-shadow-xl z-[1000]">
      <div class="bg-primary text-on-primary p-2.5 rounded-full shadow-lg">
        <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">
          push_pin
        </span>
      </div>
      <div class="w-1.5 h-3 bg-primary -mt-1 rounded-b-full shadow-sm"></div>
    </div>
  `;
  return L.divIcon({
    className: 'bg-transparent border-0',
    html,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
  });
};

function LocationPicker({
  position,
  setPosition,
  onAutoDetail,
}: {
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng) => void;
  onAutoDetail: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setPosition(e.latlng);
      onAutoDetail(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon()}></Marker>
  );
}

function MapViewportSync({ position }: { position: L.LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 17, { animate: true, duration: 1.2 });
    }
  }, [map, position]);

  return null;
}

function formatLocationDetail(lat: number, lng: number) {
  return `Lokasi GPS pengguna • ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

type SearchSuggestion = {
  id: string;
  label: string;
  secondaryText?: string;
  source: "mapbox";
  lat?: number;
  lng?: number;
  address?: string;
};

type MapboxFeature = {
  id: string;
  text?: string;
  place_name: string;
  center?: [number, number];
  properties?: {
    category?: string;
    maki?: string;
  };
};

const TEGAL_BBOX = {
  minLng: 108.997,
  minLat: -6.98,
  maxLng: 109.22,
  maxLat: -6.8,
};

const TEGAL_CENTER = {
  lng: 109.1402,
  lat: -6.8693,
};

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN?.trim() || "";
const COFFEE_HINTS = ["coffee", "kopi", "cafe", "caf", "espresso", "kedai", "roastery"];

function normalizeSearchValue(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function buildMapboxSearchQuery(query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  const hasCoffeeHint = COFFEE_HINTS.some((hint) => normalizedQuery.includes(hint));

  if (hasCoffeeHint) {
    return `${query} Tegal`;
  }

  return `${query} coffee shop cafe Tegal`;
}

function scoreMapboxFeature(feature: MapboxFeature) {
  const categoryText = `${feature.properties?.category || ""} ${feature.properties?.maki || ""} ${feature.place_name}`.toLowerCase();
  let score = 0;

  if (categoryText.includes("coffee")) score += 4;
  if (categoryText.includes("cafe")) score += 3;
  if (categoryText.includes("kopi")) score += 3;
  if (categoryText.includes("tea")) score -= 1;
  if (categoryText.includes("restaurant")) score -= 1;

  return score;
}

async function fetchMapboxFeatures(
  query: string,
  options: {
    signal: AbortSignal;
    limit?: number;
    types?: string;
  }
) {
  const endpoint = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  endpoint.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
  endpoint.searchParams.set("limit", String(options.limit || 5));
  endpoint.searchParams.set("country", "id");
  endpoint.searchParams.set("bbox", `${TEGAL_BBOX.minLng},${TEGAL_BBOX.minLat},${TEGAL_BBOX.maxLng},${TEGAL_BBOX.maxLat}`);
  endpoint.searchParams.set("proximity", `${TEGAL_CENTER.lng},${TEGAL_CENTER.lat}`);
  endpoint.searchParams.set("language", "id");
  endpoint.searchParams.set("autocomplete", "true");

  if (options.types) {
    endpoint.searchParams.set("types", options.types);
  }

  const response = await fetch(endpoint.toString(), {
    signal: options.signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { features?: MapboxFeature[] };
  return payload.features || [];
}

export function AddPlace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [remoteSuggestions, setRemoteSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchSuggestionError, setSearchSuggestionError] = useState<string | null>(null);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [category, setCategory] = useState("nongkrong");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isAddressAutoFilled, setIsAddressAutoFilled] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Tegal City coordinates
  const defaultCenter: L.LatLngTuple = [-6.8693, 109.1402];
  const prefilledName = searchParams.get("name")?.trim() || "";
  const prefilledAddress = searchParams.get("address")?.trim() || "";
  const prefilledLat = Number(searchParams.get("lat"));
  const prefilledLng = Number(searchParams.get("lng"));
  const hasPrefilledCoordinates = Number.isFinite(prefilledLat) && Number.isFinite(prefilledLng);

  const applyDetectedLocation = (latitude: number, longitude: number) => {
    const nextPosition = L.latLng(latitude, longitude);
    setPosition(nextPosition);
    setAddress((prev) => (isAddressAutoFilled || !prev.trim() ? formatLocationDetail(latitude, longitude) : prev));
    setIsAddressAutoFilled(true);
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser ini tidak mendukung geolokasi.");
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const latitude = result.coords.latitude;
        const longitude = result.coords.longitude;
        const nextPosition = L.latLng(latitude, longitude);
        setPosition(nextPosition);
        setAddress((prev) => (prev.trim() ? prev : formatLocationDetail(latitude, longitude)));
        setIsAddressAutoFilled(true);
        setDetectingLocation(false);
      },
      (error) => {
        console.error("Failed to read current location", error);
        setLocationError("Izin lokasi ditolak atau posisi tidak bisa dibaca. Kamu masih bisa pin manual di peta.");
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (prefilledName) {
      setName(prefilledName);
    }

    if (prefilledAddress) {
      setAddress(prefilledAddress);
      setIsAddressAutoFilled(false);
    }

    if (hasPrefilledCoordinates) {
      setPosition(L.latLng(prefilledLat, prefilledLng));
      setLocationError(null);
      setDetectingLocation(false);
    }
  }, [hasPrefilledCoordinates, prefilledAddress, prefilledLat, prefilledLng, prefilledName]);

  useEffect(() => {
    if (hasPrefilledCoordinates) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Browser ini tidak mendukung geolokasi.");
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const latitude = result.coords.latitude;
        const longitude = result.coords.longitude;
        const nextPosition = L.latLng(latitude, longitude);
        setPosition(nextPosition);
        setAddress((prev) => (prev.trim() ? prev : formatLocationDetail(latitude, longitude)));
        setIsAddressAutoFilled(true);
        setDetectingLocation(false);
      },
      (error) => {
        console.error("Failed to read current location", error);
        setLocationError("Izin lokasi ditolak atau posisi tidak bisa dibaca. Kamu masih bisa pin manual di peta.");
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [hasPrefilledCoordinates]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const query = name.trim();
    if (query.length < 2 || !showSearchSuggestions) {
      if (query.length < 2) {
        setRemoteSuggestions([]);
      }
      setSearchSuggestionError(null);
      setIsSearchingRemote(false);
      return;
    }

    setIsSearchingRemote(true);
    setSearchSuggestionError(null);
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      if (!MAPBOX_ACCESS_TOKEN) {
        setRemoteSuggestions([]);
        setSearchSuggestionError("Set `REACT_APP_MAPBOX_ACCESS_TOKEN` untuk menyalakan pencarian tempat.");
        setIsSearchingRemote(false);
        return;
      }

      const boostedQuery = buildMapboxSearchQuery(query);

      Promise.all([
        fetchMapboxFeatures(query, {
          signal: controller.signal,
          limit: 5,
          types: "poi",
        }),
        fetchMapboxFeatures(boostedQuery, {
          signal: controller.signal,
          limit: 5,
          types: "poi,address",
        }),
      ])
        .then(([poiFeatures, fallbackFeatures]) => {
          const mergedFeatures = [...poiFeatures, ...fallbackFeatures].filter((feature, index, all) => {
            return all.findIndex((item) => item.id === feature.id) === index;
          });

          const nextSuggestions = mergedFeatures
            .filter((feature) => {
              const placeType = feature.id.split(".")[0];
              return placeType === "poi" || placeType === "address";
            })
            .sort((left, right) => scoreMapboxFeature(right) - scoreMapboxFeature(left))
            .slice(0, 5)
            .map<SearchSuggestion>((item) => {
              const label = item.text?.trim() || item.place_name.split(",")[0]?.trim() || item.place_name;
              const secondaryText = item.place_name.startsWith(label)
                ? item.place_name.slice(label.length).replace(/^,\s*/, "")
                : item.place_name;

              return {
                id: `mapbox-${item.id}`,
                label,
                secondaryText,
                source: "mapbox",
                lat: item.center?.[1],
                lng: item.center?.[0],
                address: item.place_name,
              };
            });

          setRemoteSuggestions(nextSuggestions);
          setIsSearchingRemote(false);
        })
        .catch((requestError: any) => {
          if (requestError?.name === "AbortError") return;

          console.error("Failed to load Mapbox search suggestions:", requestError);
          setRemoteSuggestions([]);
          setSearchSuggestionError("Autocomplete tempat sedang bermasalah.");
          setIsSearchingRemote(false);
        });
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [name, showSearchSuggestions]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setName(suggestion.label);
    setAddress(suggestion.address || suggestion.label);
    if (suggestion.lat != null && suggestion.lng != null) {
      setPosition(L.latLng(suggestion.lat, suggestion.lng));
    }
    setShowSearchSuggestions(false);
    setActiveSuggestionIndex(-1);
    setIsAddressAutoFilled(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !position) {
      alert("Please provide the venue name and drop a pin on the map.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile, "places");
        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError);
          alert("Gagal upload gambar: " + uploadError.message);
          setLoading(false);
          return;
        }
      }

      await createPlace({
        name,
        category,
        address,
        lat: position.lat,
        lng: position.lng,
        imageUrl,
        description: "",
        hours: null,
        priceLabel: null,
      });

      navigate("/map");
    } catch (error: any) {
      console.error("Error adding place:", error.message);
      alert("Gagal menambahkan tempat: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body pb-32">
      {/* Editorial Header */}
      <header className="pt-20 pb-16 px-8 lg:px-12 max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[120px] -rotate-12 translate-x-1/2" />

        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            type="button"
            className="w-12 h-12 bg-surface-container-low border border-outline-variant/10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors mb-8"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>

          <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block underline decoration-primary/30 underline-offset-8">Community</span>
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[0.85] mb-4 text-on-surface">
            Curate A <br />
            <span className="text-primary italic">Hidden Gem.</span>
          </h1>
          <p className="text-on-surface-variant max-w-md mt-6 text-sm">Add a new premium location to the Tegal Eats interactive map for others to explore.</p>
        </div>
      </header>

      {/* Content Form */}
      <main className="px-8 lg:px-12 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-10">

          <div className="bg-surface-bright p-8 md:p-12 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.02)] border border-outline-variant/5">
            <div className="space-y-8">
              {/* Basic Info */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-50">
                <label className="block text-[10px] uppercase tracking-widest font-headline font-bold text-on-surface-variant mb-3">Venue Name</label>
                <div ref={searchContainerRef} className="relative group">
                  <input
                    type="text"
                    required
                    value={name}
                    onFocus={() => setShowSearchSuggestions(true)}
                    onChange={(e) => {
                      setName(e.target.value);
                      setShowSearchSuggestions(true);
                      setActiveSuggestionIndex(-1);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown" && remoteSuggestions.length > 0) {
                        event.preventDefault();
                        setShowSearchSuggestions(true);
                        setActiveSuggestionIndex((currentIndex) =>
                          currentIndex >= remoteSuggestions.length - 1 ? 0 : currentIndex + 1
                        );
                        return;
                      }

                      if (event.key === "ArrowUp" && remoteSuggestions.length > 0) {
                        event.preventDefault();
                        setShowSearchSuggestions(true);
                        setActiveSuggestionIndex((currentIndex) =>
                          currentIndex <= 0 ? remoteSuggestions.length - 1 : currentIndex - 1
                        );
                        return;
                      }

                      if (event.key === "Escape") {
                        setShowSearchSuggestions(false);
                        setActiveSuggestionIndex(-1);
                        return;
                      }

                      if (event.key === "Enter" && remoteSuggestions.length > 0 && activeSuggestionIndex >= 0) {
                        event.preventDefault();
                        handleSelectSuggestion(remoteSuggestions[activeSuggestionIndex]);
                      }
                    }}
                    placeholder="e.g. Arabica Reserve"
                    className="w-full px-5 py-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-on-surface font-semibold placeholder:text-on-surface-variant/40 placeholder:font-normal"
                  />

                  <AnimatePresence>
                    {showSearchSuggestions && name.trim().length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden z-[100]"
                      >
                        {remoteSuggestions.length > 0 ? (
                          <div className="py-2">
                            {remoteSuggestions.map((suggestion, index) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                onMouseEnter={() => setActiveSuggestionIndex(index)}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className={`w-full text-left px-5 py-3 transition-colors flex flex-col gap-0.5 ${index === activeSuggestionIndex ? "bg-primary/5" : "hover:bg-primary/5"
                                  }`}
                              >
                                <span className="font-semibold text-on-surface line-clamp-1">{suggestion.label}</span>
                                <span className="text-xs text-on-surface-variant line-clamp-1">{suggestion.secondaryText}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-4 text-sm text-on-surface-variant">
                            {isSearchingRemote ? (
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-primary text-sm">sync</span>
                                Mencari tempat...
                              </div>
                            ) : (
                              searchSuggestionError || "Tidak ada hasil yang ditemukan."
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <label className="block text-[10px] uppercase tracking-widest font-headline font-bold text-on-surface-variant mb-3">Vibe / Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-on-surface font-semibold appearance-none cursor-pointer"
                    >
                      <option value="makan">Fine Dining</option>
                      <option value="coffee">Signature Coffee</option>
                      <option value="nongkrong">Social Lounge</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                  <label className="block text-[10px] uppercase tracking-widest font-headline font-bold text-on-surface-variant mb-3">Detail Lokasi</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setIsAddressAutoFilled(false);
                    }}
                    placeholder="Diisi otomatis dari lokasi perangkat, masih bisa kamu edit"
                    className="w-full px-5 py-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-on-surface font-semibold placeholder:text-on-surface-variant/40 placeholder:font-normal"
                  />
                  <p className="text-xs text-on-surface-variant mt-2">
                    {hasPrefilledCoordinates
                      ? "Lokasi awal sudah diisi dari hasil pencarian. Kamu masih bisa geser pin atau edit alamat."
                      : "Saat menambah tempat, koordinat dan detail lokasi akan mengikuti posisi user yang sedang berada di titik tersebut."}
                  </p>
                </motion.div>
              </div>

              {/* Photo Upload */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                <label className="block text-[10px] uppercase tracking-widest font-headline font-bold text-on-surface-variant mb-3">Visual Identity</label>
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden mb-2 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-64 md:h-80 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      >
                        <span className="material-symbols-outlined text-error">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 md:h-64 rounded-2xl border-2 border-dashed border-outline-variant/20 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group bg-surface-container-lowest">
                    <div className="w-16 h-16 bg-surface-container group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-4 transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-3xl">add_a_photo</span>
                    </div>
                    <span className="font-headline font-bold text-on-surface">Upload Cover Feature</span>
                    <span className="text-xs text-on-surface-variant mt-1">High quality JPEG or PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </motion.div>
            </div>
          </div>

          {/* Interactive Map Picker */}
          <div className="bg-surface-bright p-8 md:p-12 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.02)] border border-outline-variant/5">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-headline font-bold text-on-surface leading-tight">Pin Location</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Posisi awal diambil dari GPS perangkat. Kalau perlu, geser dengan klik titik yang lebih presisi di peta.</p>
                </div>
                <button
                  type="button"
                  onClick={detectCurrentLocation}
                  disabled={detectingLocation}
                  className={`px-4 py-3 rounded-xl text-xs font-headline font-black uppercase tracking-[0.15em] ${detectingLocation ? "bg-surface-container-high text-on-surface-variant" : "bg-primary text-on-primary"
                    }`}
                >
                  {detectingLocation ? "Mendeteksi..." : "Gunakan lokasi saya"}
                </button>
              </div>

              <div className="h-80 lg:h-96 w-full rounded-2xl overflow-hidden border border-outline-variant/10 shadow-inner z-0 relative bg-surface-container-highest">
                <MapContainer
                  center={position ? [position.lat, position.lng] : defaultCenter}
                  zoom={14}
                  scrollWheelZoom={true}
                  className="h-full w-full z-0 absolute inset-0"
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <MapViewportSync position={position} />
                  <LocationPicker position={position} setPosition={setPosition} onAutoDetail={applyDetectedLocation} />
                </MapContainer>
              </div>

              {locationError && (
                <div className="mt-4 rounded-xl bg-error/10 text-error p-4 text-sm">
                  {locationError}
                </div>
              )}

              {position && (
                <div className="mt-4 flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/5">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">my_location</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-headline font-bold text-on-surface-variant">Lokasi Terdeteksi</p>
                    <p className="text-sm font-semibold text-on-surface">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || !name || !position}
            whileHover={{ scale: (name && position && !loading) ? 1.02 : 1 }}
            whileTap={{ scale: (name && position && !loading) ? 0.98 : 1 }}
            className={`w-full py-5 rounded-2xl font-headline font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 ${name && position && !loading
                ? "bg-primary text-on-primary hover:shadow-2xl hover:shadow-primary/30"
                : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed shadow-none"
              }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin hidden">sync</span>
                Curating...
              </>
            ) : (
              <>
                Confirm Spot
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </>
            )}
          </motion.button>
        </form>
      </main>
    </div>
  );
}
