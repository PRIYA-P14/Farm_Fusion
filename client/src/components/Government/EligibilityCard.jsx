import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiStar, FiTrendingUp } from 'react-icons/fi';

export default function EligibilityCard({ aiDetails, totalSubsidy, totalLoan, hasInsurance, schemeCount }) {
  if (!aiDetails) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
      style={{ border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.04)' }}>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-emerald))' }}>
          <FiStar className="text-black" size={16} />
        </div>
        <h3 className="font-bold" style={{ color: 'var(--accent-green)' }}>AI Eligibility Analysis</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Eligible Schemes', value: schemeCount,                                                    color: 'var(--accent-green)' },
          { label: 'Total Subsidy',    value: `₹${(totalSubsidy / 1000).toFixed(0)}K`,                        color: 'var(--accent-emerald)' },
          { label: 'Loan Available',   value: totalLoan > 0 ? `₹${(totalLoan / 100000).toFixed(1)}L` : 'N/A', color: '#a78bfa' },
          { label: 'Insurance',        value: hasInsurance ? '✅ Yes' : '❌ No',                               color: 'var(--accent-blue)' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      {aiDetails.summary && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <div className="flex gap-2">
            <FiInfo size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-green)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{aiDetails.summary}</p>
          </div>
        </div>
      )}

      {/* Income Insight */}
      {aiDetails.income_insight && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.20)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent-blue)' }}>💰 Income Analysis</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{aiDetails.income_insight}</p>
        </div>
      )}

      {/* CIBIL Insight */}
      {aiDetails.cibil_insight && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.20)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#a78bfa' }}>📊 CIBIL Score Analysis</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{aiDetails.cibil_insight}</p>
        </div>
      )}

      {/* Top Priority */}
      {aiDetails.top_priority && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.20)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent-amber)' }}>⭐ Top Priority Scheme</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{aiDetails.top_priority}</p>
        </div>
      )}

      {/* Warning */}
      {aiDetails.warning && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)' }}>
          <div className="flex gap-2">
            <FiAlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-red)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{aiDetails.warning}</p>
          </div>
        </div>
      )}

      {/* Motivational */}
      {aiDetails.motivational_message && (
        <div className="flex gap-2 items-start">
          <FiCheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-green)' }} />
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{aiDetails.motivational_message}</p>
        </div>
      )}
    </motion.div>
  );
}
