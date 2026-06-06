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
    mapRef.current.setView(center, mapRef.current.getZoom());
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
