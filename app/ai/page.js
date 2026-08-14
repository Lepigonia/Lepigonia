"use client";
import { useState } from "react";
export default function AIPage(){
  const [form,setForm]=useState({destination:"",duration:10,budget:2500});
  const [trip,setTrip]=useState(null);
  // TODO: Replace with real API - /api/generate-trip
  const generate=()=>{
    setTrip({
      title:`${form.destination||'Your Trip'} — ${form.duration} days`,
      overview:`Generated demo plan for ${form.duration} days, €${form.budget} budget. Replace generate() with OpenAI call later.`,
      days: Array.from({length:form.duration},(_,i)=>({day:i+1,title:`Day ${i+1}`,desc:"Add real itinerary here via API"}))
    });
  }
  return(<div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:24}} className="ai-grid">
    <div className="card" style={{height:'fit-content',position:'sticky',top:100}}>
      <h3 className="serif">AI Trip Planner</h3>
      <input placeholder="Destination / Region" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} style={{width:'100%',marginTop:16,height:40,borderRadius:12,border:'1px solid #eee',padding:'0 12px'}}/>
      <label style={{display:'block',marginTop:16,fontSize:12}}>Duration: {form.duration} days</label>
      <input type="range" min="3" max="21" value={form.duration} onChange={e=>setForm({...form,duration:parseInt(e.target.value)})} style={{width:'100%'}}/>
      <label style={{display:'block',marginTop:16,fontSize:12}}>Budget: €{form.budget}</label>
      <input type="range" min="500" max="10000" step="100" value={form.budget} onChange={e=>setForm({...form,budget:parseInt(e.target.value)})} style={{width:'100%'}}/>
      <button onClick={generate} className="btn" style={{width:'100%',marginTop:24}}>Generate Trip →</button>
      <p style={{fontSize:11,color:'#8A8A8A',marginTop:12}}>Code ready for API integration. See TODO in file.</p>
    </div>
    <div>{!trip? <div className="empty">Enter destination and generate. No invented content - you add real logic later.</div> :
      <div className="card"><h2 className="serif">{trip.title}</h2><p style={{color:'#666',marginTop:8}}>{trip.overview}</p>
      <div style={{marginTop:24}}>{trip.days.map(d=><div key={d.day} style={{padding:'16px 0',borderBottom:'1px solid #eee'}}><strong>Day {d.day}:</strong> {d.title}<div style={{color:'#8A8A8A',fontSize:14}}>{d.desc}</div></div>)}</div>
      </div>}</div>
  </div>)
}
