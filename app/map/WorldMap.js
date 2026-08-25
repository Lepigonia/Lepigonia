"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const COUNTRY_FLAGS = {
  germany: "🇩🇪", deutschland: "🇩🇪", france: "🇫🇷", frankreich: "🇫🇷", portugal: "🇵🇹", spain: "🇪🇸", spanien: "🇪🇸",
  italy: "🇮🇹", italien: "🇮🇹", austria: "🇦🇹", österreich: "🇦🇹", switzerland: "🇨🇭", schweiz: "🇨🇭",
  netherlands: "🇳🇱", niederlande: "🇳🇱", belgium: "🇧🇪", belgien: "🇧🇪", denmark: "🇩🇰", dänemark: "🇩🇰",
  norway: "🇳🇴", norwegen: "🇳🇴", sweden: "🇸🇪", schweden: "🇸🇪", finland: "🇫🇮", finnland: "🇫🇮",
  poland: "🇵🇱", polen: "🇵🇱", czechia: "🇨🇿", "czech republic": "🇨🇿", tschechien: "🇨🇿", croatia: "🇭🇷", kroatien: "🇭🇷",
  slovenia: "🇸🇮", slowenien: "🇸🇮", greece: "🇬🇷", griechenland: "🇬🇷", turkey: "🇹🇷", türkei: "🇹🇷",
  uk: "🇬🇧", "united kingdom": "🇬🇧", england: "🇬🇧", ireland: "🇮🇪", portugal: "🇵🇹", morocco: "🇲🇦", marokko: "🇲🇦",
  usa: "🇺🇸", "united states": "🇺🇸", canada: "🇨🇦", mexico: "🇲🇽", japan: "🇯🇵", australia: "🇦🇺",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function flagFor(post) {
  const value = String(post.country || post.land || "").trim().toLowerCase();
  return COUNTRY_FLAGS[value] || "🌍";
}

function sortPosts(posts) {
  return posts
    .map((post, index) => ({ ...post, _sourceIndex: index }))
    .filter((post) => Number.isFinite(Number(post.lat)) && Number.isFinite(Number(post.lng)))
    .sort((a, b) => {
      const da = Date.parse(a.date || a.publishedAt || a.createdAt || "");
      const db = Date.parse(b.date || b.publishedAt || b.createdAt || "");
      if (Number.isFinite(da) && Number.isFinite(db) && da !== db) return da - db;
      if (Number.isFinite(da) && !Number.isFinite(db)) return -1;
      if (!Number.isFinite(da) && Number.isFinite(db)) return 1;
      return a._sourceIndex - b._sourceIndex;
    });
}

export default function WorldMap({ posts = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    let map, route, resizeObserver, resizeTimer;
    let cancelled = false;

    const invalidate = () => {
      if (!map) return;
      window.requestAnimationFrame(() => map?.invalidateSize({ pan: false, animate: false }));
    };

    const init = async () => {
      if (cancelled || !ref.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, { worldCopyJump: true, scrollWheelZoom: false, zoomControl: true, minZoom: 2, maxZoom: 19 });
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19, keepBuffer: 3 }).addTo(map);
      let fallbackAdded = false;
      let tileErrors = 0;
      osm.on("tileerror", () => {
        tileErrors += 1;
        if (!fallbackAdded && tileErrors >= 2) {
          fallbackAdded = true;
          L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "&copy; OpenStreetMap contributors &copy; CARTO", maxZoom: 19, keepBuffer: 3 }).addTo(map);
        }
      });

      const valid = sortPosts(posts);
      if (!valid.length) map.setView([20, 0], 2);
      else {
        const bounds = [], routePoints = [];
        valid.forEach((post, index) => {
          const lat = Number(post.lat), lng = Number(post.lng);
          bounds.push([lat, lng]); routePoints.push([lat, lng]);
          const flag = flagFor(post);
          const icon = L.divIcon({
            className: "lepigonia-map-marker-wrap",
            html: `<span class="lepigonia-map-marker"><span class="lepigonia-map-flag">${flag}</span><b>${index + 1}</b></span>`,
            iconSize: [58, 40], iconAnchor: [29, 20], popupAnchor: [0, -18],
          });
          const marker = L.marker([lat, lng], { icon }).addTo(map);
          marker.bindTooltip(`<strong>${index + 1} · ${escapeHtml(post.location || post.country || "Reisestopp")}</strong><br>${escapeHtml(post.title || "Reisestopp")}`, { direction: "top", offset: [0, -18], opacity: 0.98 });
          marker.bindPopup(`<article class="map-popup"><span class="map-popup-kicker">${flag} ${escapeHtml(post.location || post.country || "Reisestopp")}</span><strong>${escapeHtml(post.title || "Reisestopp")}</strong>${post.date ? `<small>${escapeHtml(post.date)}</small>` : ""}<a href="/blog/${encodeURIComponent(post.slug)}">Story öffnen <span>→</span></a></article>`);
        });
        if (routePoints.length > 1) route = L.polyline(routePoints, { color: "#171715", weight: 1.5, opacity: 0.42, dashArray: "5 8", interactive: false }).addTo(map);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 5 });
      }

      invalidate();
      [100, 500, 1200].forEach((ms) => window.setTimeout(invalidate, ms));
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(invalidate, 80); });
        resizeObserver.observe(ref.current);
      } else window.addEventListener("resize", invalidate);
    };

    init().catch((error) => { console.error("Lepigonia world map failed to initialize", error); if (ref.current) ref.current.dataset.mapError = "true"; });
    return () => { cancelled = true; window.clearTimeout(resizeTimer); resizeObserver?.disconnect(); window.removeEventListener("resize", invalidate); route?.remove(); map?.remove(); map = null; };
  }, [posts]);

  return <div className="world-map-shell"><div ref={ref} className="world-map" aria-label="Interaktive Weltkarte der Reisestopps" /><div className="map-legend"><span className="map-legend-dot" /> Reisestopps <span className="map-legend-line" /> Reiseroute</div><p className="map-credit">Kartendaten &copy; OpenStreetMap contributors</p></div>;
}
