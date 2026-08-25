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

    const load = () => {
      if (!window.L || !ref.current) return;

      map = window.L.map(ref.current, {
        worldCopyJump: true,
        scrollWheelZoom: false,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 11,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const valid = posts
        .map((post, index) => ({ ...post, _index: index }))
        .filter((post) => Number.isFinite(Number(post.lat)) && Number.isFinite(Number(post.lng)));

      if (!valid.length) {
        map.setView([20, 0], 2);
        return;
      }

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
    };

    const existingLink = document.querySelector("link[data-leaflet]");
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.leaflet = "true";
      document.head.appendChild(link);
    }

    if (window.L) {
      load();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = load;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (route) route.remove();
      if (map) map.remove();
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
