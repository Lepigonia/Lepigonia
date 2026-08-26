import Link from "next/link";

export default function AdminHeader({ onLogout }) {
  return (
    <header className="admin-top">
      <div>
        <Link href="/" className="admin-brand">Lepigonia</Link>
        <span className="admin-top-label"> / Admin</span>
      </div>
      <nav className="admin-top-nav">
        <button onClick={onLogout}>Logout</button>
      </nav>
    </header>
  );
}
