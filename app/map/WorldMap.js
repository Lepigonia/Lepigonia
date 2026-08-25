"use client";

import { useEffect, useRef } from "react";

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
      window.requestAnimationFrame(() => map && map.invalidateSize({ pan: false, animate: false }));
    };

    const load = () => {
      if (cancelled || !window.L || !ref.current || map) return;

      map = window.L.map(ref.current, {
        worldCopyJump: true,
        scrollWheelZoom: false,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 11,
        preferCanvas: false,
      });

      const tiles = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        crossOrigin: true,
        tileSize: 256,
        keepBuffer: 2,
      });
      tiles.addTo(map);

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

          const icon = window.L.divIcon({
            className: "lepigonia-map-marker-wrap",
            html: `<span class="lepigonia-map-marker"><span>${index + 1}</span></span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
          });

          const marker = window.L.marker([lat, lng], { icon }).addTo(map);
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
          route = window.L.polyline(routePoints, {
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

      // The map can mount while the responsive layout is still settling.
      // Recalculate its dimensions after paint and whenever its container changes.
      invalidate();
      window.setTimeout(invalidate, 100);
      window.setTimeout(invalidate, 400);

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

    const ensureLeaflet = () => {
      const existingLink = document.querySelector("link[data-leaflet]");
      const cssReady = existingLink
        ? (existingLink.sheet ? Promise.resolve() : new Promise((resolve) => {
            existingLink.addEventListener("load", resolve, { once: true });
            window.setTimeout(resolve, 1500);
          }))
        : new Promise((resolve) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            link.dataset.leaflet = "true";
            link.onload = resolve;
            link.onerror = resolve;
            document.head.appendChild(link);
          });

      if (window.L) {
        cssReady.then(load);
        return;
      }

      const existingScript = document.querySelector("script[data-leaflet]");
      if (existingScript) {
        existingScript.addEventListener("load", () => cssReady.then(load), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.dataset.leaflet = "true";
      script.async = true;
      script.onload = () => cssReady.then(load);
      document.body.appendChild(script);
    };

    ensureLeaflet();

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
