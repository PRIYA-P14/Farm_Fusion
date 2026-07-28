import { motion } from 'framer-motion';

const STEPS = [
  { step: '1', title: 'Fill Farmer Profile', desc: 'Enter your personal, land, and crop details accurately.' },
  { step: '2', title: 'Run AI Analysis', desc: 'Our rule engine matches you with eligible government schemes.' },
  { step: '3', title: 'Review Schemes', desc: 'See all eligible schemes with subsidy amounts and benefits.' },
  { step: '4', title: 'Prepare Documents', desc: 'Use the document checklist to gather required papers.' },
  { step: '5', title: 'Apply Online/Offline', desc: 'Visit official website or nearest CSC/Agriculture Office.' },
];

export default function GovernmentTimeline() {
  return (
    <div className="section-card">
      <div className="section-card-title">🗺️ How to Apply</div>
      <div className="space-y-0">
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }} className="timeline-item pb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-black"
              style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-emerald))' }}>
              {s.step}
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
