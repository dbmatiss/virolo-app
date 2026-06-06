"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Polyline, Marker } from "leaflet";

interface MapProps {
  route: [number, number][] | null;
  center: [number, number];
}

export default function Map({ route, center }: MapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<Polyline | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const positionMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix Leaflet default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView(center, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
    };

    initMap();
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.setView(center, map.getZoom());

    const updatePositionMarker = async () => {
      const L = (await import("leaflet")).default;

      // Icône point bleu pulsant via CSS inline
      const pulseIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:16px;height:16px;
          background:#3b82f6;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 0 4px rgba(59,130,246,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      if (positionMarkerRef.current) {
        positionMarkerRef.current.setLatLng(center);
      } else {
        positionMarkerRef.current = L.marker(center, { icon: pulseIcon }).addTo(map);
      }
    };

    updatePositionMarker();
  }, [center]);

  useEffect(() => {
    if (!mapRef.current || !route) return;

    const updateRoute = async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      if (polylineRef.current) polylineRef.current.remove();
      if (markerRef.current) markerRef.current.remove();

      polylineRef.current = L.polyline(route, {
        color: "#f97316",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      markerRef.current = L.marker(route[0]).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    };

    updateRoute();
  }, [route]);

  return <div ref={containerRef} className="w-full h-full" />;
}
