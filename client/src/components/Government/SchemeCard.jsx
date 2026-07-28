import { motion } from 'framer-motion';
import { FiExternalLink, FiFileText, FiDollarSign, FiShield } from 'react-icons/fi';

const categoryColors = {
  'Income Support':      { bg: 'rgba(74,222,128,0.10)',  color: 'var(--accent-green)',   border: 'rgba(74,222,128,0.25)' },
  'Crop Insurance':      { bg: 'rgba(96,165,250,0.10)',  color: 'var(--accent-blue)',    border: 'rgba(96,165,250,0.25)' },
  'Irrigation':          { bg: 'rgba(52,211,153,0.10)',  color: 'var(--accent-emerald)', border: 'rgba(52,211,153,0.25)' },
  'Solar & Energy':      { bg: 'rgba(251,191,36,0.10)',  color: 'var(--accent-amber)',   border: 'rgba(251,191,36,0.25)' },
  'Organic Farming':     { bg: 'rgba(163,230,53,0.10)',  color: 'var(--accent-lime)',    border: 'rgba(163,230,53,0.25)' },
  'Agriculture Loan':    { bg: 'rgba(167,139,250,0.10)', color: '#a78bfa',               border: 'rgba(167,139,250,0.25)' },
  'Seed & Input Subsidy':{ bg: 'rgba(251,191,36,0.10)',  color: 'var(--accent-amber)',   border: 'rgba(251,191,36,0.25)' },
  'Farmer Welfare':      { bg: 'rgba(248,113,113,0.10)', color: 'var(--accent-red)',     border: 'rgba(248,113,113,0.25)' },
  'Sustainable Farming': { bg: 'rgba(74,222,128,0.10)',  color: 'var(--accent-green)',   border: 'rgba(74,222,128,0.25)' },
  'Soil & Fertilizer':   { bg: 'rgba(163,230,53,0.10)',  color: 'var(--accent-lime)',    border: 'rgba(163,230,53,0.25)' },
  'Training & Development':{ bg: 'rgba(96,165,250,0.10)', color: 'var(--accent-blue)',  border: 'rgba(96,165,250,0.25)' },
};

export default function SchemeCard({ scheme, index = 0 }) {
  const col = categoryColors[scheme.category] || categoryColors['Income Support'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-5 card-hover"
      style={{ border: `1px solid ${col.border}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="badge" style={{ background: col.bg, color: col.color, borderColor: col.border }}>
              {scheme.category}
            </span>
            <span className="badge" style={{
              background: scheme.type === 'Central' ? 'rgba(96,165,250,0.10)' : 'rgba(167,139,250,0.10)',
              color: scheme.type === 'Central' ? 'var(--accent-blue)' : '#a78bfa',
              borderColor: scheme.type === 'Central' ? 'rgba(96,165,250,0.25)' : 'rgba(167,139,250,0.25)',
            }}>
              {scheme.type}
            </span>
            {scheme.priority === 1 && (
              <span className="badge badge-warning">⭐ Priority</span>
            )}
          </div>
          <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
            {scheme.name}
          </h3>
        </div>
      </div>

      <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {scheme.description}
      </p>

      {/* Benefits */}
      <div className="rounded-xl p-3 mb-3" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
        <p className="text-xs font-semibold mb-1" style={{ color: col.color }}>Benefits</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{scheme.benefits}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {scheme.subsidy_amount > 0 && (
          <div className="stat-card text-center">
            <FiDollarSign className="mx-auto mb-1" style={{ color: 'var(--accent-green)' }} size={14} />
            <p className="text-xs font-bold" style={{ color: 'var(--accent-green)' }}>
              ₹{(scheme.subsidy_amount / 1000).toFixed(0)}K
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Subsidy</p>
          </div>
        )}
        {scheme.loan_amount > 0 && (
          <div className="stat-card text-center">
            <FiFileText className="mx-auto mb-1" style={{ color: '#a78bfa' }} size={14} />
            <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>
              ₹{(scheme.loan_amount / 100000).toFixed(1)}L
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loan</p>
          </div>
        )}
        {scheme.insurance && (
          <div className="stat-card text-center">
            <FiShield className="mx-auto mb-1" style={{ color: 'var(--accent-blue)' }} size={14} />
            <p className="text-xs font-bold" style={{ color: 'var(--accent-blue)' }}>Yes</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Insurance</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="mb-3">
        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Required Documents</p>
        <div className="flex flex-wrap gap-1">
          {scheme.required_documents.map((doc, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-lg"
              style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {doc}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {scheme.application_process.slice(0, 60)}…
        </p>
        <a href={scheme.official_website} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold ml-2 flex-shrink-0"
          style={{ color: col.color }}
          onClick={e => e.stopPropagation()}>
          Apply <FiExternalLink size={11} />
        </a>
      </div>
    </motion.div>
  );
}
