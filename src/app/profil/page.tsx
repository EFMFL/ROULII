'use client';

import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';
import { useWalletStore } from '@/stores/walletStore';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';

export default function Profil() {
  const user = useUserStore((s) => s.user);
  const resetUser = useUserStore((s) => s.resetUser);
  const balance = useWalletStore((s) => s.balance);

  const menuItems = [
    { icon: 'edit', label: 'Modifier profil', href: '/profil/modifier' },
    { icon: 'directions_car', label: 'Mes trajets', href: '/mes-trajets' },
    { icon: 'account_balance_wallet', label: 'Wallet', href: '/wallet', extra: `${balance.toFixed(2)} €` },
    { icon: 'search', label: 'Rechercher un trajet', href: '/recherche' },
    { icon: 'settings', label: 'Paramètres', href: '/profil/parametres' },
  ];

  return (
    <>
      <TopAppBar title="Profil" showBack={false} />
      <main className="pt-24 px-6 pb-32 max-w-lg mx-auto">
        {/* Hero Profile Section */}
        <section className="mb-10 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500">
              {user.avatar ? (
                <img alt="Photo de profil" className="w-full h-full object-cover" src={user.avatar} />
              ) : (
                <div className="w-full h-full bg-primary-container flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-5xl">person</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter uppercase shadow-sm">
              {user.badge}
            </div>
          </div>
          <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">{user.name}</h2>
          <p className="text-on-surface-variant font-body text-sm mt-1">Membre depuis {user.memberSince}</p>
        </section>

        {/* Bento Stats Grid */}
        <section className="grid grid-cols-2 gap-3 mb-10">
          <div className="col-span-2 bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl flex flex-col justify-between aspect-[2/1] relative overflow-hidden">
            <div className="z-10">
              <span className="text-on-primary-container text-xs font-label uppercase tracking-widest opacity-80">
                Score fiabilité
              </span>
              <div className="text-5xl font-headline font-extrabold text-white mt-1 italic">
                {user.reliabilityScore}<span className="text-xl opacity-60 not-italic">%</span>
              </div>
            </div>
            <div className="z-10 flex justify-between items-end">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-fixed" style={{ width: `${user.reliabilityScore}%` }}></div>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col gap-1 ambient-shadow">
            <span className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest">
              Nombre de trajets
            </span>
            <span className="text-2xl font-headline font-bold text-primary">{user.totalTrips}</span>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col gap-1 ambient-shadow">
            <span className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest">
              Taux d&apos;annulation
            </span>
            <span className="text-2xl font-headline font-bold text-secondary">{user.cancellationRate}%</span>
          </div>
        </section>

        {/* Settings List */}
        <section className="space-y-3">
          <h3 className="text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant mb-4 ml-1">
            Paramètres du compte
          </h3>
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-highest active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <span className="font-body font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.extra && <span className="text-xs font-bold text-secondary">{item.extra}</span>}
                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
          <button
            onClick={resetUser}
            className="w-full flex items-center gap-4 p-4 mt-8 text-error active:scale-[0.98] transition-all hover:opacity-70"
          >
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <span className="font-body font-bold">Déconnexion</span>
          </button>
        </section>
      </main>
      <BottomNavBar />
    </>
  );
}
