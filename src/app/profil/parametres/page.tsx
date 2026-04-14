'use client';

import { useSettingsStore } from '@/stores/settingsStore';
import TopAppBar from '@/components/TopAppBar';

export default function Parametres() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const toggleItems = [
    { key: 'notifications' as const, icon: 'notifications', label: 'Notifications push', desc: 'Recevoir les alertes de trajets et messages' },
    { key: 'privacy' as const, icon: 'shield', label: 'Mode privé', desc: 'Masquer votre profil des recherches publiques' },
    { key: 'darkMode' as const, icon: 'dark_mode', label: 'Mode sombre', desc: 'Bientôt disponible', disabled: true },
  ];

  return (
    <>
      <TopAppBar title="Paramètres" />
      <main className="pt-24 px-6 pb-32 space-y-6">
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
          Paramètres
        </h2>

        {/* Language */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-4">Langue</h3>
          <div className="flex gap-3">
            {(['fr', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  settings.language === lang
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-surface-container-high text-primary'
                }`}
              >
                {lang === 'fr' ? 'Français' : 'English'}
              </button>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section className="space-y-3">
          {toggleItems.map((item) => (
            <div key={item.key} className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow flex items-center justify-between ${item.disabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-primary">{item.label}</p>
                  <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
              <button
                disabled={item.disabled}
                onClick={() => updateSetting(item.key, !settings[item.key])}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  settings[item.key] ? 'bg-secondary' : 'bg-surface-container-high'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                  settings[item.key] ? 'left-5.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          ))}
        </section>

        {/* App Info */}
        <section className="bg-surface-container-low rounded-3xl p-6 text-center">
          <p className="font-headline font-bold text-sm text-primary">Roulii v1.0.0</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Made with care in Paris</p>
        </section>
      </main>
    </>
  );
}
