'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import TopAppBar from '@/components/TopAppBar';

const avatarOptions = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=nina',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
];

export default function ModifierProfil() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser({ name, avatar: selectedAvatar });
    setSaved(true);
    setTimeout(() => router.push('/profil'), 1200);
  };

  return (
    <>
      <TopAppBar title="Modifier profil" />
      <main className="pt-24 px-6 pb-32 space-y-8">
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
          Modifier profil
        </h2>

        {/* Avatar Selection */}
        <section>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Avatar
          </label>
          <div className="grid grid-cols-3 gap-3">
            {avatarOptions.map((url) => (
              <button
                key={url}
                onClick={() => setSelectedAvatar(url)}
                className={`relative aspect-square rounded-2xl overflow-hidden transition-all ${
                  selectedAvatar === url
                    ? 'ring-3 ring-secondary scale-105 shadow-lg'
                    : 'ring-1 ring-outline-variant/20 hover:scale-105'
                }`}
              >
                <img src={url} alt="Avatar" className="w-full h-full object-cover bg-surface-container-high" />
                {selectedAvatar === url && (
                  <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedAvatar(user.avatar)}
            className="mt-3 text-xs font-bold text-secondary"
          >
            Garder la photo actuelle
          </button>
        </section>

        {/* Name */}
        <section>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Nom complet
          </label>
          <input
            className="w-full bg-surface-container-highest rounded-xl px-4 py-4 text-lg font-semibold placeholder:text-outline focus:ring-2 focus:ring-secondary/40 focus:outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full bg-secondary text-white py-5 rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
        >
          {saved ? (
            <>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Enregistré !
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              Enregistrer
            </>
          )}
        </button>
      </main>

      {saved && (
        <div className="fixed top-20 left-1/2 z-[100] bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-bold text-sm shadow-[0_4px_40px_rgba(25,28,29,0.1)] animate-toast flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Profil mis à jour
        </div>
      )}
    </>
  );
}
