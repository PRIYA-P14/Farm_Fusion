import { motion } from 'framer-motion';
import { scoreColor } from '../utils/helpers';

export function CircularGauge({ score, size = 140 }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const grade = score >= 75 ? 'Excellent' : score >= 55 ? 'Good' : score >= 35 ? 'Average' : 'Poor';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-card2)" strokeWidth="9" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color.hex} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="44" textAnchor="middle" fill={color.hex} fontSize="20" fontWeight="bold">{score}</text>
        <text x="50" y="57" textAnchor="middle" fill="var(--text-muted)" fontSize="8">out of 100</text>
        <text x="50" y="68" textAnchor="middle" fill={color.hex} fontSize="8" fontWeight="600">{grade}</text>
      </svg>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'green', label }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorMap = {
    green: '#4ade80', blue: '#60a5fa', yellow: '#facc15',
    orange: '#fb923c', red: '#f87171', purple: '#c084fc',
  };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ color: colorMap[color] }} className="font-semibold">{Math.round(value)}</span>
        </div>
      )}
      <div className="w-full rounded-full h-2" style={{ background: 'var(--bg-card2)' }}>
        <motion.div
          className="h-2 rounded-full"
          style={{ background: colorMap[color] }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, unit, color = 'green' }) {
  const colorMap = {
    green:  { text: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.20)' },
    blue:   { text: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.20)' },
    yellow: { text: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.20)' },
    orange: { text: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.20)' },
    red:    { text: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.20)' },
    purple: { text: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.20)' },
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}
      className="rounded-2xl p-4 cursor-default"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: c.border, color: c.text }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: c.text }}>
        {value}<span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </p>
    </motion.div>
  );
}

export function Badge({ label, type = 'info' }) {
  const map = {
    success: { bg: 'rgba(74,222,128,0.12)',  color: 'var(--accent-green)',   border: 'rgba(74,222,128,0.25)' },
    warning: { bg: 'rgba(251,191,36,0.12)',  color: 'var(--accent-amber)',   border: 'rgba(251,191,36,0.25)' },
    error:   { bg: 'rgba(248,113,113,0.12)', color: 'var(--accent-red)',     border: 'rgba(248,113,113,0.25)' },
    info:    { bg: 'rgba(96,165,250,0.12)',  color: 'var(--accent-blue)',    border: 'rgba(96,165,250,0.25)' },
    purple:  { bg: 'rgba(192,132,252,0.12)', color: '#c084fc',               border: 'rgba(192,132,252,0.25)' },
  };
  const s = map[type] || map.info;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  );
}

export function SectionCard({ title, icon, children, className = '', accent }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 ${className}`}
      style={{ background: 'var(--bg-card)', border: `1px solid ${accent || 'var(--border)'}`, boxShadow: 'var(--shadow-card)' }}>
      {title && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
        </div>
      )}
      {children}
    </motion.div>
  );
}
