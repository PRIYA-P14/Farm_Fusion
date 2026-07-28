import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const STEPS = [
  { icon: '🧠', text: 'Reading Soil Data...' },
  { icon: '🧪', text: 'Analysing Nutrient Levels...' },
  { icon: '🌾', text: 'Finding Suitable Crops...' },
  { icon: '📈', text: 'Calculating Soil Health Score...' },
  { icon: '💧', text: 'Analysing Irrigation Needs...' },
  { icon: '🤖', text: 'Asking Llama 3.3 70B via Groq...' },
  { icon: '🌱', text: 'Generating Expert Recommendations...' },
  { icon: '✅', text: 'Analysis Complete!' },
];

export default function ThinkingAnimation({ active }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const interval = setInterval(() => {
      setStep(s => (s < STEPS.length - 1 ? s + 1 : s));
    }, 700);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="glass rounded-2xl p-10 max-w-sm w-full mx-4 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-purple-500/20 border border-green-500/30 flex items-center justify-center">
          <motion.span
            key={step}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-4xl"
          >
            {STEPS[step].icon}
          </motion.span>
        </div>

        <div className="space-y-2 mb-6">
          {STEPS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
              className={`flex items-center gap-2 text-sm ${i === step ? 'text-green-400 font-medium' : i < step ? 'text-slate-400' : 'text-slate-600'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i < step ? 'bg-green-500' : i === step ? 'bg-green-400 animate-pulse' : 'bg-slate-700'}`} />
              {s.text}
            </motion.div>
          ))}
        </div>

        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-3">Powered by Llama 3.3 70B · Groq</p>
      </div>
    </motion.div>
  );
}
