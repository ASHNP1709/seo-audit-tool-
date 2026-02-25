// ==============================================
// Login Page - /login
// Like: resources/views/auth/login.blade.php in Laravel
//
// Protection: If user is ALREADY logged in, redirect to dashboard
// Like: Route::middleware('guest')->get('/login', ...)
// ==============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // checkingAuth = shows spinner while we verify if user is already logged in
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // GUEST MIDDLEWARE - redirect logged-in users to dashboard
  // Like: if (Auth::check()) return redirect('/dashboard')
  // Runs BEFORE showing the login form
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          // Verify token is still valid
          await api.get('/auth/me');
          // Valid token = already logged in -> go to dashboard
          router.push('/dashboard');
          return;
        } catch {
          // Token expired/invalid -> clear it, show login page
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
        }
      }
      // No token or invalid -> show login page
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      Cookies.set('accessToken', response.data.accessToken, { expires: 1 });
      Cookies.set('refreshToken', response.data.refreshToken, { expires: 7 });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth
  // Like: middleware runs BEFORE the page renders
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Audit Tool</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@completeseoaudit.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Do not have an account?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}