'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRidesStore } from '@/stores/ridesStore';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';

export default function MesTrajets() {
  return (
    <Suspense>
      <MesTrajetsContent />
    </Suspense>
  );
}

function MesTrajetsContent() {
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showToast, setShowToast] = useState(false);
  const searchParams = useSearchParams();
  const rides = useRidesStore((s) => s.rides);

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      window.history.replaceState(null, '', '/mes-trajets');
    }
  }, [searchParams]);

  const filteredRides = tab === 'upcoming'
    ? rides.filter((r) => r.status === 'confirmed' || r.status === 'pending')
    : rides.filter((r) => r.status === 'completed' || r.status === 'cancelled');

  return (
    <>
      <TopAppBar title="Mes Trajets" showBack={false} />
      <main className="pt-24 px-6 pb-32">
        {/* Tab Navigation */}
        <div role="tablist" className="flex bg-surface-container-low p-1.5 rounded-full mb-8">
          <button
            role="tab"
            aria-selected={tab === 'upcoming'}
            onClick={() => setTab('upcoming')}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all ${
              tab === 'upcoming'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant font-medium hover:opacity-80'
            }`}
          >
            À venir
          </button>
          <button
            role="tab"
            aria-selected={tab === 'completed'}
            onClick={() => setTab('completed')}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm transition-all ${
              tab === 'completed'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant font-medium hover:opacity-80'
            }`}
          >
            Terminés
          </button>
        </div>

        {/* Rides List */}
        <div className="space-y-6 stagger-children">
          {filteredRides.length === 0 ? (
            <div className="py-16 flex flex-col items-center opacity-40">
              <span className="material-symbols-outlined text-6xl mb-4">route</span>
              <p className="text-sm font-medium">
                {tab === 'upcoming' ? 'Aucun trajet à venir' : 'Aucun trajet terminé'}
              </p>
            </div>
          ) : (
            filteredRides.map((ride, index) => (
              <div key={ride.id}>
                {index === 0 && tab === 'upcoming' && ride.status === 'confirmed' ? (
                  /* Main Highlight Card */
                  <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest ambient-shadow group">
                    {ride.mapImage && (
                      <div className="h-32 w-full relative overflow-hidden">
                        <img
                          className="w-full h-full object-cover"
                          src={ride.mapImage}
                          alt="Carte du trajet"
                        />
                        <div className="absolute top-4 right-4">
                          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            Confirmé
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-1">
                            {ride.date}, {ride.time}
                          </p>
                          <h3 className="text-xl font-bold text-primary leading-tight font-headline">
                            {ride.departure}
                          </h3>
                        </div>
                        <p className="text-2xl font-extrabold text-primary font-headline">
                          {ride.price.toFixed(2)}€
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mb-6 p-3 bg-surface-container-low rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white">
                          <span className="material-symbols-outlined">directions_car</span>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant font-medium">Chauffeur</p>
                          <p className="text-sm font-bold text-primary">{ride.driver.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={`/annulation/${ride.id}`}
                          className="py-3 px-4 rounded-full bg-surface-container-high text-primary font-bold text-sm text-center hover:bg-surface-container-highest transition-colors"
                        >
                          Annuler
                        </Link>
                        <Link
                          href={`/trajet/${ride.id}`}
                          className="py-3 px-4 rounded-full bg-primary text-on-primary font-bold text-sm text-center shadow-lg shadow-primary/10 active:scale-95 transition-all"
                        >
                          Voir détails
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Secondary Card */
                  <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">event</span>
                        <span className="text-sm font-semibold text-on-surface">
                          {ride.date} • {ride.time}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          ride.status === 'confirmed'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : ride.status === 'pending'
                            ? 'bg-surface-container-high text-on-surface-variant'
                            : ride.status === 'cancelled'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {ride.status === 'confirmed'
                          ? 'Confirmé'
                          : ride.status === 'pending'
                          ? 'En attente'
                          : ride.status === 'cancelled'
                          ? 'Annulé'
                          : 'Terminé'}
                      </span>
                    </div>
                    <div className="mb-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                          <div className="w-px h-6 bg-outline-variant/30"></div>
                          <div className="w-2 h-2 rounded-full bg-secondary"></div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">
                              Départ
                            </p>
                            <p className="text-sm font-semibold text-on-surface">{ride.departure}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">
                              Destination
                            </p>
                            <p className="text-sm font-semibold text-on-surface">{ride.destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-2 bg-surface-container-low rounded-xl px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-on-surface-variant">Estimation</span>
                        <span className="text-lg font-bold text-primary font-headline">
                          {ride.price.toFixed(2)}€
                        </span>
                      </div>
                      <Link
                        href={`/trajet/${ride.id}`}
                        className="bg-secondary text-on-secondary px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-secondary/20 active:scale-95 transition-all"
                      >
                        Voir détails
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Empty state hint */}
          {tab === 'upcoming' && filteredRides.length > 0 && (
            <div className="py-12 flex flex-col items-center opacity-40 grayscale">
              <span className="material-symbols-outlined text-6xl mb-4">route</span>
              <p className="text-sm font-medium">Plus de trajets à venir</p>
            </div>
          )}
        </div>

        {/* FAB: Create Ride */}
        <Link
          href="/creer-trajet"
          className="fixed bottom-28 right-1/2 translate-x-[calc(50vw-2rem)] max-w-md w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-[0_4px_40px_rgba(0,109,55,0.25)] active:scale-95 transition-all z-40"
          style={{ right: 'max(1.5rem, calc(50% - 14rem))' }}
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </Link>
      </main>
      {showToast && (
        <div className="fixed top-20 left-1/2 z-[100] bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-bold text-sm shadow-[0_4px_40px_rgba(25,28,29,0.1)] animate-toast flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Trajet publié avec succès
        </div>
      )}

      <BottomNavBar />
    </>
  );
}
