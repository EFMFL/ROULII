export interface Coords {
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  departure: string;
  destination: string;
  departureCoords?: Coords;
  destinationCoords?: Coords;
  date: string;
  time: string;
  price: number;
  seats: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  driver: {
    name: string;
    avatar: string;
    rating: number;
    trips: number;
    reliabilityScore: number;
    vehicle: {
      model: string;
      color: string;
      type: string;
      plate: string;
      image: string;
    };
  };
  createdAt: number;
  mapImage: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'penalty_received' | 'penalty_paid' | 'refund';
  label: string;
  amount: number;
  date: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  sender: 'user' | 'remote' | 'system';
  text: string;
  time: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  memberSince: string;
  reliabilityScore: number;
  totalTrips: number;
  cancellationRate: number;
  badge: string;
}

export interface Review {
  id: string;
  rideId: string;
  driverName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AppNotification {
  id: string;
  type: 'message' | 'ride_confirmed' | 'ride_cancelled' | 'penalty' | 'payment';
  title: string;
  body: string;
  time: string;
  read: boolean;
  rideId?: string;
}

export interface Settings {
  darkMode: boolean;
  notifications: boolean;
  language: 'fr' | 'en';
  privacy: boolean;
}
