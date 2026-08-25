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

function ensureLeafletCss() {
  if (document.querySelector("style[data-leaflet-critical]")) return;
  const style = document.createElement("style");
  style.dataset.leafletCritical = "true";
  style.textContent = `
    .leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,.leaflet-map-pane svg,.leaflet-map-pane canvas{position:absolute;left:0;top:0}
    .leaflet-container{overflow:hidden;position:relative;outline:0}
    .leaflet-tile-pane{z-index:200}.leaflet-overlay-pane{z-index:400}.leaflet-shadow-pane{z-index:500}.leaflet-marker-pane{z-index:600}.leaflet-tooltip-pane{z-index:650}.leaflet-popup-pane{z-index:700}
    .leaflet-tile-container{white-space:nowrap}.leaflet-tile{max-width:none!important;width:256px;height:256px;user-select:none;-webkit-user-drag:none}
    .leaflet-container img{max-width:none!important}
    .leaflet-control{position:relative;z-index:800;float:left;clear:both}.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}.leaflet-top{top:0}.leaflet-bottom{bottom:0}.leaflet-left{left:0}.leaflet-right{right:0}.leaflet-control{pointer-events:auto}
    .leaflet-control-zoom a{display:block;width:30px;height:30px;line-height:30px;text-align:center;text-decoration:none;font: bold 18px/30px Arial,sans-serif;color:#222;background:#fff;border-bottom:1px solid #ddd}.leaflet-control-zoom a:first-child{border-radius:4px 4px 0 0}.leaflet-control-zoom a:last-child{border-radius:0 0 4px 4px;border-bottom:0}.leaflet-control-zoom{box-shadow:0 1px 5px rgba(0,0,0,.35);margin:10px}
    .leaflet-popup{position:absolute;text-align:center}.leaflet-popup-content-wrapper{padding:1px;text-align:left}.leaflet-popup-content{margin:13px 19px;line-height:1.4}.leaflet-popup-tip{width:17px;height:17px;padding:1px;transform:rotate(45deg);margin:-10px auto 0}.leaflet-popup-close-button{position:absolute;right:0;top:0;padding:4px 4px 0 0;border:0;background:transparent}
    .leaflet-zoom-animated{transform-origin:0 0}.leaflet-zoom-hide{visibility:hidden}
  `;
  document.head.appendChild(style);
}

export default function WorldMap({ posts = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    let map;
    let route;
    let resizeObserver;
    let resizeTimer;
    let cancelled = false;
    let cssLink;

    const invalidate = () => {
      if (!map) return;
      window.requestAnimationFrame(() => map && map.invalidateSize({ pan: false, animate: false }));
    };

    const load = () => {
      if (cancelled || !window.L || !ref.current || map) return;

      ensureLeafletCss();
      map = window.L.map(ref.current, {
        worldCopyJump: true,
        scrollWheelZoom: false,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 19,
        preferCanvas: false,
      });

      const tiles = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        tileSize: 256,
        keepBuffer: 3,
        updateWhenIdle: false,
        updateWhenZooming: false,
      });

      tiles.on("tileerror", (event) => {
        if (ref.current) ref.current.dataset.tileError = "true";
        console.warn("OpenStreetMap tile failed to load", event?.tile?.src || "");
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

      invalidate();
      window.setTimeout(invalidate, 100);
      window.setTimeout(invalidate, 500);
      window.setTimeout(() => map?.invalidateSize({ pan: false }), 1200);

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
      ensureLeafletCss();
      const existingLink = document.querySelector("link[data-leaflet]");
      const cssReady = existingLink
        ? (existingLink.sheet ? Promise.resolve() : new Promise((resolve) => {
            existingLink.addEventListener("load", resolve, { once: true });
            window.setTimeout(resolve, 1500);
          }))
        : new Promise((resolve) => {
            cssLink = document.createElement("link");
            cssLink.rel = "stylesheet";
            cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            cssLink.dataset.leaflet = "true";
            cssLink.onload = resolve;
            cssLink.onerror = resolve;
            document.head.appendChild(cssLink);
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
      script.onerror = () => console.error("Leaflet failed to load");
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
