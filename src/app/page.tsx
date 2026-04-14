'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRidesStore } from '@/stores/ridesStore';
import { useUserStore } from '@/stores/userStore';
import { useNotificationsStore, selectUnreadCount } from '@/stores/notificationsStore';
import BottomNavBar from '@/components/BottomNavBar';
import AnimatedCounter from '@/components/AnimatedCounter';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };

export default function Home() {
  const rides = useRidesStore((s) => s.rides);
  const user = useUserStore((s) => s.user);
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);

  const upcomingRides = rides.filter((r) => r.status === 'confirmed' || r.status === 'pending');
  const firstUpcoming = upcomingRides[0];

  return (
    <>
      <main className="pb-32">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary pt-12 pb-10 px-6 rounded-b-[2.5rem]">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, var(--color-surface-tint) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-on-primary-container text-sm font-medium">Bonjour,</p>
                <h1 className="font-headline font-extrabold text-3xl text-white tracking-tight">
                  {user.name.split(' ')[0]}
                </h1>
              </div>
              <Link href="/profil" className="w-12 h-12 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/20">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                )}
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
                <AnimatedCounter value={user.reliabilityScore} decimals={0} suffix="%" className="font-headline font-extrabold text-xl text-white" />
                <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold mt-1">Fiabilité</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
                <AnimatedCounter value={user.totalTrips} decimals={0} className="font-headline font-extrabold text-xl text-white" />
                <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold mt-1">Trajets</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
                <AnimatedCounter value={upcomingRides.length} decimals={0} className="font-headline font-extrabold text-xl text-secondary-fixed" />
                <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold mt-1">À venir</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/creer-trajet"
                className="bg-secondary text-white rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-all shadow-lg shadow-secondary/30"
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                <span className="font-headline font-bold text-sm">Proposer</span>
              </Link>
              <Link
                href="/recherche"
                className="bg-white/15 backdrop-blur-md text-white rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">search</span>
                <span className="font-headline font-bold text-sm">Rechercher</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Next Ride Card */}
        {firstUpcoming && (
          <section className="px-6 -mt-6 relative z-10">
            <Link href={`/trajet/${firstUpcoming.id}`} className="block">
              <div className="bg-surface-container-lowest rounded-3xl p-5 ambient-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    Prochain trajet
                  </span>
                  <span className="text-xs font-bold text-primary">{firstUpcoming.date}, {firstUpcoming.time}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                    <div className="w-px h-8 bg-outline-variant/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-semibold text-on-surface truncate">{firstUpcoming.departure}</p>
                    <p className="text-sm font-semibold text-on-surface truncate">{firstUpcoming.destination}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-extrabold text-xl text-primary">{firstUpcoming.price.toFixed(2)}€</p>
                    <p className="text-[10px] text-on-surface-variant">{firstUpcoming.seats} places</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 bg-surface-container-low rounded-xl px-3 py-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
                    {firstUpcoming.driver.avatar ? (
                      <img src={firstUpcoming.driver.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-primary">{firstUpcoming.driver.name}</span>
                  <span className="ml-auto text-xs text-on-surface-variant flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-secondary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {firstUpcoming.driver.rating}
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Map Overview */}
        <section className="px-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline font-extrabold text-xl text-primary tracking-tight">Carte des trajets</h2>
            <Link href="/recherche" className="text-xs font-bold text-secondary">Voir tout</Link>
          </div>
          <div className="rounded-3xl overflow-hidden ambient-shadow">
            <MapView
              departureCoords={DEFAULT_CENTER}
              className="h-52 w-full"
              interactive
            />
          </div>
        </section>

        {/* How it Works */}
        <section className="px-6 mt-10">
          <h2 className="font-headline font-extrabold text-xl text-primary tracking-tight mb-6">Comment ça marche</h2>
          <div className="space-y-4">
            {[
              { icon: 'search', title: 'Trouvez un trajet', desc: 'Recherchez parmi les trajets disponibles ou proposez le vôtre.' },
              { icon: 'handshake', title: 'Réservez en sécurité', desc: 'Paiement sécurisé, identités vérifiées, messagerie chiffrée.' },
              { icon: 'directions_car', title: 'Voyagez sereinement', desc: 'Profitez du trajet avec un conducteur fiable et évalué.' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-surface-container-lowest ambient-shadow flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-primary">{step.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications Preview */}
        {unreadCount > 0 && (
          <section className="px-6 mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-extrabold text-xl text-primary tracking-tight">
                Notifications
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
              </h2>
              <button onClick={markAllAsRead} className="text-xs font-bold text-secondary">Tout lire</button>
            </div>
            <div className="space-y-2">
              {notifications.filter(n => !n.read).slice(0, 3).map((notif) => (
                <div key={notif.id} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow flex items-start gap-3">
                  <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                    notif.type === 'message' ? 'bg-primary-container text-white'
                    : notif.type === 'ride_confirmed' ? 'bg-secondary-container text-secondary'
                    : notif.type === 'penalty' ? 'bg-error-container text-error'
                    : 'bg-surface-container-high text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {notif.type === 'message' ? 'chat' : notif.type === 'ride_confirmed' ? 'check_circle' : notif.type === 'penalty' ? 'warning' : 'payments'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary">{notif.title}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{notif.body}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant shrink-0">{notif.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular rides */}
        <section className="mt-10">
          <div className="px-6 flex items-center justify-between mb-4">
            <h2 className="font-headline font-extrabold text-xl text-primary tracking-tight">Trajets populaires</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 pb-2 snap-x snap-mandatory scrollbar-hide">
            {rides.filter(r => r.status !== 'cancelled').map((ride) => (
              <Link
                key={ride.id}
                href={`/trajet/${ride.id}`}
                className="snap-start shrink-0 w-60 bg-surface-container-lowest rounded-2xl p-4 ambient-shadow active:scale-[0.97] transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    ride.status === 'confirmed' ? 'bg-secondary-container text-on-secondary-container'
                    : ride.status === 'pending' ? 'bg-surface-container-high text-on-surface-variant'
                    : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {ride.status === 'confirmed' ? 'Confirmé' : ride.status === 'pending' ? 'En attente' : 'Terminé'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant ml-auto">{ride.date}</span>
                </div>
                <p className="text-sm font-bold text-primary truncate">{ride.departure}</p>
                <p className="text-xs text-on-surface-variant truncate mt-0.5">{ride.destination}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-headline font-bold text-lg text-primary">{ride.price.toFixed(2)}€</span>
                  <span className="text-[10px] text-on-surface-variant">{ride.time}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <BottomNavBar />
    </>
  );
}
