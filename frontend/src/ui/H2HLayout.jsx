import { Outlet, Link } from "react-router-dom";
import { H2HButton } from "./index";

export default function H2HLayout({ me, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <nav className="nav-glass sticky top-0 z-40 border-b border-white/10">
        <div className="section flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold title-glow tracking-wide">
            H2H Thailand
          </Link>

          <Link to="/items" className="btn-ghost">Items</Link>
          {me?.role === "admin" && (
            <>
              <Link to="/users" className="btn-ghost">Users</Link>
              <Link to="/payments" className="btn-ghost">Payments</Link>
              <Link to="/tokens" className="btn-ghost">Tokens</Link>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {me ? (
              <>
                <span className="badge">{me.email}</span>
                <Link to="/profile" className="btn-ghost">Profile</Link>
                <H2HButton variant="gold" onClick={onLogout}>Logout</H2HButton>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">Login</Link>
                <Link to="/register" className="btn btn-gold">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 section">
        <Outlet />
      </main>
    </div>
  );
}
