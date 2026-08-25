"use client";
import {useEffect,useRef} from "react";

export default function WorldMap({posts}){
  const ref=useRef(null);
  useEffect(()=>{
    let map;
    const escapeHtml=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
    const load=()=>{
      if(!window.L||!ref.current)return;
      map=new window.L.Map(ref.current,{worldCopyJump:true,scrollWheelZoom:true,zoomControl:true});
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);
      const valid=posts.filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng)));
      if(valid.length){
        const bounds=[];
        valid.forEach(p=>{
          const lat=Number(p.lat),lng=Number(p.lng);bounds.push([lat,lng]);
          const marker=window.L.marker([lat,lng]).addTo(map);
          marker.bindPopup(`<div style="min-width:180px"><strong>${escapeHtml(p.title||p.location||"Reisestopp")}</strong><br/><span>${escapeHtml(p.location||"")}</span><br/><a href="/blog/${encodeURIComponent(p.slug)}">Story öffnen →</a></div>`);
        });
        map.fitBounds(bounds,{padding:[40,40],maxZoom:5});
      }else map.setView([20,0],2);
    };
    if(!document.querySelector('link[data-leaflet]')){const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";link.dataset.leaflet="true";document.head.appendChild(link)}
    if(window.L)load();else{const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.onload=load;document.body.appendChild(script)}
    return()=>{if(map)map.remove()};
  },[posts]);
  return <div className="world-map-shell"><div ref={ref} className="world-map"/><p className="map-credit">Kartendaten © OpenStreetMap contributors</p></div>;
}
