import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const isEmail = identifier.includes('@');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = isEmail
        ? await login(identifier, password)
        : await login(identifier, password, 'regNo');
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.message || 'Wrong email/reg no or password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="login-blob w-[480px] h-[480px] rounded-full bg-violet-300/60 -top-24 -left-24 animate-blob" style={{ animationDelay: '0s' }} />
      <div className="login-blob w-[360px] h-[360px] rounded-full bg-sky-200/70 top-[30%] -right-20 animate-blob" style={{ animationDelay: '3s' }} />
      <div className="login-blob w-[300px] h-[300px] rounded-full bg-pink-200/60 -bottom-16 left-[25%] animate-blob" style={{ animationDelay: '6s' }} />
      <div className="login-blob w-[200px] h-[200px] rounded-full bg-blue-200/50 bottom-[20%] right-[10%] animate-blob" style={{ animationDelay: '2s' }} />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Card */}
      <div className={`w-full max-w-[420px] px-2 sm:px-0 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Brand badge — logo + name */}
        <div className="flex justify-center mb-7">
          <div className="flex items-center gap-3 bg-white/75 backdrop-blur-md border border-white/85 px-5 py-3 rounded-2xl shadow-xl shadow-violet-100/40 cursor-default group hover:shadow-violet-200/50 transition-all duration-300">
            {/* Logo circle with white bg to handle transparent parts */}
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300 border border-slate-100">
              <img src="/vjtha-logo.png" alt="Vjtha Learning" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">Vjtha Learning</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">The Winners World</p>
            </div>
          </div>
        </div>

        {/* Glass login card */}
        <div className="login-card rounded-3xl p-5 sm:p-8">

          {/* Heading — no emoji */}
          <div className="text-center mb-7">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 text-sm font-medium">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Reg No */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-bold text-slate-600 tracking-widest uppercase">
                Reg No
              </Label>
              <div className={`relative transition-all duration-200 ${focused === 'id' ? 'scale-[1.01]' : ''}`}>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="e.g. 21CS001"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onFocus={() => setFocused('id')}
                  onBlur={() => setFocused(null)}
                  required
                  autoComplete="username"
                  className="h-12 rounded-xl bg-white/85 border-slate-200 text-slate-700 placeholder:text-slate-300
                    font-medium text-sm px-4
                    focus:border-violet-400 focus:ring-4 focus:ring-violet-100/80 focus:bg-white
                    transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-600 tracking-widest uppercase">
                Password
              </Label>
              <div className={`relative transition-all duration-200 ${focused === 'pw' ? 'scale-[1.01]' : ''}`}>
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused(null)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl bg-white/85 border-slate-200 text-slate-700 placeholder:text-slate-300
                    font-medium text-sm px-4 pr-12
                    focus:border-violet-400 focus:ring-4 focus:ring-violet-100/80 focus:bg-white
                    transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-violet-500 transition-colors p-0.5"
                  tabIndex={-1}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="animate-scale-in flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl font-extrabold text-sm text-white
                bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500
                shadow-lg shadow-violet-200/70
                hover:shadow-violet-300/90 hover:-translate-y-0.5
                active:translate-y-0 active:shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-4 focus:ring-violet-200
                flex items-center justify-center gap-2">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400/80 mt-5 font-semibold tracking-wide">
          Secure · Encrypted · Private
        </p>
      </div>
    </div>
  );
}
