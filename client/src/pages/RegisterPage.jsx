import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

function Field({ icon: Icon, label, name, type, value, onChange, error, showToggle, showPw, onToggle }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="relative">
        <span className="absolute flex items-center pointer-events-none" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <Icon size={15} />
        </span>
        <input
          type={showToggle ? (showPw ? 'text' : 'password') : (type || 'text')}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          autoComplete="off"
          className="input-field"
          style={{
            paddingLeft: '2.5rem',
            paddingRight: showToggle ? '2.5rem' : undefined,
            borderColor: error ? 'rgba(248,113,113,0.6)' : undefined,
          }}
        />
        {showToggle && (
          <button type="button" onClick={onToggle}
            className="absolute flex items-center" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: 'var(--accent-red)' }}>
          <FiAlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', mobileNumber: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())                                     e.fullName = 'Full name is required';
    if (!form.mobileNumber || !/^\d{10}$/.test(form.mobileNumber)) e.mobileNumber = 'Enter valid 10-digit mobile number';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))          e.email = 'Enter valid email address';
    if (!form.password || form.password.length < 6)                e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)                    e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 gradient-bg">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-emerald))', boxShadow: '0 8px 32px var(--glow-strong)' }}>
            <GiPlantRoots className="text-black text-3xl" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Join the AI Agriculture Platform</p>
        </div>

        <div className="glass rounded-2xl p-8" style={{ border: '1px solid var(--border-strong)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={FiUser}  label="Full Name"        name="fullName"        type="text"  value={form.fullName}        onChange={set} error={errors.fullName} />
            <Field icon={FiPhone} label="Mobile Number"    name="mobileNumber"    type="tel"   value={form.mobileNumber}    onChange={set} error={errors.mobileNumber} />
            <Field icon={FiMail}  label="Email Address"    name="email"           type="email" value={form.email}           onChange={set} error={errors.email} />
            <Field icon={FiLock}  label="Password"         name="password"                     value={form.password}        onChange={set} error={errors.password}        showToggle showPw={showPw} onToggle={() => setShowPw(v => !v)} />
            <Field icon={FiLock}  label="Confirm Password" name="confirmPassword"               value={form.confirmPassword} onChange={set} error={errors.confirmPassword} showToggle showPw={showPw} onToggle={() => setShowPw(v => !v)} />

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2"><FiCheck /> Create Account</span>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--accent-green)' }}>Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
