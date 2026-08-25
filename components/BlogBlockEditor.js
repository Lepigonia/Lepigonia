"use client";

import { useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";
import { marked } from "marked";
import "./BlogBlockEditor.css";

function insertAtSelection(value, start, end, insert) { return `${value.slice(0, start)}${insert}${value.slice(end)}`; }
function imageBlock(url, align, caption) { const safeCaption=(caption||"").replace(/"/g,"&quot;"); return `\n\n<figure class="story-inline story-inline-${align}"><img src="${url}" alt="${safeCaption||"Reisefoto"}" loading="lazy" />${safeCaption?`<figcaption>${safeCaption}</figcaption>`:""}</figure>\n\n`; }

export default function BlogBlockEditor({ value, onChange, country }) {
  const [selection,setSelection]=useState({start:0,end:0}),[showImages,setShowImages]=useState(false),[showImageOptions,setShowImageOptions]=useState(null),[gallery,setGallery]=useState([]),[galleryLoading,setGalleryLoading]=useState(false),[tab,setTab]=useState("write"),[status,setStatus]=useState(""),[error,setError]=useState("");
  const preview=useMemo(()=>marked.parse(value||""),[value]);
  function rememberSelection(e){setSelection({start:e.target.selectionStart,end:e.target.selectionEnd});}
  function insertText(text){onChange(insertAtSelection(value||"",selection.start,selection.end,text));}
  function format(prefix,suffix="",placeholder="Text"){const selected=(value||"").slice(selection.start,selection.end)||placeholder;insertText(`${prefix}${selected}${suffix}`);}

  async function openImages(){
    setShowImages(true);setShowImageOptions(null);setError("");if(gallery.length)return;setGalleryLoading(true);
    try{const r=await fetch("/api/admin/gallery",{cache:"no-store"});const data=await r.json();const preferred=data.countries?.find(c=>c.name===country);const all=(data.countries||[]).flatMap(c=>(c.images||[]).map(image=>({...image,country:c.name})));setGallery(preferred?.images?.length?preferred.images.map(i=>({...i,country:preferred.name})):all);}catch{setError("Galerie konnte nicht geladen werden.")}finally{setGalleryLoading(false)}
  }

  async function uploadInline(e){
    const file=e.target.files?.[0];e.target.value="";if(!file)return;setError("");setStatus("Inline-Bild wird hochgeladen …");
    try{
      const blob=await upload(`blog-inline/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`,file,{access:"public",handleUploadUrl:"/api/admin/blob-upload",multipart:true,onUploadProgress(p){setStatus(`Inline-Bild ${Math.round(p.percentage)}%`)}});
      if(country){
        const gr=await fetch("/api/admin/gallery",{cache:"no-store"});const gd=await gr.json();const match=gd.countries?.find(c=>c.name===country);
        if(match){const rr=await fetch("/api/admin/gallery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"image-register",slug:match.slug,url:blob.url,filename:blob.pathname,storage:"blob",source:"blog"})});if(!rr.ok){const rd=await rr.json();throw new Error(rd.error||"Bild wurde hochgeladen, konnte aber nicht der Galerie zugeordnet werden.")}}
      }
      setStatus("");setShowImages(false);setShowImageOptions({url:blob.url,filename:file.name});
    }catch(err){setStatus("");setError(err?.message||"Inline-Bild konnte nicht hochgeladen werden.")}
  }
  function chooseImage(image){setShowImageOptions({url:image.url,filename:image.filename||image.title||"Galeriebild"});}
  function confirmImage(align,caption){if(!showImageOptions?.url)return;insertText(imageBlock(showImageOptions.url,align,caption));setShowImageOptions(null);setShowImages(false);}

  return <div className="block-editor">
    <div className="block-toolbar"><div className="block-tools"><button type="button" onClick={()=>format("**","","Fett")}>B</button><button type="button" onClick={()=>format("*","","Kursiv")}>I</button><button type="button" onClick={()=>format("## ","","Zwischenüberschrift")}>H2</button><button type="button" onClick={()=>format("> ","","Zitat")}>“</button><button type="button" onClick={openImages}>＋ Bild</button></div><div className="block-tabs"><button type="button" className={tab==="write"?"active":""} onClick={()=>setTab("write")}>Schreiben</button><button type="button" className={tab==="preview"?"active":""} onClick={()=>setTab("preview")}>Vorschau</button></div></div>
    {tab==="write"?<textarea className="content-editor block-textarea" value={value||""} onChange={e=>onChange(e.target.value)} onSelect={rememberSelection} onClick={rememberSelection} onKeyUp={rememberSelection} placeholder="Erzähle deine Geschichte …\n\nDu kannst Bilder direkt zwischen deine Absätze setzen."/>:<div className="block-preview prose" dangerouslySetInnerHTML={{__html:preview}}/>}
    <div className="block-help">Tipp: Markiere Text und wähle eine Formatierung. Mit <strong>＋ Bild</strong> kannst du ein Foto direkt in die Geschichte einsetzen.</div>{status&&<div className="block-status">{status}</div>}{error&&<div className="block-error">{error}</div>}
    {showImages&&<div className="block-modal" role="dialog" aria-modal="true"><div className="block-modal-card"><button type="button" className="block-modal-close" onClick={()=>setShowImages(false)}>×</button><p className="admin-eyebrow">Bild einfügen</p><h3>{country?`Fotos aus ${country}`:"Galerie"}</h3><label className="block-upload">＋ Neues Bild hochladen<input type="file" accept="image/*" onChange={uploadInline}/></label>{galleryLoading?<p>Galerie wird geladen …</p>:<div className="block-image-grid">{gallery.map(image=><button type="button" key={image.id||image.url} className="block-image-choice" onClick={()=>chooseImage(image)}><img src={image.url} alt={image.title||"Galeriebild"}/></button>)}</div>}{!galleryLoading&&!gallery.length&&<p className="block-muted">Noch keine Galeriebilder vorhanden.</p>}</div></div>}
    {showImageOptions&&<div className="block-modal" role="dialog" aria-modal="true"><div className="block-modal-card block-image-options"><button type="button" className="block-modal-close" onClick={()=>setShowImageOptions(null)}>×</button><p className="admin-eyebrow">Bildposition</p><h3>Wie soll das Bild erscheinen?</h3><img src={showImageOptions.url} alt="Vorschau" className="block-option-preview"/><label>Bildunterschrift<input id="inline-caption" placeholder="Optional"/></label><div className="block-align-grid"><button type="button" onClick={()=>confirmImage("full",document.getElementById("inline-caption")?.value)}>Groß / volle Breite</button><button type="button" onClick={()=>confirmImage("left",document.getElementById("inline-caption")?.value)}>Links / Text umfließt</button><button type="button" onClick={()=>confirmImage("right",document.getElementById("inline-caption")?.value)}>Rechts / Text umfließt</button></div></div></div>}
  </div>;
}
