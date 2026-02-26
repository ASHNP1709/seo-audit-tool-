// ==============================================
// Dashboard Page - /dashboard (Protected)
// Like: resources/views/dashboard.blade.php in Laravel
//
// This page:
// 1. Checks if user is logged in (has JWT token in cookie)
// 2. Calls GET /api/auth/me to get user profile from backend
// 3. Calls GET /api/sites to get sites count
// 4. Shows user info + subscription plan + stats cards
// 5. If not logged in -> redirect to /login
// ==============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  avatar: string | null;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    auditsUsed: number;
  } | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sitesCount, setSitesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user profile AND sites count in parallel
        // Like: [$user, $sites] = [auth()->user(), auth()->user()->sites()->count()]
        const [userResponse, sitesResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/sites'),
        ]);
        setUser(userResponse.data);
        setSitesCount(sitesResponse.data.length);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    router.push('/login');
  };

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">SEO Audit Tool</h1>
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <Link href="/dashboard" className="text-blue-600 font-semibold">
              Dashboard
            </Link>
            <Link href="/dashboard/sites" className="text-gray-600 hover:text-gray-900 transition">
              My Sites
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">
              Welcome, <strong>{user.firstName}</strong>
            </span>
            <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
              Logout
            </button>
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

        {/* Stats Cards - 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Plan Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{user.subscription?.plan || 'FREE'}</p>
            <p className="text-xs text-gray-400 mt-1">{user.subscription?.status || 'ACTIVE'}</p>
          </div>

          {/* Websites Added Card — NEW! Links to sites page */}
          <Link href="/dashboard/sites" className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition">
            <p className="text-sm text-gray-500">Websites Added</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{sitesCount}</p>
            <p className="text-xs text-blue-500 mt-1">Click to manage sites</p>
          </Link>

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

        {/* Quick Actions — NOW WITH WORKING LINKS */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Add Website — links to sites page */}
            <Link
              href="/dashboard/sites"
              className="bg-blue-50 text-blue-700 p-4 rounded-lg text-left hover:bg-blue-100 transition block"
            >
              <p className="font-semibold">+ Add Website</p>
              <p className="text-sm text-blue-500 mt-1">{sitesCount} sites added</p>
            </Link>

            {/* Run Audit — coming soon */}
            <button className="bg-green-50 text-green-700 p-4 rounded-lg text-left hover:bg-green-100 transition">
              <p className="font-semibold">Run New Audit</p>
              <p className="text-sm text-green-500 mt-1">Coming soon</p>
            </button>

            {/* View Reports — coming soon */}
            <button className="bg-purple-50 text-purple-700 p-4 rounded-lg text-left hover:bg-purple-100 transition">
              <p className="font-semibold">View Reports</p>
              <p className="text-sm text-purple-500 mt-1">Coming soon</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
