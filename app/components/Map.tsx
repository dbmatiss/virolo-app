"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Polyline, Marker } from "leaflet";

interface MapProps {
  route: [number, number][] | null;
  center: [number, number];
  onCenterChange?: (latlng: [number, number]) => void;
  theme?: "dark" | "light";
}

export default function Map({ route, center, onCenterChange, theme = "dark" }: MapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<Polyline | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const positionMarkerRef = useRef<Marker | null>(null);
  const tileLayerRef = useRef<ReturnType<typeof import("leaflet")["default"]["tileLayer"]> | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);

  useEffect(() => { onCenterChangeRef.current = onCenterChange; }, [onCenterChange]);

  // Switch tuiles quand le thème change
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const updateTiles = async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;
      tileLayerRef.current?.remove();
      const tileUrl = theme === "light"
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
    };
    updateTiles();
  }, [theme]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { zoomControl: false }).setView(center, 12);

      // CartoDB tiles — dark ou light selon le thème
      const tileUrl = theme === "light"
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Zoom controls en bas à droite
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Clic sur la carte → changer le point de départ
      map.on("click", (e) => {
        if (onCenterChangeRef.current) {
          onCenterChangeRef.current([e.latlng.lat, e.latlng.lng]);
        }
      });

      mapRef.current = map;
    };

    initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centre + marqueur de position
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.setView(center, map.getZoom());

    const updatePositionMarker = async () => {
      const L = (await import("leaflet")).default;

      const pulseIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:16px;height:16px;
          background:#3b82f6;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 0 6px rgba(59,130,246,0.25);
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

  // Route
  useEffect(() => {
    if (!mapRef.current || !route) return;

    const updateRoute = async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      if (polylineRef.current) polylineRef.current.remove();
      if (markerRef.current) markerRef.current.remove();

      // Ligne orange avec légère ombre pour ressortir sur la carte sombre
      polylineRef.current = L.polyline(route, {
        color: "#f97316",
        weight: 5,
        opacity: 1,
      }).addTo(map);

      // Marqueur de départ custom
      const startIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;
          background:#f97316;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(249,115,22,0.6);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      markerRef.current = L.marker(route[0], { icon: startIcon }).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [60, 60] });
    };

    updateRoute();
  }, [route]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: onCenterChange ? "crosshair" : "grab" }}
    />
  );
}
