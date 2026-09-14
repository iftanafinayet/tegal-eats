import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "../components/BottomNav";
import { DesktopLayout } from "../components/DesktopLayout";
import { useNavigate } from "../navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { fetchMapPlaces } from "../api/places";
import { isPlaceOpenNow } from "../api/contracts";

type MapMarker = {
  id: string;
  name: string;
  imageUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  category?: string | null;
  avg_rating?: number | null;
  hours?: string | null;
};

// Component to handle map panning when a marker is selected from the sidebar
function MapController({ selectedCoords }: { selectedCoords?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 16, { animate: true, duration: 1.5 });
    }
  }, [selectedCoords, map]);
  return null;
}

// Custom controls component that lives inside MapContainer for access to useMap hook
function CustomMapControls() {
  const map = useMap();
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-12 right-6 flex flex-col gap-4 z-[1000] lg:bottom-10 pointer-events-none">
      {/* Add Spot Button */}
      <button 
        onClick={() => navigate('/add-place')}
        className="bg-primary text-on-primary px-5 py-3 rounded-full shadow-[0_10px_20px_rgba(32,36,42,0.24)] pointer-events-auto hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">add_location_alt</span>
        <span className="font-headline font-bold text-xs uppercase tracking-widest hidden md:inline-block">Add Gem</span>
      </button>

      {/* Locate Me */}
      <div 
        onClick={() => map.locate({setView: true, maxZoom: 16})}
        className="bg-surface-container-lowest p-3 rounded-full shadow-lg text-on-surface hover:bg-surface-container-high transition-colors pointer-events-auto cursor-pointer flex items-center justify-center border border-outline-variant/10"
      >
        <span className="material-symbols-outlined text-[20px]">my_location</span>
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/10 divide-y divide-outline-variant/10 overflow-hidden pointer-events-auto">
        <button 
          onClick={() => map.zoomIn()}
          className="p-3 text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <button 
          onClick={() => map.zoomOut()}
          className="p-3 text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
      </div>
    </div>
  );
}

function SelectedPlaceCard({ place, onClose }: { place: MapMarker; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="clay-card bg-surface-container-lowest w-full rounded-3xl overflow-hidden relative">
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center -mt-px overflow-hidden">
         {place.imageUrl ? (
           <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
         ) : (
           <span className="material-symbols-outlined text-6xl text-primary/30 rotate-12 relative -top-4">
             {place.category === 'coffee' ? 'coffee' : 'restaurant'}
           </span>
         )}
         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container-lowest to-transparent" />
         <button
           onClick={(e) => { e.stopPropagation(); onClose(); }}
           aria-label="Tutup detail"
           className="absolute top-4 right-4 min-w-[44px] min-h-[44px] bg-surface/50 backdrop-blur-md p-1.5 rounded-full hover:bg-surface transition-all shadow-sm focus:outline-none flex items-center justify-center"
         >
           <span className="material-symbols-outlined text-sm text-on-surface">close</span>
         </button>
      </div>

      <div className="p-6 pt-2 relative z-10">
        <div className="bg-primary text-on-primary text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-sm inline-block mb-3 shadow-md">
           Curated Gem
        </div>
        <h4 className="font-headline font-bold text-2xl text-on-surface leading-tight mb-1">{place.name}</h4>
        <p className="text-sm text-on-surface-variant mb-5">Tegal, Central Java</p>

        <div className="flex items-center gap-4 py-4 border-y border-outline-variant/10 bg-surface-bright/50 rounded-lg">
          <div className="text-center flex-1">
            <p className="text-[9px] text-on-surface-variant uppercase tracking-[0.2em] font-black mb-1">Status</p>
            <p className={`text-sm font-bold flex items-center justify-center gap-1 ${isPlaceOpenNow(place.hours || "") ? "text-primary" : "text-on-surface-variant"}`}>
              {isPlaceOpenNow(place.hours || "") ? "Buka" : "Tutup"}
            </p>
          </div>
          <div className="w-px h-8 bg-outline-variant/20"></div>
          <div className="text-center flex-1">
            <p className="text-[9px] text-on-surface-variant uppercase tracking-[0.2em] font-black mb-1">Rating</p>
            <p className="text-sm font-bold text-on-surface flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {place.avg_rating || "4.5"}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/detail/${place.id}`)}
          className="w-full mt-6 bg-primary hover:bg-primary/90 text-on-primary py-3.5 rounded-xl font-headline font-bold active:scale-[0.98] transition-all shadow-clay-button flex items-center justify-center gap-2"
        >
          <span>Lihat detail tempat</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

export function MapScreen() {
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchMarkers = async () => {
      try {
        const data = await fetchMapPlaces(50);
        if (cancelled || !data) return;

        setMapMarkers(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            lat: p.lat,
            lng: p.lng,
            category: p.category,
            avg_rating: p.rating,
            hours: p.hours,
          }))
        );
      } catch (error) {
        console.error("Error fetching map markers:", error);
      }
    };

    fetchMarkers();

    return () => {
      cancelled = true;
    };
  }, []);

  const createCustomIcon = (category: string | null | undefined, isSelected: boolean) => {
    let iconName = 'storefront'; // Generic default
    if (category === 'coffee') iconName = 'coffee';
    if (category === 'makan') iconName = 'dining'; // Spoon and Fork icon
    
    const activeClass = isSelected ? 'scale-125 ring-4 ring-primary/30 z-[1000]' : 'scale-100 hover:scale-110 shadow-lg';
    const html = `
      <div class="relative flex flex-col items-center group transition-transform duration-300 ${activeClass}">
        <div class="bg-primary text-on-primary p-2.5 rounded-full shadow-lg">
          <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">
            ${iconName}
          </span>
        </div>
        <div class="w-1.5 h-3 bg-primary -mt-1 rounded-b-full shadow-sm"></div>
      </div>
    `;

    return L.divIcon({
      className: 'bg-transparent border-0', // Remove default styles
      html,
      iconSize: [44, 52],
      iconAnchor: [22, 52], // Anchor to the bottom point
    });
  };

  const handleSelectMarker = (id: string) => {
    setSelectedMarker(id);
    const marker = mapMarkers.find((m) => m.id === id);
    if (marker && marker.lat != null && marker.lng != null) {
      setSelectedCoords([marker.lat, marker.lng]);
    }
  };

  const selectedPlace = mapMarkers.find((m) => m.id === selectedMarker);

  return (
    <DesktopLayout>
    <div className="min-h-screen bg-background text-on-surface font-body pb-28 md:pb-10">
        <header className="pt-8 md:pt-12 pb-8 px-4 md:px-6 lg:px-8 fb-container">
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="clay-card rounded-[32px] bg-surface-bright p-6 md:p-8">
            <p className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-3 block underline decoration-primary/30 underline-offset-8">Peta kuliner</p>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight leading-[1.05] mb-3 max-w-3xl">Jelajahi Tegal dari peta.</h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-2xl">{mapMarkers.length} spot sudah dikurasi. Ketuk pin buat lihat kenapa tempat itu layak.</p>
          </motion.div>
        </header>

        <main className="px-4 md:px-6 lg:px-8 fb-container grid gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
          {/* Main Content: Map */}
          <section className="clay-card relative z-10 w-full h-[52vh] lg:h-[calc(100vh-240px)] lg:sticky lg:top-6 overflow-hidden rounded-[32px] order-first lg:order-last">
            <MapContainer
              center={[-6.8694, 109.1402]} // Tegal City coordinates
              zoom={14}
              className="w-full h-full absolute inset-0 z-0"
              zoomControl={false}
            >
              {/* Free OSM tiles, no API key needed */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController selectedCoords={selectedCoords} />

              {/* Render Markers */}
              {mapMarkers.map((marker) => (
                marker.lat != null && marker.lng != null && (
                  <Marker
                    key={marker.id}
                    position={[marker.lat, marker.lng]}
                    icon={createCustomIcon(marker.category, selectedMarker === marker.id)}
                    eventHandlers={{
                      click: () => handleSelectMarker(marker.id),
                    }}
                    zIndexOffset={selectedMarker === marker.id ? 1000 : 0}
                  />
                )
              ))}

              <CustomMapControls />
            </MapContainer>

            {/* Selected place card, overlays the map */}
            <AnimatePresence>
              {selectedMarker && selectedPlace && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-6 left-4 right-4 z-30 max-w-sm mx-auto lg:mx-0"
                >
                  <SelectedPlaceCard
                    place={selectedPlace}
                    onClose={() => setSelectedMarker(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Sidebar: Saved Places List, always visible */}
          <motion.aside
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full z-20 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1"
          >
            {mapMarkers.length === 0 ? (
              <div className="clay-card bg-surface-bright p-8 rounded-3xl text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-30 mb-3 block">map</span>
                <h2 className="font-headline font-bold text-xl mb-2">Belum ada tempat di peta</h2>
                <p className="text-sm text-on-surface-variant">Tambahin hidden gem pertama biar peta ini keisi.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mapMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    onClick={() => handleSelectMarker(marker.id)}
                    aria-current={selectedMarker === marker.id ? "true" : undefined}
                    className={`clay-card bg-surface-bright p-4 rounded-3xl transition-[box-shadow,transform] active:scale-[0.97] active:shadow-clay-pressed cursor-pointer group ${selectedMarker === marker.id ? "outline outline-2 outline-primary" : ""}`}
                  >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0">
                          {marker.imageUrl ? (
                            <img src={marker.imageUrl} alt={marker.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-2xl lg:text-3xl text-on-surface-variant opacity-20">restaurant</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-headline font-bold text-base lg:text-lg text-on-surface group-hover:text-primary transition-colors line-clamp-1">{marker.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-sm font-semibold text-on-surface">{marker.avg_rating || "4.5"}</span>
                            <span className="text-on-surface-variant text-[10px] ml-1 uppercase tracking-wider font-bold">• {marker.category || 'Venue'}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-2 line-clamp-1">Tegal District</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.aside>

        </main>
        
        {/* We keep BottomNav present on all screens per original spec */}
        <BottomNav />
      </div>
    </DesktopLayout>
  );
}
