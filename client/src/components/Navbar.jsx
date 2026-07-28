import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GiPlantRoots, GiCapitol } from 'react-icons/gi';
import { FiHome, FiSun, FiMoon, FiLogOut, FiUser } from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { to: '/',           label: 'Home',                    icon: <FiHome size={15} />,        exact: true,  accent: 'var(--accent-green)' },
  { to: '/analyse',    label: 'Soil Agent',              icon: <GiPlantRoots size={15} />,  exact: false, accent: 'var(--accent-green)', match: ['/analyse', '/history', '/report', '/soil'] },
  { to: '/government', label: 'Government Scheme Agent', icon: <GiCapitol size={15} />,     exact: false, accent: '#a78bfa',             match: ['/government'] },
];

function isActive(link, pathname) {
  if (link.exact) return pathname === link.to;
  if (link.match) return link.match.some(m => pathname === m || pathname.startsWith(m + '/'));
  return pathname.startsWith(link.to);
}

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, user, logout } = useApp();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}
      className="sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-emerald))', boxShadow: '0 4px 16px var(--glow-strong)' }}>
          <GiPlantRoots className="text-black text-lg" />
        </div>
        <div className="hidden sm:block">
          <p className="font-bold text-sm gradient-text leading-none">AgriVerse</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Multi-Agent Platform</p>
        </div>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map(link => {
          const active = isActive(link, pathname);
          return (
            <Link key={link.to} to={link.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${active ? 'nav-active' : ''}`}
              style={{ color: active ? link.accent : 'var(--text-muted)' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = link.accent; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}>
              {link.icon}
              <span className="hidden sm:block">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* User info */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--glow-green)', border: '1px solid var(--border)' }}>
            <div className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center">
              <FiUser size={11} style={{ color: 'var(--accent-green)' }} />
            </div>
            <span className="text-xs font-medium max-w-24 truncate" style={{ color: 'var(--accent-green)' }}>
              {user.fullName.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Theme toggle */}
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl transition-all"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-amber)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        {/* Logout */}
        {user && (
          <button onClick={handleLogout}
            className="p-2 rounded-xl transition-all"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            title="Logout"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <FiLogOut size={16} />
          </button>
        )}
      </div>
    </motion.nav>
  );
}
