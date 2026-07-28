import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheckSquare, FiSquare } from 'react-icons/fi';

export default function DocumentChecklist({ schemes }) {
  const allDocs = [...new Set(schemes.flatMap(s => s.required_documents || []))];
  const [checked, setChecked] = useState({});

  const toggle = (doc) => setChecked(prev => ({ ...prev, [doc]: !prev[doc] }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="section-card">
      <div className="section-card-title">
        📋 Document Checklist
        <span className="ml-auto text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
          {doneCount}/{allDocs.length} ready
        </span>
      </div>

      {/* Progress */}
      <div className="progress-track mb-4">
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${allDocs.length ? (doneCount / allDocs.length) * 100 : 0}%`,
            background: 'linear-gradient(90deg, var(--accent-green), var(--accent-emerald))',
          }} />
      </div>

      <div className="space-y-2">
        {allDocs.map((doc, i) => (
          <button key={i} onClick={() => toggle(doc)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
            style={{
              background: checked[doc] ? 'rgba(74,222,128,0.08)' : 'var(--bg-card2)',
              border: `1px solid ${checked[doc] ? 'rgba(74,222,128,0.25)' : 'var(--border)'}`,
            }}>
            {checked[doc]
              ? <FiCheckSquare size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              : <FiSquare size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            <span className="text-sm" style={{ color: checked[doc] ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
              {doc}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
