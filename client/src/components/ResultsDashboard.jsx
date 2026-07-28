import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { FiVolume2, FiVolumeX, FiSquare } from 'react-icons/fi';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { CircularGauge, ProgressBar, StatCard, Badge, SectionCard } from './UI';
import { scoreColor, severityColor } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { t } from '../utils/i18n';

// Clean a value — remove N/A, undefined, raw units like "5ac", "4 ac", "kg/ha" suffixes
function clean(val) {
  if (!val && val !== 0) return null;
  const s = String(val).trim();
  if (!s || /^(n\/a|na|null|undefined|unknown|-)$/i.test(s)) return null;
  // Remove trailing unit noise like "5ac", "4 ac", "120kg/ha" — keep only plain numbers or words
  return s.replace(/\d+\s*(ac|acre|acres|kg\/ha|kg|ha|mm|%|dS\/m)\b/gi, '').trim() || null;
}

function buildVoiceSummary(report, analysis) {
  const { healthScore, cropSuitability, yieldPrediction, irrigation, risks, notifications, fertilizers } = analysis;

  const score = healthScore?.overall ?? 0;
  const gradeWord = score >= 75 ? 'excellent' : score >= 55 ? 'good' : score >= 35 ? 'average' : 'poor';

  const ph = Number(report.soilPH);
  const phLine = ph >= 6 && ph <= 7.5
    ? `Your soil pH is ${ph}, which is ideal for most crops.`
    : ph < 6
    ? `Your soil is acidic with a pH of ${ph}. You should apply lime to correct it.`
    : `Your soil is alkaline with a pH of ${ph}. Gypsum or sulfur application is recommended.`;

  const topCrop = cropSuitability?.suitable?.[0]?.crop;
  const cropLine = topCrop ? `The best crop for your soil right now is ${topCrop}.` : '';

  const predicted = clean(yieldPrediction?.predicted);
  const yieldLine = predicted ? `Your predicted yield is ${predicted}.` : '';

  const irrigMethod = clean(irrigation?.recommendedMethod);
  const irrigLine = irrigMethod ? `Use ${irrigMethod} irrigation for best results.` : '';

  const topFert = fertilizers?.chemical?.[0]?.name;
  const fertLine = topFert
    ? `Apply ${topFert} as your primary fertilizer.`
    : 'Your nutrient levels are good. No major fertilizers needed.';

  const highRisk = (risks || []).find(r => r.severity === 'High');
  const riskLine = highRisk ? `Important warning: ${highRisk.risk}. ${highRisk.mitigation || ''}.` : '';

  const alert = (notifications || []).find(n => n.type === 'error');
  const alertLine = alert ? `Alert: ${alert.title}.` : '';

  const parts = [
    `Hello ${report.farmerName || 'Farmer'}.`,
    `Your soil health score is ${score} out of 100. That is ${gradeWord}.`,
    phLine, cropLine, yieldLine, irrigLine, fertLine, riskLine, alertLine,
    `Good luck with your ${report.crop} farming.`,
  ];

  return parts.filter(Boolean).join(' ');
}

function VoiceButton({ report, analysis }) {
  const [speaking, setSpeaking] = useState(false);
  const uttRef = useRef(null);

  const doSpeak = () => {
    const text = buildVoiceSummary(report, analysis);
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google UK English Female'))
      || voices.find(v => v.name.includes('Microsoft Zira'))
      || voices.find(v => v.name.includes('Google US English'))
      || voices.find(v => v.lang === 'en-GB')
      || voices.find(v => v.lang === 'en-US')
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.rate   = 0.82;
    utt.pitch  = 1.1;
    utt.volume = 1;
    utt.lang   = 'en-IN';
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Voices may not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { doSpeak(); window.speechSynthesis.onvoiceschanged = null; };
    } else {
      doSpeak();
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <button
      onClick={speaking ? stop : speak}
      className="btn-secondary text-sm flex items-center gap-2"
      title={speaking ? 'Stop voice summary' : 'Listen to soil report summary'}
      style={speaking ? { borderColor: 'var(--accent-green)', color: 'var(--accent-green)' } : {}}
    >
      {speaking ? (
        <><FiSquare size={13} /> Stop</>
      ) : (
        <><FiVolume2 size={14} /> Listen</>
      )}
    </button>
  );
}

export default function ResultsDashboard({ report, analysis }) {
  const { lang } = useApp();
  const { healthScore, nutrientAnalysis, cropSuitability, fertilizers, irrigation, yieldPrediction, actionPlan, notifications, risks, summary, aiNarrative } = analysis;

  const nutrientChartData = [
    { name: 'N', value: report.nitrogen,   fill: '#22c55e' },
    { name: 'P', value: report.phosphorus, fill: '#3b82f6' },
    { name: 'K', value: report.potassium,  fill: '#a855f7' },
  ];

  return (
    <div id="results-dashboard" className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-green-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Soil Analysis Report</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {report.farmerName} · {report.village}, {report.district}, {report.state} · {report.crop} · {report.season}
            </p>
            {aiNarrative?.available && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-full">
                🤖 AI Powered
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <VoiceButton report={report} analysis={analysis} />
            <button onClick={() => window.print()} className="btn-secondary text-sm">🖨️ Print</button>
          </div>
        </div>
      </motion.div>

      {/* ── CV VISION ANALYSIS PANEL ── */}
      {analysis.imageAnalysis?.soilColour && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-green-500/20">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Soil image */}
            {report.soilImageUrl && (
              <div className="flex-shrink-0">
                <img src={report.soilImageUrl.startsWith('/uploads/') ? `http://localhost:8000${report.soilImageUrl}` : report.soilImageUrl} alt="Soil sample"
                  className="w-full sm:w-48 h-36 object-cover rounded-xl"
                  style={{ border: '2px solid var(--accent-green)' }} />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-400 mb-3">🔬 AI VISUAL SOIL ANALYSIS</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Soil Colour',         value: analysis.imageAnalysis.soilColour,      hex: analysis.imageAnalysis.colourHex, conf: analysis.imageAnalysis.confidence },
                  { label: 'Texture',             value: analysis.imageAnalysis.texture,           conf: analysis.imageAnalysis.confidence },
                  { label: 'Moisture Level',      value: analysis.imageAnalysis.moisture,          conf: analysis.imageAnalysis.confidence },
                  { label: 'Organic Matter',      value: analysis.imageAnalysis.organicMatter,     conf: analysis.imageAnalysis.confidence },
                  { label: 'Estimated Soil Type', value: analysis.imageAnalysis.estimatedSoilType, conf: analysis.imageAnalysis.confidence },
                  { label: 'Surface Condition',   value: analysis.imageAnalysis.surfaceCondition },
                ].map(({ label, value, hex, conf }) => value ? (
                  <div key={label} className="p-2 rounded-xl" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {hex && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: hex }} />}
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    </div>
                    {conf != null && (
                      <p className="text-xs mt-0.5 font-medium" style={{ color: conf >= 80 ? '#4ade80' : conf >= 60 ? '#facc15' : '#fb923c' }}>
                        {conf}% confidence
                      </p>
                    )}
                  </div>
                ) : null)}
              </div>
              {analysis.imageAnalysis.visualObservations && (
                <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  🧠 {analysis.imageAnalysis.visualObservations}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── AI EXPERT VERDICT ── */}
      {aiNarrative?.available && aiNarrative.expertVerdict && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-2xl">🧠</div>
            <div>
              <p className="text-xs text-purple-400 font-semibold mb-1">AI EXPERT VERDICT</p>
              <p className="font-medium text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>"{aiNarrative.expertVerdict}"</p>
              {aiNarrative.soilStory && (
                <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiNarrative.soilStory}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <SectionCard title="Smart Alerts" icon="🔔">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notifications.map((n, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-xl border ${severityColor(n.type)}`}>
                <span className="text-lg flex-shrink-0">{n.icon}</span>
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">{n.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Health Score + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title={t(lang, 'soilHealth')} icon="🌡️" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-4">
            <CircularGauge score={healthScore.overall} size={140} />
            <Badge label={healthScore.grade} type={healthScore.colour === 'green' ? 'success' : healthScore.colour === 'yellow' ? 'warning' : 'error'} />
            <div className="w-full space-y-2">
              {Object.entries(healthScore.scores).map(([k, v]) => (
                <ProgressBar key={k} label={k.toUpperCase()} value={Math.round(v)} color={v >= 70 ? 'green' : v >= 40 ? 'yellow' : 'red'} />
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon="⚗️" label="Soil pH" value={report.soilPH} color={report.soilPH >= 6 && report.soilPH <= 7.5 ? 'green' : 'orange'} />
            <StatCard icon="⚡" label="EC (dS/m)" value={report.electricalConductivity} color={report.electricalConductivity < 2 ? 'green' : 'red'} />
            <StatCard icon="🌿" label="Organic Carbon" value={`${report.organicCarbon}%`} color={report.organicCarbon >= 0.75 ? 'green' : 'orange'} />
            <StatCard icon="🌱" label="Nitrogen" value={report.nitrogen} unit="kg/ha" color="blue" />
            <StatCard icon="🔵" label="Phosphorus" value={report.phosphorus} unit="kg/ha" color="purple" />
            <StatCard icon="🟡" label="Potassium" value={report.potassium} unit="kg/ha" color="yellow" />
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Nutrient Levels (kg/ha)</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={nutrientChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {nutrientChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── AI NUTRIENT EXPLANATION ── */}
      {aiNarrative?.available && aiNarrative.nutrientExplanation && (
        <SectionCard title="AI Nutrient Analysis" icon="🧪">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(aiNarrative.nutrientExplanation).map(([key, explanation]) => (
              <div key={key} className="p-4 rounded-xl" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold text-purple-400 uppercase mb-2">{key === 'ph' ? 'Soil pH' : key === 'organicCarbon' ? 'Organic Carbon' : key}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{explanation}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Suitable Crops */}
      <SectionCard title={t(lang, 'suitableCrops')} icon="🌾">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-green-400 font-medium mb-3">✅ Recommended Crops (Top 5)</p>
            <div className="space-y-2">
              {cropSuitability.suitable.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.crop}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge label={c.waterNeed} type="info" />
                    <Badge label={c.season} type="success" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-red-400 font-medium mb-3">❌ Not Recommended</p>
            <div className="space-y-2">
              {cropSuitability.unsuitable.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.crop}</span>
                  <Badge label={c.reason} type="error" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── AI CROP ADVICE ── */}
      {aiNarrative?.available && aiNarrative.cropAdvice?.length > 0 && (
        <SectionCard title="AI Crop Advice" icon="🌾">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiNarrative.cropAdvice.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.crop}</span>
                  <Badge label={c.expectedYield} type="success" />
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>🌱 {c.why}</p>
                <p className="text-xs text-yellow-400">💡 {c.keyTip}</p>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Yield + Irrigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SectionCard title={t(lang, 'yieldPrediction')} icon="📈">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Predicted Yield</span>
              <span className="text-lg font-bold" style={{ color: 'var(--accent-blue)' }}>{yieldPrediction.predicted}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Potential Yield</span>
              <span className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>{yieldPrediction.potential}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Yield Gap</span>
              <span className="text-lg font-bold" style={{ color: 'var(--accent-amber)' }}>{yieldPrediction.gap}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Improvement potential: <span style={{ color: 'var(--accent-amber)' }}>{yieldPrediction.improvementPotential}</span></p>
          </div>
        </SectionCard>

        <SectionCard title={t(lang, 'irrigation')} icon="💧">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Current Method</span><Badge label={irrigation.currentMethod} type="info" /></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Recommended</span><Badge label={irrigation.recommendedMethod} type="success" /></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Water Requirement</span><span className="text-xs" style={{ color: 'var(--text-primary)' }}>{irrigation.waterRequirement}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Schedule</span><span className="text-xs" style={{ color: 'var(--text-primary)' }}>{irrigation.schedule}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Water Stress Risk</span><Badge label={irrigation.waterStressRisk} type={irrigation.waterStressRisk === 'High' ? 'error' : 'success'} /></div>
            {aiNarrative?.available && aiNarrative.irrigationAdvice && (
              <p className="text-xs mt-2 pt-2" style={{ color: 'var(--accent-blue)', borderTop: '1px solid var(--border)' }}>🤖 {aiNarrative.irrigationAdvice}</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Fertilizer Recommendations */}
      <SectionCard title={t(lang, 'fertilizers')} icon="🧪">
        {aiNarrative?.available && aiNarrative.fertilizerNarrative && (
          <div className="mb-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <p className="text-xs text-purple-400 font-semibold mb-1">🤖 AI Fertilizer Strategy</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{aiNarrative.fertilizerNarrative}</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-blue-400 mb-3">Chemical Fertilizers</p>
            {fertilizers.chemical.length === 0
              ? <p className="text-sm text-green-400">✅ Nutrient levels are optimal — no chemical fertilizers needed</p>
              : fertilizers.chemical.map((f, i) => (
                <div key={i} className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    <Badge label={f.dose} type="info" />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>⏰ {f.timing}</p>
                  <p className="text-xs text-green-400 mt-1">✓ {f.benefit}</p>
                </div>
              ))
            }
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-green-400 mb-3">Organic & Amendments</p>
              {[...fertilizers.organic, ...fertilizers.amendments].map((f, i) => (
                <div key={i} className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl mb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    <Badge label={f.dose} type="success" />
                  </div>
                  <p className="text-xs text-green-400 mt-1">✓ {f.benefit}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-purple-400 mb-3">Biofertilizers</p>
              {fertilizers.biofertilizers.map((b, i) => (
                <div key={i} className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl mb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                    <Badge label={b.dose} type="purple" />
                  </div>
                  <p className="text-xs text-purple-500 mt-1">✓ {b.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-yellow-400 mb-3">Micronutrient Recommendations</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fertilizers.micronutrients.map((m, i) => (
              <div key={i} className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--accent-amber)' }}>{m.dose}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.why}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── AI DISEASE RISKS ── */}
      {aiNarrative?.available && aiNarrative.diseaseRisks?.length > 0 && (
        <SectionCard title="AI Disease & Pest Risk Assessment" icon="🦠">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiNarrative.diseaseRisks.map((d, i) => (
              <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{d.disease}</span>
                  <Badge label={d.risk} type={d.risk === 'High' ? 'error' : d.risk === 'Medium' ? 'warning' : 'success'} />
                </div>
                <p className="text-xs text-green-400">💡 {d.prevention}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Action Plan */}
      <SectionCard title={t(lang, 'actionPlan')} icon="📋">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'immediate', label: 'Immediate Actions', color: 'red', icon: '🚨' },
            { key: 'weekly', label: 'Weekly Tasks', color: 'orange', icon: '📅' },
            { key: 'monthly', label: 'Monthly Tasks', color: 'blue', icon: '🗓️' },
            { key: 'seasonal', label: 'Seasonal Tasks', color: 'green', icon: '🌿' },
            { key: 'longTerm', label: 'Long-Term Goals', color: 'purple', icon: '🎯' },
          ].map(({ key, label, color, icon }) => (
            <div key={key} className={`p-4 rounded-xl bg-${color}-500/5 border border-${color}-500/20`}>
              <p className={`text-xs font-semibold text-${color}-400 mb-3`}>{icon} {label}</p>
              <ul className="space-y-2">
                {actionPlan[key].map((item, i) => (
                  <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── AI SEASONAL CALENDAR ── */}
      {aiNarrative?.available && aiNarrative.seasonalCalendar?.length > 0 && (
        <SectionCard title="AI Seasonal Farming Calendar" icon="📅">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiNarrative.seasonalCalendar.map((s, i) => (
              <div key={i} className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-xs font-bold text-blue-400 mb-1">{s.month}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.task}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.reason}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Risk Analysis */}
      {risks.length > 0 && (
        <SectionCard title={t(lang, 'risks')} icon="⚠️">
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.risk}</span>
                  <Badge label={r.severity} type={r.severity === 'High' ? 'error' : 'warning'} />
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                <p className="text-xs text-green-400">💡 {r.mitigation}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── AI ORGANIC FARMING + MARKET ── */}
      {aiNarrative?.available && (aiNarrative.organicFarmingPath || aiNarrative.marketInsight) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {aiNarrative.organicFarmingPath && (
            <SectionCard title="Organic Farming Path" icon="🌱">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiNarrative.organicFarmingPath}</p>
            </SectionCard>
          )}
          {aiNarrative.marketInsight && (
            <SectionCard title="Market Insight" icon="📊">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiNarrative.marketInsight}</p>
            </SectionCard>
          )}
        </div>
      )}

      {/* Summary */}
      <SectionCard title="Soil Summary" icon="📊">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Soil Fertility', value: summary.soilFertility },
            { label: 'Soil Health', value: summary.soilHealth },
            { label: 'Organic Farming', value: summary.organicFarmingSuitability },
            { label: 'Water Retention', value: summary.waterRetention },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 glass-light rounded-xl">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

{/* ── AI TAMIL SUMMARY ── */}
      {aiNarrative?.available && aiNarrative.tamilSummary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-orange-500/20">
          <p className="text-xs font-semibold text-orange-400 mb-3">🇹🇳 தமிழ் சுருக்கம் (Tamil Summary)</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiNarrative.tamilSummary}</p>
        </motion.div>
      )}

{/* ── AI MOTIVATIONAL MESSAGE ── */}
      {aiNarrative?.available && aiNarrative.motivationalMessage && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-green-500/20 text-center">
          <span className="text-4xl">🌾</span>
          <p className="font-medium text-lg mt-3 italic" style={{ color: 'var(--text-primary)' }}>"{aiNarrative.motivationalMessage}"</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>— Soil Intelligence Agent AI</p>
        </motion.div>
      )}

      {/* Agent Footer */}
      <div className="glass-light rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Soil Intelligence Agent v1.0 · {aiNarrative?.available ? '🤖 AI Powered' : '⚙️ Rule Engine'} · Multi-Agent Ready
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Weather Agent', 'Market Agent', 'Scheme Agent'].map(a => (
            <span key={a} className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{a} (Soon)</span>
          ))}
        </div>
      </div>
    </div>
  );
}
