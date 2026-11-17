'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PinPickerInnerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function PinPickerInner({ lat, lng, onChange }: PinPickerInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = lat || 12.9815;
    const initialLng = lng || 80.2180;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing">
          <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-2xl animate-bounce">
            <span class="w-2.5 h-2.5 rounded-full bg-white"></span>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rounded-full bg-red-500/50 blur-[2px]"></div>
        </div>
      `,
      className: 'resq-pin-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position if external lat/lng changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && lat && lng) {
      const cur = markerRef.current.getLatLng();
      if (Math.abs(cur.lat - lat) > 0.0001 || Math.abs(cur.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.panTo([lat, lng]);
      }
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 z-[400] px-2 py-1 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-cyan-300 pointer-events-none shadow">
        Click or drag pin: {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
}
