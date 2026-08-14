import "./globals.css";
export const metadata = { title: "LEPIGONIA", description: "Documenting journeys" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500&display=swap" rel="stylesheet"/></head>
      <body>
        <header><div className="nav">
          <a href="/" className="logo serif">LEPIGONIA</a>
          <nav className="tabs">
            <a href="/">Home</a>
            <a href="/ai">AI Trip Planner</a>
            <a href="/map">Travel Map</a>
            <a href="/gallery">Gallery</a>
            <a href="/blog">Blog</a>
          </nav>
        </div></header>
        <div className="container">{children}</div>
        <footer style={{borderTop:'1px solid rgba(0,0,0,.08)',marginTop:80,padding:'24px',textAlign:'center',color:'#8A8A8A',fontSize:12}}>© LEPIGONIA — Collect moments, not things.</footer>
      </body>
    </html>
  );
}
