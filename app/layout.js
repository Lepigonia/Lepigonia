import "./globals.css";

export const metadata = {
  title: "Lepigonia",
  description: "Blog & Projects",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <header>
          <div className="nav">
            <a href="/" className="logo">LEPIGO<span>NIA</span></a>
            <nav className="tabs">
              <a href="/" className="active">Blog</a>
              <a href="/about">About</a>
              <a href="https://github.com/Lepigonia/Lepigonia">GitHub</a>
            </nav>
          </div>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
