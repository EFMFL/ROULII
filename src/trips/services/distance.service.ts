import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Point {
  lat: number;
  lng: number;
}

@Injectable()
export class DistanceService {
  constructor(private readonly configService: ConfigService) {}

  async calculateDistanceKm(
    origin: string,
    destination: string,
  ): Promise<{ distanceKm: number; source: 'haversine' | 'openrouteservice' }> {
    const originPoint = this.parseCoordinate(origin);
    const destinationPoint = this.parseCoordinate(destination);

    if (originPoint && destinationPoint) {
      const distance = this.haversineDistanceKm(originPoint, destinationPoint);
      const roadEstimated = distance * 1.18;
      return { distanceKm: this.round2(roadEstimated), source: 'haversine' };
    }

    const apiKey = this.configService.get<string>('ORS_API_KEY');
    if (!apiKey) {
      throw new BadRequestException(
        'Utilisez des coordonnees GPS (lat,lng) ou configurez ORS_API_KEY',
      );
    }

    const originGeo = await this.geocodeAddress(origin, apiKey);
    const destinationGeo = await this.geocodeAddress(destination, apiKey);
    const distance = await this.fetchRouteDistanceKm(
      originGeo,
      destinationGeo,
      apiKey,
    );

    return { distanceKm: this.round2(distance), source: 'openrouteservice' };
  }

  private parseCoordinate(value: string): Point | null {
    const match = value
      .trim()
      .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

    if (!match) {
      return null;
    }

    const lat = Number(match[1]);
    const lng = Number(match[2]);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Coordonnees GPS invalides');
    }

    return { lat, lng };
  }

  private haversineDistanceKm(origin: Point, destination: Point): number {
    const toRad = (degrees: number) => (degrees * Math.PI) / 180;

    const earthRadiusKm = 6371;
    const dLat = toRad(destination.lat - origin.lat);
    const dLng = toRad(destination.lng - origin.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(origin.lat)) *
        Math.cos(toRad(destination.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private async geocodeAddress(query: string, apiKey: string): Promise<Point> {
    const url = new URL('https://api.openrouteservice.org/geocode/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('text', query);
    url.searchParams.set('size', '1');

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new BadRequestException('Impossible de geocoder l adresse');
    }

    const payload = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };

    const coordinates = payload.features?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length !== 2) {
      throw new BadRequestException('Adresse non trouvee');
    }

    return { lat: coordinates[1], lng: coordinates[0] };
  }

  private async fetchRouteDistanceKm(
    origin: Point,
    destination: Point,
    apiKey: string,
  ): Promise<number> {
    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        'Impossible de calculer la distance routiere',
      );
    }

    const payload = (await response.json()) as {
      routes?: Array<{ summary?: { distance?: number } }>;
    };

    const meters = payload.routes?.[0]?.summary?.distance;
    if (!meters) {
      throw new BadRequestException('Distance non disponible');
    }

    return meters / 1000;
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
