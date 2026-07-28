import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCamera, FiX, FiImage, FiAlertCircle, FiChevronDown, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { GiPlantRoots, GiChemicalDrop } from 'react-icons/gi';
import { soilAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const CROPS      = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Tomato', 'Onion', 'Chickpea', 'Mustard', 'Sunflower', 'Turmeric', 'Banana', 'Mango', 'Other'];
const IRRIGATION = ['Drip', 'Sprinkler', 'Flood', 'Furrow', 'Rainfed', 'Canal', 'Borewell'];
const SEASONS    = ['Kharif', 'Rabi', 'Summer', 'Annual'];
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function SelectField({ label, name, options, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange(name, e.target.value)}
          className="input-field appearance-none pr-10 cursor-pointer">
          <option value="">— Select {label} —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

function InputField({ label, name, type = 'text', placeholder, min, max, step, value, onChange, required, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        className={`input-field ${error ? 'border-red-500/60' : ''}`}
        style={error ? { borderColor: 'rgba(248,113,113,0.6)' } : {}} />
      {error && (
        <p className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--accent-red)' }}>
          <FiAlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// Visual property badge with confidence
function VisualBadge({ label, value, hex, confidence }) {
  const confColor = confidence >= 80 ? '#4ade80' : confidence >= 60 ? '#facc15' : '#fb923c';
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-center gap-2">
        {hex && <span className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20" style={{ background: hex }} />}
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
      </div>
      {confidence != null && (
        <span className="text-xs font-medium" style={{ color: confColor }}>{confidence}% confidence</span>
      )}
    </div>
  );
}

export default function ImageUploadForm({ onSubmit, loading }) {
  const { user } = useApp();

  // Step 1 state
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [imageError, setImageError] = useState('');
  const [scanning, setScanning]   = useState(false);

  // Step 2 state — set after vision analysis
  const [step, setStep]           = useState(1); // 1 = upload, 2 = lab values
  const [visionResult, setVision] = useState(null); // imageAnalysis object
  const [imageData, setImageData] = useState(null); // base64
  const [mimeType, setMimeType]   = useState(null);

  const [errors, setErrors]       = useState({});

  const [form, setForm] = useState({
    notes: '', temperature: '28', humidity: '65', rainfall: '800',
    season: '', crop: '', previousCrop: '', irrigationType: '',
    soilPH: '', electricalConductivity: '', organicCarbon: '',
    nitrogen: '', phosphorus: '', potassium: '',
  });

  const fileRef   = useRef();
  const cameraRef = useRef();

  const setF = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  // ── Image handling ──────────────────────────────────────────────────────────
  const processFile = (file) => {
    setImageError('');
    if (!ALLOWED_TYPES.includes(file.type)) { setImageError('Only JPG, PNG, WEBP images are supported'); return; }
    if (file.size > 10 * 1024 * 1024)       { setImageError('Image must be under 10MB'); return; }
    setImage(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const clearImage = () => { setImage(null); setPreview(null); setImageError(''); setStep(1); setVision(null); };

  // ── Step 1: Scan image ──────────────────────────────────────────────────────
  const handleScanImage = async () => {
    if (!image) { setImageError('Please upload a soil image'); return; }
    setScanning(true);
    setImageError('');
    try {
      const fd = new FormData();
      fd.append('image', image);
      const res = await soilAPI.uploadImage(fd);
      const { imageAnalysis, imageData: b64, mimeType: mt } = res.data;
      console.log('imageAnalysis:', imageAnalysis);
      if (!imageAnalysis?.available) {
        setImageError(imageAnalysis?.reason || 'Image analysis failed. Please use a real soil photo.');
        return;
      }
      setVision(imageAnalysis);
      setImageData(b64);
      setMimeType(mt);
      setStep(2);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Image analysis failed';
      if (err.response?.data?.rejected) {
        setImageError(`Not a soil image: ${detail}`);
      } else {
        setImageError(detail);
      }
    } finally {
      setScanning(false);
    }
  };

  // ── Step 2: Validate & submit ───────────────────────────────────────────────
  const validateStep2 = () => {
    const e = {};
    ['season', 'crop', 'previousCrop', 'irrigationType',
     'soilPH', 'electricalConductivity', 'organicCarbon', 'nitrogen', 'phosphorus', 'potassium',
    ].forEach(k => { if (!form[k]) e[k] = 'Required'; });
    if (form.soilPH && (Number(form.soilPH) < 0 || Number(form.soilPH) > 14)) e.soilPH = 'pH must be 0–14';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    onSubmit({
      imageData,
      mimeType,
      imageAnalysis: visionResult,
      // Auto-fill from logged-in user
      farmerName:   user?.fullName      || 'Farmer',
      mobileNumber: user?.mobileNumber  || '',
      ...form,
      soilPH:                 parseFloat(form.soilPH),
      electricalConductivity: parseFloat(form.electricalConductivity),
      organicCarbon:          parseFloat(form.organicCarbon),
      nitrogen:               parseFloat(form.nitrogen),
      phosphorus:             parseFloat(form.phosphorus),
      potassium:              parseFloat(form.potassium),
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── STEP 1: Image Upload ── */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <FiImage style={{ color: 'var(--accent-green)' }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Step 1 — Upload Soil Image</h2>
          {step === 2 && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', border: '1px solid var(--border)' }}>
              <FiCheckCircle size={11} /> Analysed
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current.click()}
                className="relative border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all text-center"
                style={{
                  borderColor: dragOver ? 'var(--accent-green)' : imageError ? 'rgba(248,113,113,0.5)' : 'var(--border-strong)',
                  background: dragOver ? 'var(--glow-green)' : 'var(--bg-card2)',
                }}>
                <motion.div animate={dragOver ? { scale: 1.1 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'var(--glow-green)', border: '1px solid var(--border-strong)' }}>
                    <FiUpload size={28} style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                    {dragOver ? 'Drop your soil image here' : 'Drag & Drop Soil Image'}
                  </p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    or click to browse · JPG, PNG, WEBP · Max 10MB
                  </p>
                </motion.div>
              </div>
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => cameraRef.current.click()}
                  className="btn-secondary text-sm flex items-center gap-2">
                  <FiCamera size={14} /> Capture from Camera
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                onChange={e => e.target.files[0] && processFile(e.target.files[0])} className="hidden" />
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="relative rounded-2xl overflow-hidden" style={{ border: `2px solid ${step === 2 ? 'var(--accent-green)' : 'var(--border-strong)'}` }}>
                <img src={preview} alt="Soil preview" className="w-full max-h-64 object-cover" />
                <div className="absolute inset-0 flex items-end p-4"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                    <span className="text-white text-sm font-medium">
                      {step === 2 ? 'AI analysis complete ✓' : 'Ready for AI analysis'}
                    </span>
                  </div>
                </div>
                {step === 1 && (
                  <button type="button" onClick={clearImage}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                {image?.name} · {(image?.size / 1024).toFixed(0)} KB
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={e => e.target.files[0] && processFile(e.target.files[0])} className="hidden" />

        {imageError && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-sm mt-3" style={{ color: 'var(--accent-red)' }}>
            <FiAlertCircle size={13} /> {imageError}
          </motion.p>
        )}

        {/* AI detects only visual properties */}
        {step === 1 && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent-green)' }}>🤖 AI will visually detect from your image:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {['Soil Colour', 'Soil Texture', 'Moisture Level', 'Organic Matter', 'Estimated Soil Type', 'Surface Condition'].map(item => (
                <span key={item} className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  ✓ {item}
                </span>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              ⚠️ AI does <strong>not</strong> predict pH, N, P, K or EC from images. You will enter those manually.
            </p>
          </div>
        )}

        {/* Scan button — only in step 1 */}
        {step === 1 && preview && (
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={handleScanImage} disabled={scanning}
              className="btn-primary gap-2 disabled:opacity-60 px-8 py-3 text-base flex items-center">
              {scanning
                ? <><FiLoader size={16} className="animate-spin" /> Analysing Image...</>
                : <><FiImage size={16} /> Analyse Soil Image</>}
            </button>
          </div>
        )}
      </div>

      {/* ── STEP 2: Vision Results + Manual Lab Values ── */}
      <AnimatePresence>
        {step === 2 && visionResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Vision Results Panel */}
              <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid rgba(74,222,128,0.3)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-lg">🔬</span>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>AI Detected Visual Properties</h2>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', border: '1px solid var(--border)' }}>
                    Confidence: {visionResult.confidence}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <VisualBadge label="Soil Colour"         value={visionResult.soilColour}      hex={visionResult.colourHex} confidence={visionResult.confidence} />
                  <VisualBadge label="Texture"             value={visionResult.texture}          confidence={visionResult.confidence} />
                  <VisualBadge label="Moisture Level"      value={visionResult.moisture}         confidence={visionResult.confidence} />
                  <VisualBadge label="Organic Matter"      value={visionResult.organicMatter}    confidence={visionResult.confidence} />
                  <VisualBadge label="Estimated Soil Type" value={visionResult.estimatedSoilType} confidence={visionResult.confidence} />
                  <VisualBadge label="Surface Condition"   value={visionResult.surfaceCondition} />
                </div>

                {visionResult.visualObservations && (
                  <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    🧠 {visionResult.visualObservations}
                  </div>
                )}
              </div>

              {/* Farm Context */}
              <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <GiPlantRoots style={{ color: 'var(--accent-green)' }} />
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Farm Context</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SelectField label="Season"          name="season"         options={SEASONS}    value={form.season}         onChange={setF} required />
                  <SelectField label="Current Crop"    name="crop"           options={CROPS}      value={form.crop}           onChange={setF} required />
                  <SelectField label="Previous Crop"   name="previousCrop"   options={CROPS}      value={form.previousCrop}   onChange={setF} required />
                  <SelectField label="Irrigation Type" name="irrigationType" options={IRRIGATION} value={form.irrigationType} onChange={setF} required />
                </div>
              </div>

              {/* Manual Lab Values */}
              <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-2 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <GiChemicalDrop style={{ color: '#818cf8' }} />
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Step 2 — Enter Soil Test Values</h2>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                    From Lab Report
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Enter values from your soil test lab report. These are combined with the AI image analysis above.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'soilPH',                 label: 'pH',              placeholder: '4.5 – 9.0',  step: '0.1',  min: '0',  max: '14' },
                    { key: 'electricalConductivity', label: 'EC (dS/m)',       placeholder: '0.1 – 8.0',  step: '0.01', min: '0',  max: '20' },
                    { key: 'organicCarbon',          label: 'Organic Carbon (%)', placeholder: '0.1 – 4.0', step: '0.01', min: '0', max: '10' },
                    { key: 'nitrogen',               label: 'Nitrogen (kg/ha)',   placeholder: '0 – 300',   step: '1',    min: '0',  max: '500' },
                    { key: 'phosphorus',             label: 'Phosphorus (kg/ha)', placeholder: '0 – 150',   step: '1',    min: '0',  max: '300' },
                    { key: 'potassium',              label: 'Potassium (kg/ha)',  placeholder: '0 – 500',   step: '1',    min: '0',  max: '800' },
                  ].map(({ key, label, placeholder, step, min, max }) => (
                    <InputField key={key} label={label} name={key} type="number"
                      placeholder={placeholder} step={step} min={min} max={max}
                      value={form[key]} onChange={setF} required error={errors[key]} />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-center gap-3">
                <button type="button" onClick={() => { setStep(1); setVision(null); }}
                  className="btn-secondary">
                  ← Re-scan Image
                </button>
                <button type="submit" disabled={loading}
                  className="btn-primary gap-2 disabled:opacity-60 px-10 py-3 text-base">
                  <GiPlantRoots size={18} />
                  {loading ? 'Analysing Soil...' : 'Get Full Analysis'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
