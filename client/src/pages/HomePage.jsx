import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiActivity, FiPlus } from 'react-icons/fi';
import { GiPlantRoots, GiCapitol } from 'react-icons/gi';
import { soilAPI, govAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { user } = useApp();
  const [soilStats, setSoilStats] = useState({ total: 0 });
  const [govStats, setGovStats] = useState({ total_reports: 0 });

  useEffect(() => {
    soilAPI.getReports({ limit: 1 }).then(r => setSoilStats({ total: r.data.total })).catch(() => {});
    govAPI.getStats().then(r => setGovStats(r.data.data || { total_reports: 0 })).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 py-6">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-emerald))', boxShadow: '0 4px 24px rgba(74,222,128,0.35)' }}>
          <GiPlantRoots className="text-black text-3xl" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold gradient-text">AgriVerse</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          AI Multi-Agent Agriculture Platform
        </p>
        {user && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Welcome back, <span style={{ color: 'var(--accent-green)' }}>{user.fullName}</span> 👋
          </p>
        )}
      </motion.div>

      {/* Soil Agent Card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 card-hover"
        style={{ border: '1px solid rgba(74,222,128,0.25)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4ade80, #34d399)', boxShadow: '0 4px 20px rgba(74,222,128,0.30)' }}>
            <GiPlantRoots className="text-black text-3xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Soil Intelligence Agent</h2>
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>AI-Powered Soil Analysis</p>
          </div>
        </div>

        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Upload soil images, get nutrient analysis, crop recommendations, fertilizer plans, and yield predictions powered by Groq Llama 3.3.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Reports', value: soilStats.total },
            { label: 'Crops Covered', value: '50+' },
            { label: 'Parameters', value: '6' },
          ].map((s, i) => (
            <div key={i} className="stat-card text-center">
              <p className="text-xl font-bold" style={{ color: 'var(--accent-green)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['Soil Nutrient Analysis', 'Crop Recommendations', 'Fertilizer Planning', 'Yield Prediction', 'Image Analysis', 'Tamil Support'].map((f, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'rgba(74,222,128,0.10)', color: 'var(--accent-green)', border: '1px solid rgba(74,222,128,0.20)' }}>
              {f}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <Link to="/analyse" className="btn-primary flex-1 justify-center"
            style={{ background: 'linear-gradient(135deg, #4ade80, #34d399)', boxShadow: '0 4px 16px rgba(74,222,128,0.30)' }}>
            <FiPlus size={15} /> New Analysis <FiArrowRight size={14} />
          </Link>
          <Link to="/history" className="btn-secondary px-4">
            <FiActivity size={15} /> History
          </Link>
        </div>
      </motion.div>

      {/* Government Agent Card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 card-hover"
        style={{ border: '1px solid rgba(167,139,250,0.25)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', boxShadow: '0 4px 20px rgba(167,139,250,0.30)' }}>
            <GiCapitol className="text-white text-3xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Government Scheme Agent</h2>
            <p className="text-xs font-semibold" style={{ color: '#a78bfa' }}>AI Eligibility Checker</p>
          </div>
        </div>

        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Check eligibility for PM-KISAN, PMFBY, Kisan Credit Card, PM-KUSUM, drip irrigation subsidies, and 10+ government schemes.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Reports', value: govStats.total_reports },
            { label: 'Schemes', value: '10+' },
            { label: 'Max Subsidy', value: '₹2L+' },
          ].map((s, i) => (
            <div key={i} className="stat-card text-center">
              <p className="text-xl font-bold" style={{ color: '#a78bfa' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {['PM-KISAN', 'PMFBY', 'Kisan Credit Card', 'PM-KUSUM', 'Drip Subsidy', 'PKVY Organic'].map((f, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'rgba(167,139,250,0.10)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.20)' }}>
              {f}
            </span>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to="/government/analyse" className="btn-primary flex-1 justify-center"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', boxShadow: '0 4px 16px rgba(167,139,250,0.30)' }}>
            <FiPlus size={15} /> Check Eligibility <FiArrowRight size={14} />
          </Link>
          <Link to="/government/history" className="btn-secondary px-4">
            <FiActivity size={15} /> History
          </Link>
        </div>
      </motion.div>

      {/* Platform note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5 text-center"
        style={{ border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
          🤖 Multi-Agent Architecture
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Each agent operates independently with its own AI, database, and logic — yet share one login and platform.
          Active: Soil Agent · Government Scheme Agent &nbsp;|&nbsp; Coming soon: Weather · Market Price · Disease Detection
        </p>
      </motion.div>
    </div>
  );
}
