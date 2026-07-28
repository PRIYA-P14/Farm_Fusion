import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ImageUploadForm from '../components/ImageUploadForm';
import ResultsDashboard from '../components/ResultsDashboard';
import ThinkingAnimation from '../components/ThinkingAnimation';
import { soilAPI } from '../services/api';

export default function AnalysePage() {
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [savedReport, setSavedReport] = useState(null);
  const navigate = useNavigate();

  const handleAnalyse = async (formData) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await soilAPI.analyseWithImage(formData);
      const report = res.data.data;
      setSavedReport(report);
      setResult(report.analysis);
      toast.success('Soil analysis complete! Report saved.');
      setTimeout(() => document.getElementById('results-dashboard')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <AnimatePresence>
        {loading && <ThinkingAnimation active={loading} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold gradient-text mb-1">Soil Analysis</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Upload a soil image for AI visual analysis, then enter your lab test values for complete recommendations
        </p>
      </motion.div>

      <ImageUploadForm onSubmit={handleAnalyse} loading={loading} />

      <AnimatePresence>
        {result && savedReport && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ResultsDashboard report={savedReport} analysis={result} />
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={() => { setResult(null); setSavedReport(null); window.scrollTo(0, 0); }} className="btn-secondary">
                + New Analysis
              </button>
              <button onClick={() => navigate(`/report/${savedReport._id}`)} className="btn-primary">
                View Full Report →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
