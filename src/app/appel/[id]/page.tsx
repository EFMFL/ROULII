'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRidesStore } from '@/stores/ridesStore';

export default function AppelSecurise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const rides = useRidesStore((s) => s.rides);
  const ride = rides.find((r) => r.id === id);

  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [video, setVideo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const driverName = ride?.driver.name || 'Marc Durand';
  const driverAvatar = ride?.driver.avatar || '';

  const handleHangUp = () => {
    router.push(ride ? `/messagerie/${ride.id}` : '/mes-trajets');
  };

  return (
    <div className="min-h-screen w-full bg-primary antialiased font-body overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-primary-container opacity-40 blur-[100px]"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-secondary/10 opacity-30 blur-[120px]"></div>
      </div>

      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></div>
          <span className="font-headline font-bold text-white/90 text-sm tracking-widest uppercase">
            Appel sécurisé
          </span>
          <span className="text-white/40 text-xs ml-2">{formatTime(elapsed)}</span>
        </div>
        <button aria-label="Plus d'options" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition-transform active:scale-95">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main className="relative min-h-screen w-full flex flex-col items-center justify-between pt-32 pb-24 px-8">
        {/* Identity Section */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
          <div className="relative group">
            <div className="absolute inset-[-24px] rounded-full border-2 border-secondary-fixed/30 animate-pulse-ring"></div>
            <div className="absolute inset-[-48px] rounded-full border border-secondary-fixed/15 animate-pulse-ring-delay"></div>
            <div className="absolute inset-0 rounded-full bg-secondary-fixed opacity-10 scale-110 blur-xl"></div>
            <div className="relative w-48 h-48 rounded-full p-1.5 bg-gradient-to-tr from-secondary-fixed/50 to-primary-container/50">
              {driverAvatar ? (
                <img
                  className="w-full h-full rounded-full object-cover grayscale-[20%] border-4 border-primary"
                  src={driverAvatar}
                  alt={driverName}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary-container border-4 border-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-6xl">person</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 right-6 bg-secondary-fixed text-primary px-3 py-1 rounded-full font-headline font-bold text-[10px] tracking-tighter shadow-lg">
              EN LIGNE
            </div>
          </div>
          <div className="mt-8 text-center">
            <h1 className="font-headline font-extrabold text-4xl text-white tracking-tight leading-none mb-2">
              {driverName}
            </h1>
            <p className="text-white/60 font-medium tracking-wide">Conseiller Mobilité Senior</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-secondary-fixed">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-[11px] font-bold uppercase tracking-widest">Identité Vérifiée</span>
            </div>
          </div>
        </div>

        {/* In-Call Controls */}
        <div className="relative z-10 w-full max-w-sm grid grid-cols-3 gap-4">
          <button
            aria-label={muted ? 'Désactiver le mode muet' : 'Activer le mode muet'}
            onClick={() => setMuted(!muted)}
            className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all active:scale-95 ${
              muted ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white ${muted ? 'bg-white/30' : 'bg-white/10 group-hover:bg-white/20'}`}>
              <span className="material-symbols-outlined">{muted ? 'mic_off' : 'mic'}</span>
            </div>
            <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">Muet</span>
          </button>
          <button
            aria-label={speaker ? 'Désactiver le haut-parleur' : 'Activer le haut-parleur'}
            onClick={() => setSpeaker(!speaker)}
            className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all active:scale-95 ${
              speaker ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white ${speaker ? 'bg-white/30' : 'bg-white/10 group-hover:bg-white/20'}`}>
              <span className="material-symbols-outlined">volume_up</span>
            </div>
            <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">Haut-parleur</span>
          </button>
          <button
            aria-label={video ? 'Désactiver la vidéo' : 'Activer la vidéo'}
            onClick={() => setVideo(!video)}
            className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-3xl transition-all active:scale-95 ${
              video ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white ${video ? 'bg-white/30' : 'bg-white/10 group-hover:bg-white/20'}`}>
              <span className="material-symbols-outlined">{video ? 'videocam' : 'video_call'}</span>
            </div>
            <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">Vidéo</span>
          </button>
        </div>

        {/* Hang Up */}
        <div className="relative z-10 w-full max-w-sm px-4">
          <button
            onClick={handleHangUp}
            className="w-full bg-error flex items-center justify-center gap-4 rounded-full py-5 text-white font-headline font-bold text-lg shadow-[0_20px_50px_rgba(186,26,26,0.3)] transition-all hover:scale-[1.02] active:scale-95"
          >
            <span
              className="material-symbols-outlined bg-white/20 p-2 rounded-full transform rotate-[135deg]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              call
            </span>
            Raccrocher
          </button>
        </div>
      </main>

      {/* Security Toast */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-primary-container/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          <span className="text-white/70 text-[11px] font-medium tracking-tight">Chiffrement de bout en bout actif</span>
        </div>
      </div>
    </div>
  );
}
