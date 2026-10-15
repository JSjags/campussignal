"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapPin, User } from "@/lib/domain";
type Leaflet = typeof import("leaflet");
type Tone = "you" | "peer" | "desk";

/*
 * The Leaflet map is created once per approximate centre. Refetched peer and
 * pin data only redraws the marker layer when it actually changed, so the
 * map, tiles, pan and zoom are not torn down by background updates.
 */
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
  const leaflet = useRef<{ L: Leaflet; layer: import("leaflet").LayerGroup }>(
    null,
  );
  const [ready, setReady] = useState(0);
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
      // Colours come from theme tokens via CSS classes, so markers follow
      // light/dark without re-rendering the map.
      L.circle([center.lat, center.lng], {
        radius: 1600,
        className: "map-radius",
        weight: 2,
        dashArray: "6 8",
      }).addTo(map);
      addMarker(
        L,
        map,
        center.lat,
        center.lng,
        "YOU",
        "you",
        "You",
        "Your approximate area",
      );
      leaflet.current = { L, layer: L.layerGroup().addTo(map) };
      setReady((n) => n + 1);
    });
    return () => {
      disposed = true;
      leaflet.current = null;
      map?.remove();
    };
  }, [center.lat, center.lng]);
  // A content signature: identical refetches do not touch the markers.
  const signature = useMemo(
    () =>
      JSON.stringify([
        peers.map((p) => [p.id, p.name, p.lat, p.lng]),
        pins.map((p) => [p.id, p.kind, p.title, p.lat, p.lng]),
      ]),
    [peers, pins],
  );
  useEffect(() => {
    const current = leaflet.current;
    if (!current) return;
    const { L, layer } = current;
    layer.clearLayers();
    const [peerRows, pinRows] = JSON.parse(signature) as [
      [string, string, number, number][],
      [string, MapPin["kind"], string, number, number][],
    ];
    for (const [, name, lat, lng] of peerRows) {
      const initial = name.slice(0, 1).replace(/[^a-zA-Z]/g, "?");
      addMarker(
        L,
        layer,
        lat,
        lng,
        initial.toUpperCase(),
        "peer",
        name,
        "Approximate location",
      );
    }
    for (const [, kind, title, lat, lng] of pinRows) {
      addMarker(
        L,
        layer,
        lat + 0.0008,
        lng,
        kind === "desk" ? "DSK" : "BUD",
        "desk",
        title,
        kind === "desk"
          ? "Study desk · community shared"
          : "Buddy spot · community shared",
      );
    }
  }, [ready, signature]);
  return (
    <div
      className="leaflet-map"
      ref={ref}
      aria-label="Map of approximate nearby learner and study desk locations"
    />
  );
}

function addMarker(
  L: Leaflet,
  target: import("leaflet").Map | import("leaflet").LayerGroup,
  lat: number,
  lng: number,
  label: string,
  tone: Tone,
  title: string,
  detail: string,
) {
  const node = document.createElement("div");
  node.className = "map-popup";
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = detail;
  node.append(strong, small);
  L.marker([lat, lng], {
    icon: L.divIcon({
      className: "custom-pin",
      html: `<span class="pin pin-${tone}"><span>${label}</span></span>`,
      iconSize: [40, 48],
      iconAnchor: [20, 46],
      popupAnchor: [0, -42],
    }),
    title: `${title} · ${detail}`,
    alt: `${title} · ${detail}`,
    keyboard: true,
    riseOnHover: true,
  })
    .addTo(target)
    .bindPopup(node);
}
