import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { soilAPI } from '../services/api';
import ResultsDashboard from '../components/ResultsDashboard';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    soilAPI.getReport(id)
      .then(res => setReport(res.data.data))
      .catch(() => toast.error('Report not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this report permanently?')) return;
    try {
      await soilAPI.deleteReport(id);
      toast.success('Report deleted');
      navigate('/history');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Report not found</p>
      <Link to="/history" className="btn-primary inline-flex mt-4">← Back to History</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/history" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <FiArrowLeft /> Back to History
        </Link>
        <button onClick={handleDelete} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
          <FiTrash2 /> Delete Report
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <ResultsDashboard report={report} analysis={report.analysis} />
      </motion.div>
    </div>
  );
}
