'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useRidesStore } from '@/stores/ridesStore';
import { useWalletStore } from '@/stores/walletStore';
import { useUserStore } from '@/stores/userStore';
import TopAppBar from '@/components/TopAppBar';

export default function AnnulationTrajet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const rides = useRidesStore((s) => s.rides);
  const ride = rides.find((r) => r.id === id);
  const cancelRide = useRidesStore((s) => s.cancelRide);
  const debit = useWalletStore((s) => s.debit);
  const updateCancellationRate = useUserStore((s) => s.updateCancellationRate);

  if (!ride) {
    return (
      <>
        <TopAppBar title="Roulii" />
        <main className="pt-24 px-6 flex items-center justify-center min-h-screen">
          <p className="text-on-surface-variant">Trajet introuvable</p>
        </main>
      </>
    );
  }

  const minutesElapsed = Math.floor((Date.now() - ride.createdAt) / 60000);
  const isOverDeadline = minutesElapsed > 10;
  const penaltyRate = 0.10;
  const penaltyAmount = Number((ride.price * penaltyRate).toFixed(2));

  const handleConfirmCancel = () => {
    cancelRide(id);
    updateCancellationRate();
    if (isOverDeadline) {
      debit(penaltyAmount, `Pénalité annulation - ${ride.departure}`);
    }
    router.push('/mes-trajets');
  };

  return (
    <>
      <TopAppBar title="Roulii" />
      <main className="pt-24 pb-48 px-6 max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Editorial Header */}
        <div className="mb-10">
          <h2 className="font-headline font-extrabold text-[2.5rem] leading-tight tracking-tighter text-primary mb-4">
            Annuler votre course ?
          </h2>
          <p className="text-on-surface-variant font-medium leading-relaxed">
            Veuillez confirmer votre intention d&apos;annuler. Les conditions dépendent du temps écoulé depuis la réservation.
          </p>
        </div>

        <div className="space-y-6">
          {/* Current State */}
          <div className="bg-surface-container-low rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-1">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                  Temps écoulé
                </p>
                <p className="font-headline font-bold text-2xl text-primary">{minutesElapsed} minutes</p>
              </div>
              {isOverDeadline ? (
                <div className="bg-error-container text-on-error-container px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <span className="font-label text-xs font-bold uppercase tracking-wider">Hors délai</span>
                </div>
              ) : (
                <div className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-label text-xs font-bold uppercase tracking-wider">Éligible</span>
                </div>
              )}
            </div>
            {isOverDeadline ? (
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-error">Une pénalité de 10 % sera appliquée</h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      Conformément à notre politique de flexibilité.
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 bg-surface-container-low rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Montant estimé des frais</span>
                  <span className="font-headline font-bold text-primary">{penaltyAmount.toFixed(2)} €</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">eco</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-secondary">Annulation gratuite</h3>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">
                    Aucun frais ne sera prélevé sur votre compte.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Simulation: opposite state */}
          <div className="bg-surface-container-low rounded-3xl p-6 opacity-50">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                  {isOverDeadline ? 'Simulation : Moins de 10 min' : 'Simulation : Plus de 10 min'}
                </p>
                <p className="font-headline font-bold text-xl text-primary">
                  {isOverDeadline ? '4 minutes' : '12 minutes'}
                </p>
              </div>
              {isOverDeadline ? (
                <div className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-label text-xs font-bold uppercase tracking-wider">Éligible</span>
                </div>
              ) : (
                <div className="bg-error-container text-on-error-container px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <span className="font-label text-xs font-bold uppercase tracking-wider">Hors délai</span>
                </div>
              )}
            </div>
            {isOverDeadline ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">eco</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-secondary">Annulation gratuite</h3>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">
                    Aucun frais ne sera prélevé sur votre compte.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-error">Pénalité de 10 %</h3>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">
                    {penaltyAmount.toFixed(2)} € seront facturés.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ride Context Card */}
        <div className="mt-10 mb-8 p-6 bg-primary-container rounded-3xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-primary flex items-center justify-center">
                  {ride.driver.avatar ? (
                    <img className="w-full h-full object-cover" src={ride.driver.avatar} alt={ride.driver.name} />
                  ) : (
                    <span className="material-symbols-outlined text-white">person</span>
                  )}
                </div>
                <div>
                  <p className="font-headline font-bold">{ride.driver.name}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-70">
                    {ride.driver.vehicle.model} • {ride.driver.vehicle.plate}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Prix course</p>
                <p className="font-headline font-bold">{ride.price.toFixed(2)} €</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-sm">radio_button_checked</span>
                <span className="text-sm font-medium">{ride.departure}</span>
              </div>
              <div className="w-px h-4 bg-white/20 ml-[7px]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white/50 text-sm">location_on</span>
                <span className="text-sm font-medium">{ride.destination}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-bar px-6 pb-10 pt-4 flex flex-col gap-4">
        <button
          onClick={handleConfirmCancel}
          className="w-full bg-secondary text-on-secondary font-headline font-extrabold text-lg py-5 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">close</span>
          Confirmer l&apos;annulation
        </button>
        <button
          onClick={() => router.back()}
          className="w-full text-primary font-headline font-bold text-sm py-2 active:opacity-60 transition-opacity"
        >
          Conserver ma course
        </button>
      </div>
    </>
  );
}
