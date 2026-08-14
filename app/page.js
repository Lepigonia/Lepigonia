export default function Home(){
  return (
    <main style={{maxWidth:1360, margin:'0 auto', padding:'48px 24px', fontFamily:'system-ui'}}>
      <h1 style={{fontSize:48, letterSpacing:'-0.03em'}}>LEPIGONIA</h1>
      <p style={{color:'#8A8A8A'}}>Site restored — root route now exists.</p>
      <div style={{marginTop:24, display:'flex', gap:12}}>
        <a href="/ai">AI Trip Planner</a>
        <a href="/map">Travel Map</a>
        <a href="/gallery">Gallery</a>
        <a href="/blog">Blog</a>
      </div>
    </main>
  )
}
