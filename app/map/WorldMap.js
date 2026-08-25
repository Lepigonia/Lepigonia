"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[char] || char));
}

export default function WorldMap({ posts = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    let map;
    let route;
    let resizeObserver;
    let resizeTimer;
    let cancelled = false;

    const invalidate = () => {
      if (!map) return;
      window.requestAnimationFrame(() => {
        if (map) map.invalidateSize({ pan: false, animate: false });
      });
    };

    const init = async () => {
      if (cancelled || !ref.current) return;

      // Load Leaflet from the installed package instead of a runtime CDN script.
      // This prevents the map from rendering with controls but without its tile layer.
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      // Leaflet's default marker assets are not used; Lepigonia has custom markers.
      map = L.map(ref.current, {
        worldCopyJump: true,
        scrollWheelZoom: false,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 19,
        preferCanvas: false,
        attributionControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        tileSize: 256,
        keepBuffer: 3,
        updateWhenIdle: false,
        updateWhenZooming: false,
      }).addTo(map);

      const valid = posts
        .map((post, index) => ({ ...post, _index: index }))
        .filter((post) => Number.isFinite(Number(post.lat)) && Number.isFinite(Number(post.lng)));

      if (!valid.length) {
        map.setView([20, 0], 2);
      } else {
        const bounds = [];
        const routePoints = [];

        valid.forEach((post, index) => {
          const lat = Number(post.lat);
          const lng = Number(post.lng);
          bounds.push([lat, lng]);
          routePoints.push([lat, lng]);

          const icon = L.divIcon({
            className: "lepigonia-map-marker-wrap",
            html: `<span class="lepigonia-map-marker"><span>${index + 1}</span></span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
          });

          const marker = L.marker([lat, lng], { icon }).addTo(map);
          marker.bindPopup(`
            <article class="map-popup">
              <span class="map-popup-kicker">${escapeHtml(post.location || "Reisestopp")}</span>
              <strong>${escapeHtml(post.title || "Reisestopp")}</strong>
              ${post.date ? `<small>${escapeHtml(post.date)}</small>` : ""}
              <a href="/blog/${encodeURIComponent(post.slug)}">Story öffnen <span>→</span></a>
            </article>
          `);
        });

        if (routePoints.length > 1) {
          route = L.polyline(routePoints, {
            color: "#171715",
            weight: 1.5,
            opacity: 0.42,
            dashArray: "5 8",
            interactive: false,
          }).addTo(map);
          route.bringToBack();
        }

        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 5 });
      }

      invalidate();
      window.setTimeout(invalidate, 100);
      window.setTimeout(invalidate, 500);
      window.setTimeout(invalidate, 1200);

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(invalidate, 80);
        });
        resizeObserver.observe(ref.current);
      } else {
        window.addEventListener("resize", invalidate);
      }
    };

    init().catch((error) => {
      console.error("Lepigonia world map failed to initialize", error);
      if (ref.current) ref.current.dataset.mapError = "true";
    });

    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", invalidate);
      if (route) route.remove();
      if (map) map.remove();
      map = null;
    };
  }, [posts]);

  return (
    <div className="world-map-shell">
      <div ref={ref} className="world-map" aria-label="Interaktive Weltkarte der Reisestopps" />
      <div className="map-legend"><span className="map-legend-dot" /> Reisestopps <span className="map-legend-line" /> Reiseroute</div>
      <p className="map-credit">Kartendaten &copy; OpenStreetMap contributors</p>
    </div>
  );
}
