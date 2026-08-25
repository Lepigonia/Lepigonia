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
      window.requestAnimationFrame(() => map?.invalidateSize({ pan: false, animate: false }));
    };

    const init = async () => {
      if (cancelled || !ref.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, {
        worldCopyJump: true,
        scrollWheelZoom: false,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 19,
        preferCanvas: false,
        attributionControl: true,
      });

      // Primary source: OpenStreetMap. If the browser/network cannot reach
      // the OSM tile host, immediately fall back to CARTO's public OSM-based tiles.
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        tileSize: 256,
        keepBuffer: 3,
        updateWhenIdle: false,
        updateWhenZooming: false,
      }).addTo(map);

      let fallbackAdded = false;
      let tileErrors = 0;
      const addFallback = () => {
        if (fallbackAdded || cancelled) return;
        fallbackAdded = true;
        const fallback = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
            maxZoom: 19,
            tileSize: 256,
            keepBuffer: 3,
          },
        ).addTo(map);
        fallback.once("load", () => {
          if (ref.current) delete ref.current.dataset.mapError;
          invalidate();
        });
      };

      osm.on("tileerror", () => {
        tileErrors += 1;
        if (tileErrors >= 2) addFallback();
      });
      osm.once("load", () => {
        if (ref.current) delete ref.current.dataset.mapError;
        invalidate();
      });

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
