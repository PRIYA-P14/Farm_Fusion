import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiTrash2, FiEye, FiCalendar, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { soilAPI } from '../services/api';
import { scoreColor } from '../utils/helpers';
import { Badge } from '../components/UI';

const SEASONS = ['', 'Kharif', 'Rabi', 'Summer', 'Annual'];

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await soilAPI.getReports({ search, season, page, limit: 8 });
      setReports(res.data.data || []);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, [search, season, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await soilAPI.deleteReport(id);
      toast.success('Report deleted');
      fetchReports();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Analysis History</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} reports found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center flex-1 min-w-48 input-field py-0 px-0 overflow-hidden" style={{ padding: 0 }}>
          <span className="flex items-center justify-center pl-3 pr-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <FiSearch size={15} />
          </span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by soil type, crop..."
            className="flex-1 bg-transparent outline-none text-sm py-2.5 pr-3"
            style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex items-center input-field py-0 px-0 overflow-hidden" style={{ padding: 0, minWidth: 160 }}>
          <span className="flex items-center justify-center pl-3 pr-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <FiCalendar size={15} />
          </span>
          <select value={season} onChange={e => { setSeason(e.target.value); setPage(1); }}
            className="flex-1 bg-transparent outline-none text-sm py-2.5 pr-3"
            style={{ color: 'var(--text-primary)' }}>
            {SEASONS.map(s => <option key={s} value={s}>{s || 'All Seasons'}</option>)}
          </select>
        </div>
      </div>

      {/* Report Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <span className="text-5xl">🌱</span>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>No reports found</p>
          <Link to="/analyse" className="btn-primary inline-flex mt-4">Start First Analysis</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => {
            const sc    = r.healthScore || r.analysis?.healthScore?.overall || 0;
            const col   = scoreColor(sc);
            const grade = r.healthGrade  || r.analysis?.healthScore?.grade || (sc >= 75 ? 'Excellent' : sc >= 55 ? 'Good' : sc >= 35 ? 'Average' : 'Poor');
            const soilType   = r.soilType   || 'Unknown';
            const soilColour = r.soilColour || '';
            const imageUrl   = r.soilImageUrl || '';

            return (
              <motion.div key={r._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 card-hover">

                <div className="flex items-center gap-4">
                  {/* Soil Image Thumbnail */}
                  {imageUrl ? (
                    <img src={imageUrl} alt="soil"
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      style={{ border: '2px solid var(--border-strong)' }} />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                      <FiImage size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}

                  {/* Health Score Circle */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
                    style={{ background: 'var(--bg-card2)', border: `1px solid ${col.hex}40` }}>
                    <span className="font-bold text-sm" style={{ color: col.hex }}>{sc}</span>
                  </div>

                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {r.farmerName || r.userFullName || 'Farmer'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {soilType}{soilColour ? ` · ${soilColour}` : ''} {r.crop ? `· ${r.crop}` : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge label={grade} type={sc >= 75 ? 'success' : sc >= 55 ? 'warning' : 'error'} />
                  {r.season && <Badge label={r.season} type="info" />}
                  {r.confidenceScore && (
                    <Badge label={`${Math.round(r.confidenceScore * 100)}% conf`} type="purple" />
                  )}
                  <div className="flex gap-1">
                    <Link to={`/report/${r._id}`}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="View Report"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <FiEye />
                    </Link>
                    <button onClick={() => handleDelete(r._id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete Report"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === i + 1 ? 'bg-green-500 text-white' : 'glass-light'}`}
              style={page !== i + 1 ? { color: 'var(--text-muted)' } : {}}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
