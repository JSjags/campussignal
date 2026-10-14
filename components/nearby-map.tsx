"use client";
import { useEffect, useRef } from "react";
import type { MapPin, User } from "@/lib/domain";
export default function NearbyMap({
  center,
  peers,
  pins,
}: {
  center: { lat: number; lng: number };
  peers: Pick<User, "id" | "name" | "lat" | "lng">[];
  pins: MapPin[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    import("leaflet").then((L) => {
      if (disposed || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView(
        [center.lat, center.lng],
        15,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);
      L.circle([center.lat, center.lng], {
        radius: 1600,
        color: "#397565",
        fillOpacity: 0.05,
        weight: 1,
        dashArray: "5 8",
      }).addTo(map);
      const icon = (label: string, desk = false) =>
        L.divIcon({
          className: "custom-pin",
          html: `<span class="pin ${desk ? "desk-pin" : ""}">${label}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });
      L.marker([center.lat, center.lng], { icon: icon("●") })
        .addTo(map)
        .bindPopup("Your approximate area");
      for (const p of peers) {
        const popup = document.createElement("span");
        popup.textContent = `${p.name} · approximate location`;
        L.marker([p.lat, p.lng], {
          icon: icon(p.name.slice(0, 1).replace(/[^a-zA-Z]/g, "?")),
        })
          .addTo(map)
          .bindPopup(popup);
      }
      for (const p of pins) {
        const popup = document.createElement("span");
        popup.textContent = p.title;
        L.marker([p.lat + 0.0008, p.lng], {
          icon: icon(p.kind === "desk" ? "▤" : "♧", true),
        })
          .addTo(map)
          .bindPopup(popup);
      }
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [center.lat, center.lng, peers, pins]);
  return (
    <div
      className="leaflet-map"
      ref={ref}
      aria-label="Map of approximate nearby learner and study desk locations"
    />
  );
}
