/**
 * Navbar.tsx – Top navigation bar with role links, live admin-online badge, and logout.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { adminOnline, connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span>📄</span>
        <span>DocTrack</span>
      </Link>

      <div className="navbar-right">
        {user ? (
          <>
            {user.role === 'customer' && (
              <span
                className="presence-pill"
                title={connected ? 'Live updates active' : 'Reconnecting...'}
              >
                <span className={`presence-dot ${adminOnline ? 'online' : ''}`} />
                {adminOnline ? 'Admin Online' : 'Admin Offline'}
              </span>
            )}

            {user.role === 'customer' ? (
              <>
                <Link to="/dashboard">My Applications</Link>
                <Link to="/applications/new">New Application</Link>
              </>
            ) : (
              <Link to="/admin">Admin Dashboard</Link>
            )}

            <span style={{ fontSize: '0.88rem', color: '#475569' }}>
              {user.name} ({user.role})
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
