'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRidesStore } from '@/stores/ridesStore';
import { useReviewsStore } from '@/stores/reviewsStore';
import TopAppBar from '@/components/TopAppBar';
import StarRating from '@/components/StarRating';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function DetailTrajet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const rides = useRidesStore((s) => s.rides);
  const ride = rides.find((r) => r.id === id);
  const reviews = useReviewsStore((s) => s.reviews).filter((r) => r.rideId === id);
  const addReview = useReviewsStore((s) => s.addReview);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSent, setReviewSent] = useState(false);

  if (!ride) {
    return (
      <>
        <TopAppBar title="Détails du trajet" />
        <main className="pt-24 px-6 flex items-center justify-center min-h-screen">
          <p className="text-on-surface-variant">Trajet introuvable</p>
        </main>
      </>
    );
  }

  const handleSubmitReview = () => {
    if (reviewRating === 0) return;
    addReview({
      rideId: id,
      driverName: 'Julien Lefebvre',
      rating: reviewRating,
      comment: reviewComment,
      date: "Aujourd'hui",
    });
    setReviewSent(true);
  };

  return (
    <>
      <TopAppBar title="Détails du trajet" />
      <main className="pt-20 px-6 pb-40 space-y-8">
        {/* Hero Map Section */}
        <section className="relative h-64 rounded-3xl overflow-hidden ambient-shadow">
          {ride.departureCoords && ride.destinationCoords ? (
            <MapView
              departureCoords={ride.departureCoords}
              destinationCoords={ride.destinationCoords}
              className="h-64 w-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-6xl text-outline-variant">map</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-[400]">
            <div className="bg-surface/90 backdrop-blur-md p-4 rounded-xl shadow-lg">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                Arrivée estimée
              </p>
              <p className="font-headline font-extrabold text-2xl text-primary">{ride.time}</p>
            </div>
          </div>
        </section>

        {/* Driver & Reliability */}
        <section className="grid grid-cols-1 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl flex items-center gap-5 ambient-shadow">
            <div className="relative">
              {ride.driver.avatar ? (
                <img className="w-16 h-16 rounded-full object-cover" src={ride.driver.avatar} alt={ride.driver.name} />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-1 border-2 border-white">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl text-primary">{ride.driver.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center bg-secondary-container/30 px-2 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold text-on-secondary-container ml-1">{ride.driver.rating}</span>
                </div>
                <span className="text-xs text-on-surface-variant font-medium">{ride.driver.trips.toLocaleString()} trajets</span>
              </div>
            </div>
          </div>
          <div className="bg-primary-container p-6 rounded-3xl flex flex-col justify-between">
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-primary-container">Score de fiabilité</p>
            <div className="flex items-baseline gap-1">
              <span className="font-headline font-extrabold text-3xl text-white">{ride.driver.reliabilityScore}</span>
              <span className="text-on-primary-container text-lg font-bold">%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
              <div className="bg-secondary h-full rounded-full" style={{ width: `${ride.driver.reliabilityScore}%` }}></div>
            </div>
          </div>
        </section>

        {/* Vehicle */}
        <section className="grid grid-cols-1 gap-4">
          <div className="bg-surface-container p-6 rounded-3xl flex flex-col justify-center">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-4">Véhicule</h3>
            <div className="space-y-1">
              <p className="font-headline font-extrabold text-lg text-primary">{ride.driver.vehicle.model}</p>
              <p className="text-on-surface-variant font-medium">{ride.driver.vehicle.color} • {ride.driver.vehicle.type}</p>
              {ride.driver.vehicle.plate && (
                <div className="inline-block mt-4 px-3 py-1.5 bg-surface-container-highest rounded-lg text-primary font-bold tracking-widest">
                  {ride.driver.vehicle.plate}
                </div>
              )}
            </div>
          </div>
          {ride.driver.vehicle.image && (
            <div className="rounded-3xl overflow-hidden relative group h-48">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={ride.driver.vehicle.image} alt={ride.driver.vehicle.model} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>
          )}
        </section>

        {/* Policy Section */}
        <section className="bg-error-container/20 p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-error-container rounded-lg">
              <span className="material-symbols-outlined text-on-error-container">policy</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-error-container">Politique d&apos;annulation</h3>
              <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                Soyez serein, mais prévoyant. <br />
                <span className="font-bold text-error">Annulation à moins de 10 min = 10 % facturé</span> du montant total du trajet réservé.
              </p>
            </div>
          </div>
        </section>

        {/* Itinerary */}
        <section className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-2">Itinéraire</h3>
          <div className="bg-surface-container-low rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute left-8 top-12 bottom-12 w-[2px] bg-primary/10"></div>
            <div className="flex items-start gap-6 relative z-10 mb-8">
              <div className="w-4 h-4 rounded-full border-4 border-secondary bg-white mt-1.5 shadow-sm"></div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Départ</p>
                <p className="font-bold text-primary">{ride.departure}</p>
              </div>
            </div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-4 h-4 rounded-full border-4 border-primary bg-white mt-1.5 shadow-sm"></div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Destination</p>
                <p className="font-bold text-primary">{ride.destination}</p>
              </div>
            </div>
          </div>
        </section>
        {/* Reviews Section */}
        {ride.status === 'completed' && (
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-2">Avis</h3>
            {reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-headline font-bold text-sm text-primary">{review.driverName}</span>
                      <span className="text-[10px] text-on-surface-variant">{review.date}</span>
                    </div>
                    <StarRating rating={review.rating} readonly size="sm" />
                    {review.comment && (
                      <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!reviewSent ? (
              <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                <p className="font-headline font-bold text-sm text-primary">Donner votre avis</p>
                <StarRating rating={reviewRating} onRate={setReviewRating} size="lg" />
                <textarea
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm placeholder:text-outline focus:ring-2 focus:ring-secondary/40 focus:outline-none transition-all resize-none"
                  placeholder="Décrivez votre expérience..."
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0}
                  className="w-full bg-secondary text-white py-3 rounded-full font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  Publier l&apos;avis
                </button>
              </div>
            ) : (
              <div className="bg-secondary-container/20 rounded-3xl p-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-bold text-secondary text-sm">Merci pour votre avis !</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-6 pb-8 pt-4 glass-bar">
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-surface-container-highest text-primary flex flex-col items-center justify-center py-3 rounded-xl active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl mb-1">map</span>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest">Itinéraire</span>
          </button>
          <Link
            href={`/messagerie/${ride.id}`}
            className="bg-primary text-white flex flex-col items-center justify-center py-3 rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest">Contacter</span>
          </Link>
          <Link
            href={`/annulation/${ride.id}`}
            className="bg-error-container text-on-error-container flex flex-col items-center justify-center py-3 rounded-xl active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xl mb-1">close</span>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest">Annuler</span>
          </Link>
        </div>
      </div>
    </>
  );
}
