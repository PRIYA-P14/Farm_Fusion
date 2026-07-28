import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      login(res.data.token, res.data.user, form.remember);
      toast.success(`Welcome back, ${res.data.user.fullName}!`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await authAPI.googleLogin({ credential: credentialResponse.credential });
      login(res.data.token, res.data.user, true);
      toast.success(`Welcome, ${res.data.user.fullName}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Google sign-in failed';
      console.error('Google login error:', err.response?.data || err);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-bg">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-emerald))', boxShadow: '0 8px 32px var(--glow-strong)' }}>
            <GiPlantRoots className="text-black text-3xl" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Soil Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>AI-Powered Agriculture Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8" style={{ border: '1px solid var(--border-strong)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Sign In</h2>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--accent-red)' }}>
              <FiAlertCircle size={15} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
              <div className="relative">
              <span className="absolute flex items-center pointer-events-none" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><FiMail size={15} /></span>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="input-field" style={{ paddingLeft: '2.5rem' }} autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
              <span className="absolute flex items-center pointer-events-none" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><FiLock size={15} /></span>
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  className="input-field" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute flex items-center" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.remember} onChange={e => set('remember', e.target.checked)}
                className="w-4 h-4 rounded accent-green-500" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Remember me</span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => toast.error('Google sign-in failed')}
              theme="filled_black"
              shape="rectangular"
              text="signin_with"
              size="large"
            />
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--accent-green)' }}>Create Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
