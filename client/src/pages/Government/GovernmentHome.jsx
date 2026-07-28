import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiClock, FiActivity } from 'react-icons/fi';
import { GiCapitol } from 'react-icons/gi';
import { govAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import GovernmentStats from '../../components/Government/GovernmentStats';
import GovernmentTimeline from '../../components/Government/GovernmentTimeline';

const FEATURES = [
  { icon: '🏛️', title: 'PM-KISAN & Central Schemes', desc: 'Find all central government schemes you qualify for' },
  { icon: '🌾', title: 'State-Specific Subsidies', desc: 'State agriculture subsidies based on your location' },
  { icon: '🛡️', title: 'Crop Insurance (PMFBY)', desc: 'Protect your crops with government insurance schemes' },
  { icon: '☀️', title: 'Solar Pump (PM-KUSUM)', desc: '60% subsidy on solar irrigation pumps' },
  { icon: '💧', title: 'Drip Irrigation Subsidy', desc: '55% subsidy on micro-irrigation systems' },
  { icon: '🌱', title: 'Organic Farming (PKVY)', desc: 'Rs.50,000/hectare for organic farming transition' },
];

export default function GovernmentHome() {
  const { user } = useApp();
  const [stats, setStats] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);

  useEffect(() => {
    govAPI.getStats().then(r => setStats(r.data.data)).catch(() => {});
    govAPI.health().then(r => setAgentStatus(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 py-8">
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', boxShadow: '0 4px 32px rgba(167,139,250,0.35)' }}>
          <GiCapitol className="text-white text-4xl" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Government Scheme Agent
        </h1>
        {user && (
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Welcome, <span style={{ color: '#a78bfa' }}>{user.fullName}</span> 👋
          </p>
        )}
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          AI-powered eligibility checker for government agriculture schemes, subsidies, loans & insurance
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/government/analyse" className="btn-primary flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            <FiPlusCircle /> Check Eligibility
          </Link>
          <Link to="/government/history" className="btn-secondary flex items-center gap-2">
            <FiClock /> View History
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <GovernmentStats stats={stats} />

      {/* Agent Status */}
      {agentStatus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="pulse-dot" style={{ background: '#a78bfa', boxShadow: '0 0 0 0 rgba(167,139,250,0.4)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#a78bfa' }}>{agentStatus.agent}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {agentStatus.schemes_loaded} schemes loaded · Status: {agentStatus.status}
            </p>
          </div>
          <span className="ml-auto badge" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.25)' }}>
            <FiActivity size={10} className="mr-1" /> Active
          </span>
        </motion.div>
      )}

      {/* Features */}
      <div>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Schemes We Cover</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-5 card-hover">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <GovernmentTimeline />
    </div>
  );
}
