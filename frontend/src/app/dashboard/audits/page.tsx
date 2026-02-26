// ==============================================
// Audit History Page — /dashboard/audits?siteId=xxx
// Like: resources/views/audits/index.blade.php in Laravel
//
// Shows list of all past audits for a specific site
// Wrapped in Suspense because useSearchParams() requires it in Next.js 16
// ==============================================
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface Audit {
  id: string;
  status: string;
  overallScore: number | null;
  technicalScore: number | null;
  contentScore: number | null;
  speedScore: number | null;
  totalPages: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  duration: number | null;
  createdAt: string;
  _count: {
    issues: number;
    crawledPageData: number;
  };
}

// Separate component that uses useSearchParams
// Must be wrapped in Suspense — Next.js 16 requirement
function AuditHistoryContent() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');

  useEffect(() => {
    const fetchAudits = async () => {
      const token = Cookies.get('accessToken');
      if (!token) { router.push('/login'); return; }
      if (!siteId) { router.push('/dashboard/sites'); return; }

      try {
        const response = await api.get('/audits/site/' + siteId);
        setAudits(response.data);
      } catch {
        router.push('/dashboard/sites');
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (status === 'FAILED') return 'bg-red-100 text-red-700';
    if (status === 'CRAWLING' || status === 'ANALYZING') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading audits...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit History</h2>
          <p className="text-gray-500 mt-1">{audits.length} audit{audits.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link href="/dashboard/sites" className="text-blue-600 hover:underline font-medium">Back to Sites</Link>
      </div>

      {/* Audit List */}
      {audits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No audits yet</h3>
          <p className="text-gray-500 mb-6">Run your first audit from the Sites page</p>
          <Link href="/dashboard/sites" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-block">Go to Sites</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => (
            <Link
              key={audit.id}
              href={'/dashboard/audits/' + audit.id}
              className="block bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                {/* Left: Score + Status */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={'text-3xl font-bold ' + getScoreColor(audit.overallScore)}>
                      {audit.overallScore !== null ? audit.overallScore : '--'}
                    </p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={'px-2 py-0.5 text-xs rounded-full font-medium ' + getStatusStyle(audit.status)}>
                        {audit.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(audit.createdAt).toLocaleDateString()} at {new Date(audit.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {audit.totalPages} pages crawled | {audit.totalIssues} issues found
                      {audit.duration ? ' | ' + audit.duration + 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Right: Module Scores */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-center">
                    <p className={'text-lg font-bold ' + getScoreColor(audit.technicalScore)}>{audit.technicalScore !== null ? audit.technicalScore : '--'}</p>
                    <p className="text-xs text-gray-500">Technical</p>
                  </div>
                  <div className="text-center">
                    <p className={'text-lg font-bold ' + getScoreColor(audit.contentScore)}>{audit.contentScore !== null ? audit.contentScore : '--'}</p>
                    <p className="text-xs text-gray-500">Content</p>
                  </div>
                  <div className="text-center">
                    <p className={'text-lg font-bold ' + getScoreColor(audit.speedScore)}>{audit.speedScore !== null ? audit.speedScore : '--'}</p>
                    <p className="text-xs text-gray-500">Speed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{audit.criticalIssues + audit.highIssues}</p>
                    <p className="text-xs text-gray-500">Critical+High</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Main page component — wraps content in Suspense
// This is required by Next.js 16 when using useSearchParams()
export default function AuditHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">SEO Audit Tool</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/dashboard/sites" className="text-gray-600 hover:text-gray-900 transition">My Sites</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading...</p>
            </div>
          </div>
        }>
          <AuditHistoryContent />
        </Suspense>
      </main>
    </div>
  );
}
