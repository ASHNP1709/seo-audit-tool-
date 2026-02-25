// ==============================================
// Dashboard Page - /dashboard (Protected)
// Like: resources/views/dashboard.blade.php in Laravel
//
// This page:
// 1. Checks if user is logged in (has JWT token in cookie)
// 2. Calls GET /api/auth/me to get user profile from backend
// 3. Shows user info + subscription plan + stats cards
// 4. If not logged in -> redirect to /login
//
// This is a protected page - only logged-in users can see it
// Like: Route::middleware('auth')->get('/dashboard', ...)
// ==============================================
'use client';

// useEffect = runs code when page loads (like mounted() in Vue)
// Like: public function __construct() or boot() in Laravel
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

// TypeScript interface = defines the shape of user data
// Like: a PHP class or Laravel API Resource
// This tells TypeScript exactly what fields the user object has
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;  // null = field can be empty
  role: string;
  avatar: string | null;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    auditsUsed: number;
  } | null;  // null = user might not have subscription
}

export default function DashboardPage() {
  // User state - starts as null (not loaded yet)
  const [user, setUser] = useState<User | null>(null);
  // Loading state - shows spinner while fetching
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // useEffect with [] = runs ONCE when page loads
  // Like: mounted() { this.fetchUser() } in Vue
  // Like: public function index() { $user = auth()->user(); } in Laravel
  useEffect(() => {
    const fetchProfile = async () => {
      // Check if token exists in cookies
      const token = Cookies.get('accessToken');

      if (!token) {
        // No token = not logged in -> redirect to login
        // Like: if (!Auth::check()) return redirect('/login')
        router.push('/login');
        return;
      }

      try {
        // Call our NestJS backend: GET /api/auth/me
        // The JWT token is automatically attached by our api interceptor (lib/api.ts)
        // Like: $user = auth()->user() in Laravel
        const response = await api.get('/auth/me');
        // Save user data in state - triggers re-render with user info
        setUser(response.data);
      } catch {
        // Token invalid or expired -> clear cookies and redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        router.push('/login');
      } finally {
        // Stop loading spinner
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);
  // [router] = dependency array - re-runs if router changes (rarely)

  // Logout function - clears tokens and redirects to login
  // Like: Auth::logout() in Laravel
  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    router.push('/login');
  };

  // Show loading spinner while fetching user data
  // Like: @if($loading) <div>Loading...</div> @endif in Blade
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Safety check - if no user data somehow
  if (!user) return null;

  // Dashboard UI - only shows when user is loaded
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Navigation Bar */}
      {/* Like: @include('partials.navbar') in Blade */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">SEO Audit Tool</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, <strong>{user.firstName}</strong></span>
            {/* onClick = when button is clicked, call handleLogout */}
            {/* Like: <form method="POST" action="/logout"> in Blade */}
            <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h2>
          <p className="text-gray-500 mt-1">Here is your SEO audit dashboard</p>
        </div>

        {/* Stats Cards - 4 cards in a responsive grid */}
        {/* grid-cols-1 = 1 column on mobile */}
        {/* md:grid-cols-2 = 2 columns on tablet */}
        {/* lg:grid-cols-4 = 4 columns on desktop */}
        {/* Like: @foreach($stats as $stat) <div class="card"> in Blade */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Plan Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Current Plan</p>
            {/* ?. = optional chaining - if subscription is null, returns undefined */}
            {/* || 'FREE' = fallback value if undefined */}
            {/* Like: $user->subscription->plan ?? 'FREE' in PHP */}
            <p className="text-2xl font-bold text-blue-600 mt-1">{user.subscription?.plan || 'FREE'}</p>
            <p className="text-xs text-gray-400 mt-1">{user.subscription?.status || 'ACTIVE'}</p>
          </div>

          {/* Audits Used Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Audits Used</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{user.subscription?.auditsUsed || 0} / 5</p>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </div>

          {/* Account Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Account Status</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Active</p>
            <p className="text-xs text-gray-400 mt-1">Email {user.isVerified ? 'Verified' : 'Not verified'}</p>
          </div>

          {/* Role Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{user.role}</p>
            {/* new Date().toLocaleDateString() = formats date nicely */}
            {/* Like: Carbon::parse($date)->format('M d, Y') in Laravel */}
            <p className="text-xs text-gray-400 mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="text-gray-900 font-medium">{user.firstName} {user.lastName || ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="text-gray-900 font-medium text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">2FA Status</p>
              <p className="text-gray-900 font-medium">{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - buttons for future features */}
        {/* These will be connected to actual functionality later */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-50 text-blue-700 p-4 rounded-lg text-left hover:bg-blue-100 transition">
              <p className="font-semibold">Run New Audit</p>
              <p className="text-sm text-blue-500 mt-1">Coming soon</p>
            </button>
            <button className="bg-green-50 text-green-700 p-4 rounded-lg text-left hover:bg-green-100 transition">
              <p className="font-semibold">View Reports</p>
              <p className="text-sm text-green-500 mt-1">Coming soon</p>
            </button>
            <button className="bg-purple-50 text-purple-700 p-4 rounded-lg text-left hover:bg-purple-100 transition">
              <p className="font-semibold">Settings</p>
              <p className="text-sm text-purple-500 mt-1">Coming soon</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
