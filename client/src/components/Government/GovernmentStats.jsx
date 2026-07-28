import { motion } from 'framer-motion';
import { FiFileText, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

export default function GovernmentStats({ stats }) {
  const items = [
    { icon: <FiFileText />, label: 'Total Reports', value: stats?.total_reports ?? 0, color: 'var(--accent-green)' },
    { icon: <FiDollarSign />, label: 'Avg Subsidy', value: stats?.avg_subsidy ? `₹${(stats.avg_subsidy / 1000).toFixed(1)}K` : '₹0', color: 'var(--accent-amber)' },
    { icon: <FiTrendingUp />, label: 'Total Subsidy Found', value: stats?.total_subsidy ? `₹${(stats.total_subsidy / 1000).toFixed(0)}K` : '₹0', color: '#a78bfa' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl p-5 text-center card-hover">
          <div className="text-2xl mb-2 flex justify-center" style={{ color: s.color }}>{s.icon}</div>
          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
