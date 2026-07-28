'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await login(username.trim(), password);

      if (res.success && res.data) {
        // Successful login: redirect based on server-verified role payload
        if (res.data.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } else {
        setErrorMessage(res.error?.message || 'Invalid credentials. Please try again.');
      }
    } catch (e: any) {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end px-4 text-text-dark-primary">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#E8B84A]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#4DA8FF]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Top Brand Logo */}
      <Link href="/" className="flex items-center space-x-3 mb-8 group">
        <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-gold-glow text-navy-start font-bold font-display text-2xl">
          π
        </div>
        <div className="text-left">
          <span className="font-display font-bold text-2xl text-text-dark-primary tracking-wide block">
            New Pi Classes
          </span>
          <span className="text-xs text-gold tracking-widest font-mono uppercase block -mt-1">
            Student & Admin Portal
          </span>
        </div>
      </Link>

      {/* Heavy Glass Auth Card */}
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 border-white/20 shadow-glass">
        <h1 className="font-display font-bold text-2xl text-center mb-2 text-text-dark-primary">
          Portal Sign In
        </h1>
        <p className="text-xs text-text-dark-secondary text-center mb-6">
          Access your study materials, online tests, AI tutor, and results.
        </p>

        {errorMessage && (
          <div className="p-3.5 rounded-lg mb-6 bg-rose/20 border border-rose/50 text-rose text-xs font-semibold leading-relaxed">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-text-dark-secondary mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. npcrahu2601 or admin"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-text-dark-primary text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-text-dark-secondary/40 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-dark-secondary mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-text-dark-primary text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-text-dark-secondary/40"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold w-full text-sm py-3.5 mt-2 font-semibold shadow-gold-glow disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-text-dark-secondary">
          <p>Enrolled student without login details?</p>
          <p className="mt-1 text-gold font-mono">Contact NPC Sheohar office for account credentials.</p>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-text-dark-secondary">
        <Link href="/" className="hover:text-text-dark-primary transition-colors">
          ← Back to Public Website
        </Link>
      </div>
    </div>
  );
}
