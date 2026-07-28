import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSend, FiUser, FiMapPin, FiCreditCard, FiUpload, FiX, FiLock } from 'react-icons/fi';
import { GiCapitol } from 'react-icons/gi';
import { govAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
];

const CROPS = [
  'Rice','Wheat','Maize','Cotton','Sugarcane','Groundnut','Soybean','Pulses',
  'Oilseeds','Vegetables','Fruits','Banana','Onion','Tomato','Potato',
  'Turmeric','Chilli','Jowar','Bajra','Ragi','Other',
];

const IRRIGATION = ['Drip','Sprinkler','Canal','Borewell','Rainfed','Tank','River'];

const INITIAL = {
  farmer_name: '', age: '', gender: 'Male', mobile: '',
  state: 'Tamil Nadu', district: '', village: '',
  category: 'General', annual_income: '', farm_size: '',
  land_ownership: 'Owned', crop: 'Rice', irrigation_type: 'Drip',
  pm_kisan_registered: false, aadhaar_available: true,
  bank_account_available: true, farmer_type: 'Small',
  cibil_score: '',
};

const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="section-card">
      <div className="section-card-title">{icon} {title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">{children}</div>
    </div>
  );
}

// Document upload slot
function DocUpload({ label, file, onFile, onClear }) {
  const ref = useRef();
  const handleChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!ALLOWED_DOC_TYPES.includes(f.type)) { toast.error('Only JPG, PNG, PDF allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    onFile(f);
  };
  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {file ? (
        <div className="flex items-center gap-2">
          <span className="text-xs flex-1 truncate" style={{ color: 'var(--accent-green)' }}>
            ✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </span>
          <button type="button" onClick={onClear}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--accent-red)' }}>
            <FiX size={11} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current.click()}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all"
          style={{ background: 'var(--bg-input)', border: '1px dashed var(--border-strong)', color: 'var(--text-muted)' }}>
          <FiUpload size={12} /> Upload {label} (JPG / PNG / PDF)
        </button>
      )}
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleChange} className="hidden" />
    </div>
  );
}

export default function GovernmentAnalyse() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);

  // Document files (not sent to server, stored as references)
  const [aadhaarFile, setAadhaarFile]   = useState(null);
  const [passbookFile, setPassbookFile] = useState(null);
  const [otherFile, setOtherFile]       = useState(null);

  // Issue 3: Auto-fill from logged-in user
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        farmer_name: user.fullName  || prev.farmer_name,
        mobile:      user.mobileNumber || prev.mobile,
      }));
    }
  }, [user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farmer_name || !form.age || !form.district || !form.annual_income || !form.farm_size) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        annual_income: parseFloat(form.annual_income),
        farm_size: parseFloat(form.farm_size),
        cibil_score: form.cibil_score ? parseInt(form.cibil_score) : 0,
        // Document availability flags (already in form via checkboxes)
        has_aadhaar_doc:  !!aadhaarFile,
        has_passbook_doc: !!passbookFile,
        has_other_doc:    !!otherFile,
      };
      const res = await govAPI.analyse(payload);
      toast.success('Eligibility analysis complete!');
      navigate(`/government/report/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            <GiCapitol className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Check Scheme Eligibility</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fill your profile to find eligible government schemes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Personal Info */}
          <Section icon={<FiUser size={14} />} title="Personal Information">
            <Field label="Farmer Name" required>
              <div className="relative">
                <input className="input-field pr-8" value={form.farmer_name}
                  onChange={e => set('farmer_name', e.target.value)}
                  placeholder="Enter full name"
                  readOnly={!!user?.fullName} />
                {user?.fullName && (
                  <FiLock size={12} className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }} title="Auto-filled from your account" />
                )}
              </div>
              {user?.fullName && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  🔒 Auto-filled from your account
                </p>
              )}
            </Field>
            <Field label="Age" required>
              <input className="input-field" type="number" min="18" max="100"
                value={form.age} onChange={e => set('age', e.target.value)} placeholder="Age in years" />
            </Field>
            <Field label="Gender">
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Mobile Number">
              <div className="relative">
                <input className="input-field pr-8" value={form.mobile}
                  onChange={e => set('mobile', e.target.value)}
                  placeholder="10-digit mobile" maxLength={10}
                  readOnly={!!user?.mobileNumber} />
                {user?.mobileNumber && (
                  <FiLock size={12} className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              {user?.mobileNumber && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  🔒 Auto-filled from your account
                </p>
              )}
            </Field>
            <Field label="Category">
              <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {['General','OBC','SC','ST'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Farmer Type">
              <select className="input-field" value={form.farmer_type} onChange={e => set('farmer_type', e.target.value)}>
                {['Marginal','Small','Medium','Large'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </Section>

          {/* Location */}
          <Section icon={<FiMapPin size={14} />} title="Location Details">
            <Field label="State" required>
              <select className="input-field" value={form.state} onChange={e => set('state', e.target.value)}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="District" required>
              <input className="input-field" value={form.district}
                onChange={e => set('district', e.target.value)} placeholder="Enter district" />
            </Field>
            <Field label="Village">
              <input className="input-field" value={form.village}
                onChange={e => set('village', e.target.value)} placeholder="Enter village (optional)" />
            </Field>
          </Section>

          {/* Farm Details */}
          <Section icon="🌾" title="Farm & Crop Details">
            <Field label="Annual Income (Rs.)" required>
              <input className="input-field" type="number" min="0"
                value={form.annual_income} onChange={e => set('annual_income', e.target.value)} placeholder="e.g. 120000" />
              {form.annual_income && (
                <p className="text-xs mt-1" style={{ color: Number(form.annual_income) > 200000 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                  {Number(form.annual_income) <= 100000 ? '🟢 Low Income — eligible for PM-KISAN, Maandhan'
                    : Number(form.annual_income) <= 200000 ? '🟡 Middle Income — eligible for most schemes'
                    : '🟠 Higher Income — PM-KISAN & Maandhan not applicable'}
                </p>
              )}
            </Field>
            <Field label="CIBIL / Credit Score (300–900)">
              <input className="input-field" type="number" min="300" max="900"
                value={form.cibil_score} onChange={e => set('cibil_score', e.target.value)} placeholder="e.g. 720 (leave blank if unknown)" />
              {form.cibil_score && (
                <p className="text-xs mt-1 font-semibold" style={{
                  color: form.cibil_score >= 750 ? 'var(--accent-green)'
                    : form.cibil_score >= 700 ? 'var(--accent-blue)'
                    : form.cibil_score >= 650 ? 'var(--accent-amber)'
                    : 'var(--accent-red)'
                }}>
                  {form.cibil_score >= 750 ? '✅ Excellent — all loan schemes unlocked'
                    : form.cibil_score >= 700 ? '🟢 Good — KCC & AIF loans eligible'
                    : form.cibil_score >= 650 ? '🟡 Fair — KCC eligible, improve for AIF/NABARD'
                    : form.cibil_score >= 600 ? '🟠 Poor — only MUDRA loan eligible'
                    : '🔴 Very Poor — loan schemes blocked, improve score first'}
                </p>
              )}
            </Field>
            <Field label="Farm Size (Acres)" required>
              <input className="input-field" type="number" min="0.1" step="0.1"
                value={form.farm_size} onChange={e => set('farm_size', e.target.value)} placeholder="e.g. 2.5" />
            </Field>
            <Field label="Land Ownership">
              <select className="input-field" value={form.land_ownership} onChange={e => set('land_ownership', e.target.value)}>
                {['Owned','Leased'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Primary Crop">
              <select className="input-field" value={form.crop} onChange={e => set('crop', e.target.value)}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Irrigation Type">
              <select className="input-field" value={form.irrigation_type} onChange={e => set('irrigation_type', e.target.value)}>
                {IRRIGATION.map(i => <option key={i}>{i}</option>)}
              </select>
            </Field>
          </Section>

          {/* Documents — Issue 2: checkbox + upload */}
          <div className="section-card">
            <div className="section-card-title"><FiCreditCard size={14} /> Document Availability</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

              {/* Aadhaar */}
              <div className="col-span-1 sm:col-span-2">
                <button type="button" onClick={() => set('aadhaar_available', !form.aadhaar_available)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full"
                  style={{
                    background: form.aadhaar_available ? 'rgba(74,222,128,0.08)' : 'var(--bg-card2)',
                    border: `1px solid ${form.aadhaar_available ? 'rgba(74,222,128,0.30)' : 'var(--border)'}`,
                  }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: form.aadhaar_available ? 'var(--accent-green)' : 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    {form.aadhaar_available && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: form.aadhaar_available ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    Aadhaar Card Available
                  </span>
                </button>
                {form.aadhaar_available && (
                  <DocUpload
                    label="Aadhaar Upload"
                    file={aadhaarFile}
                    onFile={setAadhaarFile}
                    onClear={() => setAadhaarFile(null)}
                  />
                )}
              </div>

              {/* Bank Passbook */}
              <div className="col-span-1 sm:col-span-2">
                <button type="button" onClick={() => set('bank_account_available', !form.bank_account_available)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full"
                  style={{
                    background: form.bank_account_available ? 'rgba(74,222,128,0.08)' : 'var(--bg-card2)',
                    border: `1px solid ${form.bank_account_available ? 'rgba(74,222,128,0.30)' : 'var(--border)'}`,
                  }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: form.bank_account_available ? 'var(--accent-green)' : 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    {form.bank_account_available && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: form.bank_account_available ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    Bank Passbook Available
                  </span>
                </button>
                {form.bank_account_available && (
                  <DocUpload
                    label="Bank Passbook Upload"
                    file={passbookFile}
                    onFile={setPassbookFile}
                    onClear={() => setPassbookFile(null)}
                  />
                )}
              </div>

              {/* PM-KISAN */}
              <div className="col-span-1 sm:col-span-2">
                <button type="button" onClick={() => set('pm_kisan_registered', !form.pm_kisan_registered)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full"
                  style={{
                    background: form.pm_kisan_registered ? 'rgba(74,222,128,0.08)' : 'var(--bg-card2)',
                    border: `1px solid ${form.pm_kisan_registered ? 'rgba(74,222,128,0.30)' : 'var(--border)'}`,
                  }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: form.pm_kisan_registered ? 'var(--accent-green)' : 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    {form.pm_kisan_registered && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: form.pm_kisan_registered ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    Already Registered in PM-KISAN
                  </span>
                </button>
              </div>

              {/* Other Documents */}
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Other Documents</p>
                <DocUpload
                  label="Other Document Upload"
                  file={otherFile}
                  onFile={setOtherFile}
                  onClear={() => setOtherFile(null)}
                />
              </div>

            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base"
            style={{
              background: loading ? undefined : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              boxShadow: '0 4px 16px rgba(167,139,250,0.35)',
            }}>
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Analysing…
              </>
            ) : (
              <><FiSend /> Find Eligible Schemes</>
            )}
          </button>

        </form>
      </motion.div>
    </div>
  );
}
