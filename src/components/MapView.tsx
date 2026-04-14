'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Coords } from '@/stores/types';

interface MapViewProps {
  departureCoords?: Coords;
  destinationCoords?: Coords;
  className?: string;
  interactive?: boolean;
}

export default function MapView({
  departureCoords,
  destinationCoords,
  className = 'h-64 w-full',
  interactive = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const [loaded, setLoaded] = useState(false);

  const createIcon = useCallback((color: string, label: string) => {
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="display:flex;flex-direction:column;align-items:center;">
        <div style="background:${color};color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
        <div style="width:14px;height:14px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px ${color}66;"></div>
      </div>`,
      iconSize: [80, 36],
      iconAnchor: [40, 36],
    });
  }, []);

  // Effect 1: Initialize map on mount, destroy on unmount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: L.Map | null = null;
    let cancelled = false;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !container) return;

      const defaultCenter: [number, number] = [48.8566, 2.3522];
      const center = departureCoords
        ? [departureCoords.lat, departureCoords.lng] as [number, number]
        : defaultCenter;

      map = L.map(container, {
        center,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap France',
      }).addTo(map);

      mapInstanceRef.current = map;
      setLoaded(true);
    };

    initMap();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
      }
      mapInstanceRef.current = null;
      markersRef.current = [];
      setLoaded(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: Update markers and route when coords change (using primitive deps)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = require('leaflet');

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (departureCoords) {
      const marker = L.marker([departureCoords.lat, departureCoords.lng], { icon: createIcon('#006d37', 'Départ') }).addTo(map);
      markersRef.current.push(marker);
    }
    if (destinationCoords) {
      const marker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: createIcon('#020135', 'Arrivée') }).addTo(map);
      markersRef.current.push(marker);
    }

    if (departureCoords && destinationCoords) {
      const latlngs: [number, number][] = [
        [departureCoords.lat, departureCoords.lng],
        [destinationCoords.lat, destinationCoords.lng],
      ];
      const polyline = L.polyline(latlngs, {
        color: '#006d37',
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 8',
      }).addTo(map);
      markersRef.current.push(polyline);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (departureCoords) {
      map.setView([departureCoords.lat, departureCoords.lng], 12);
    }
  }, [departureCoords?.lat, departureCoords?.lng, destinationCoords?.lat, destinationCoords?.lng, createIcon]);

  return (
    <div className={`relative rounded-3xl overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-surface-container-high animate-pulse flex items-center justify-center z-10">
          <span className="material-symbols-outlined text-4xl text-outline-variant">map</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
