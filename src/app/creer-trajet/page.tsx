'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useRidesStore } from '@/stores/ridesStore';
import { geocodeAddress } from '@/lib/geocode';
import TopAppBar from '@/components/TopAppBar';
import type { Coords } from '@/stores/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function CreerTrajet() {
  const router = useRouter();
  const addRide = useRidesStore((s) => s.addRide);

  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState("Aujourd'hui");
  const [time, setTime] = useState('08:00');
  const [seats, setSeats] = useState(3);
  const [depCoords, setDepCoords] = useState<Coords | undefined>();
  const [destCoords, setDestCoords] = useState<Coords | undefined>();

  const geocodeDep = useCallback(async (addr: string) => {
    const coords = await geocodeAddress(addr);
    if (coords) setDepCoords(coords);
  }, []);

  const geocodeDest = useCallback(async (addr: string) => {
    const coords = await geocodeAddress(addr);
    if (coords) setDestCoords(coords);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (departure.length >= 3) geocodeDep(departure); }, 600);
    return () => clearTimeout(t);
  }, [departure, geocodeDep]);

  useEffect(() => {
    const t = setTimeout(() => { if (destination.length >= 3) geocodeDest(destination); }, 600);
    return () => clearTimeout(t);
  }, [destination, geocodeDest]);

  const distance = useMemo(() => {
    if (depCoords && destCoords) {
      const R = 6371;
      const dLat = (destCoords.lat - depCoords.lat) * Math.PI / 180;
      const dLon = (destCoords.lng - depCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(depCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3);
    }
    if (!departure || !destination) return 0;
    let hash = 0;
    const str = `${departure}-${destination}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 40) + 10;
  }, [departure, destination, depCoords, destCoords]);

  const pricePerKm = 0.60;
  const totalPrice = distance * pricePerKm;

  const handlePublish = () => {
    if (!departure || !destination) return;
    addRide({
      departure,
      destination,
      departureCoords: depCoords,
      destinationCoords: destCoords,
      date,
      time,
      price: Number(totalPrice.toFixed(2)),
      seats,
      status: 'pending',
      driver: {
        name: 'Vous',
        avatar: '',
        rating: 0,
        trips: 0,
        reliabilityScore: 0,
        vehicle: { model: '', color: '', type: '', plate: '', image: '' },
      },
      mapImage: '',
    });
    router.push('/mes-trajets?created=1');
  };

  return (
    <>
      <TopAppBar title="Roulii" />
      <main className="pt-24 pb-40 px-6">
        {/* Hero Section */}
        <header className="mb-10">
          <h2 className="font-headline font-extrabold text-4xl text-primary tracking-tight leading-tight">
            Proposer un trajet
          </h2>
          <p className="text-on-surface-variant mt-2 font-medium">
            Partagez votre route et réduisez vos frais.
          </p>
        </header>

        <div className="space-y-6">
          {/* Location Cards */}
          <div className="bg-surface-container-low rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-outline-variant opacity-30"></div>
            <div className="space-y-8 relative">
              {/* Departure */}
              <div className="flex items-start gap-4">
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-secondary bg-surface shrink-0 z-10"></div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Départ
                  </label>
                  <input
                    className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-lg font-semibold placeholder:text-outline focus:ring-2 focus:ring-secondary/40 focus:outline-none transition-all"
                    placeholder="D'où partez-vous ?"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                  />
                </div>
              </div>
              {/* Arrival */}
              <div className="flex items-start gap-4">
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-primary bg-surface shrink-0 z-10"></div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Arrivée
                  </label>
                  <input
                    className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-lg font-semibold placeholder:text-outline focus:ring-2 focus:ring-secondary/40 focus:outline-none transition-all"
                    placeholder="Où allez-vous ?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Date
              </label>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">calendar_today</span>
                <input
                  className="w-full bg-transparent border-none p-0 font-bold focus:ring-0 focus:outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Heure
              </label>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                <input
                  className="w-full bg-transparent border-none p-0 font-bold focus:ring-0 focus:outline-none"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow flex items-center justify-between">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Nombre de places
              </label>
              <p className="font-headline font-bold text-lg text-primary">Disponibles pour ce trajet</p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container-low rounded-full px-2 py-2">
              <button
                onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="font-headline font-extrabold text-xl w-6 text-center">{seats}</span>
              <button
                onClick={() => setSeats(Math.min(8, seats + 1))}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          {/* Live Map Preview */}
          {(depCoords || destCoords) && (
            <div className="relative overflow-hidden rounded-3xl ambient-shadow">
              <MapView
                departureCoords={depCoords}
                destinationCoords={destCoords}
                className="h-48 w-full"
              />
              <div className="absolute top-3 left-3 z-[400] bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">auto_awesome</span>
                  Aperçu en direct
                </span>
              </div>
            </div>
          )}

          {/* Pricing Section */}
          <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary rounded-full opacity-10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary-fixed">info</span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary-fixed">
                  Transparence Tarifaire
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-on-primary-container font-medium">Distance calculée automatiquement</span>
                  <span className="font-headline font-bold text-xl">
                    {distance > 0 ? `${distance} km` : '-- km'}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-on-primary-container text-sm">Prix automatique</p>
                    <p className="text-xs opacity-60 mt-1">Le prix inclut la commission Roulii (24,0878 %)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-headline font-extrabold text-3xl text-secondary-fixed">
                      {pricePerKm.toFixed(2)} €
                    </span>
                    <span className="text-xs block text-on-primary-container">par km / passager</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-6 pb-10 pt-6 glass-bar rounded-t-3xl shadow-[0_-4px_40px_rgba(25,28,29,0.06)]">
        <button
          onClick={handlePublish}
          disabled={!departure || !destination}
          className="w-full bg-secondary text-white py-5 rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Publier le trajet</span>
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>
    </>
  );
}
