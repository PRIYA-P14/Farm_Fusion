import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { govAPI } from '../../services/api';
import GovernmentDashboard from '../../components/Government/GovernmentDashboard';
import toast from 'react-hot-toast';

export default function GovernmentReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    govAPI.getReport(id)
      .then(res => setReport(res.data.data))
      .catch(() => { toast.error('Report not found'); navigate('/government/history'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this report?')) return;
    try {
      await govAPI.deleteReport(id);
      toast.success('Report deleted');
      navigate('/government/history');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!report) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Back */}
        <Link to="/government/history"
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <FiArrowLeft size={14} /> Back to History
        </Link>

        <GovernmentDashboard report={report} onDelete={handleDelete} />
      </motion.div>
    </div>
  );
}
