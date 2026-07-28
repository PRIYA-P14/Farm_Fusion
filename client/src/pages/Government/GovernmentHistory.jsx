import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiTrash2, FiEye, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { GiCapitol } from 'react-icons/gi';
import { govAPI } from '../../services/api';
import GovernmentSearch from '../../components/Government/GovernmentSearch';
import toast from 'react-hot-toast';

export default function GovernmentHistory() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', state: '', farmer_type: '', page: 1, limit: 10 });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await govAPI.getReports(params);
      setReports(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!confirm('Delete this report?')) return;
    try {
      await govAPI.deleteReport(id);
      toast.success('Report deleted');
      fetchReports();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await govAPI.exportCSV();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'government_reports.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            <GiCapitol className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Scheme History</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{total} reports found</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary text-xs py-2 px-3">
            <FiDownload size={13} /> Export CSV
          </button>
          <Link to="/government/analyse" className="btn-primary text-xs py-2 px-3"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', boxShadow: '0 4px 12px rgba(167,139,250,0.30)' }}>
            + New Analysis
          </Link>
        </div>
      </motion.div>

      {/* Search */}
      <GovernmentSearch
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ q: '', state: '', farmer_type: '', page: 1, limit: 10 })}
      />

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-5xl mb-4">🏛️</p>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-secondary)' }}>No reports yet</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Run your first eligibility check</p>
          <Link to="/government/analyse" className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            Check Eligibility
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/government/report/${r.id}`}
                className="glass rounded-2xl p-4 flex items-center justify-between gap-4 block transition-all"
                style={{ border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.40)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}>
                    <GiCapitol style={{ color: '#a78bfa' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.farmer_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {r.state} · {r.crop} · {r.farmer_type} Farmer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold" style={{ color: '#a78bfa' }}>
                      {r.eligible_schemes?.length ?? 0} schemes
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ₹{((r.total_subsidy || 0) / 1000).toFixed(0)}K subsidy
                    </p>
                  </div>
                  <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1">
                    <span className="p-2 rounded-xl" style={{ background: 'rgba(167,139,250,0.10)', color: '#a78bfa' }}>
                      <FiEye size={14} />
                    </span>
                    <button onClick={(e) => handleDelete(r.id, e)}
                      className="p-2 rounded-xl transition-all"
                      style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--accent-red)' }}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
            className="btn-secondary py-2 px-3 text-xs disabled:opacity-40">
            <FiChevronLeft size={14} />
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Page {filters.page} of {totalPages}
          </span>
          <button disabled={filters.page >= totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
            className="btn-secondary py-2 px-3 text-xs disabled:opacity-40">
            <FiChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
