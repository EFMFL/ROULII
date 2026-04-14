'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRidesStore } from '@/stores/ridesStore';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Recherche() {
  const rides = useRidesStore((s) => s.rides);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(500);
  const [minSeats, setMinSeats] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const results = useMemo(() => {
    return rides
      .filter((r) => r.status !== 'cancelled')
      .filter((r) => {
        const q = normalize(query);
        if (q && !normalize(r.departure).includes(q) && !normalize(r.destination).includes(q) && !normalize(r.driver.name).includes(q)) return false;
        if (showFilters && r.price > maxPrice) return false;
        if (showFilters && r.seats < minSeats) return false;
        return true;
      });
  }, [rides, query, maxPrice, minSeats, showFilters]);

  const firstWithCoords = results.find((r) => r.departureCoords && r.destinationCoords);

  return (
    <>
      <TopAppBar title="Rechercher" showBack={false} />
      <main className="pt-24 px-6 pb-32">
        {/* Search Bar */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
          <input
            className="w-full bg-surface-container-highest rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold placeholder:text-outline focus:ring-2 focus:ring-secondary/40 focus:outline-none transition-all"
            placeholder="Ville de départ ou d'arrivée..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFilters ? 'bg-secondary text-white' : 'bg-surface-container text-primary'}`}
          >
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-surface-container-lowest rounded-2xl p-5 mb-6 ambient-shadow space-y-5 animate-page-enter">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Prix max</label>
                <span className="font-headline font-bold text-sm text-primary">{maxPrice} €</span>
              </div>
              <input
                type="range"
                min={5}
                max={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-secondary h-1.5 rounded-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Places min</label>
                <span className="font-headline font-bold text-sm text-primary">{minSeats}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMinSeats(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      n === minSeats ? 'bg-secondary text-white' : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    {n}+
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map Preview */}
        {firstWithCoords && (
          <div className="rounded-3xl overflow-hidden ambient-shadow mb-6">
            <MapView
              departureCoords={firstWithCoords.departureCoords}
              destinationCoords={firstWithCoords.destinationCoords}
              className="h-40 w-full"
            />
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-primary">
            {results.length} trajet{results.length !== 1 ? 's' : ''} trouvé{results.length !== 1 ? 's' : ''}
          </p>
          {query && (
            <button onClick={() => setQuery('')} className="text-xs font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">close</span>
              Effacer
            </button>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="py-16 flex flex-col items-center opacity-40">
              <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
              <p className="text-sm font-medium">Aucun trajet trouvé</p>
              <p className="text-xs text-on-surface-variant mt-1">Essayez d&apos;ajuster vos filtres</p>
            </div>
          ) : (
            results.map((ride) => (
              <Link
                key={ride.id}
                href={`/trajet/${ride.id}`}
                className="block bg-surface-container-lowest rounded-2xl p-5 ambient-shadow active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      ride.status === 'confirmed' ? 'bg-secondary-container text-on-secondary-container'
                      : ride.status === 'pending' ? 'bg-surface-container-high text-on-surface-variant'
                      : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {ride.status === 'confirmed' ? 'Confirmé' : ride.status === 'pending' ? 'En attente' : 'Terminé'}
                    </span>
                    <span className="text-xs text-on-surface-variant">{ride.date} • {ride.time}</span>
                  </div>
                  <span className="font-headline font-extrabold text-lg text-primary">{ride.price.toFixed(2)}€</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <div className="w-px h-6 bg-outline-variant/30"></div>
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div className="space-y-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{ride.departure}</p>
                    <p className="text-sm font-semibold text-on-surface truncate">{ride.destination}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-surface-container-highest">
                      {ride.driver.avatar ? (
                        <img src={ride.driver.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xs">person</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary">{ride.driver.name}</span>
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-secondary text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {ride.driver.rating}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">{ride.seats} place{ride.seats > 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
