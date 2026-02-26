// ==============================================
// Audit Report Page — /dashboard/audits/[id]
// Like: resources/views/audits/show.blade.php in Laravel
//
// This page shows the full audit report:
// 1. Overall score + module scores
// 2. Summary stats (pages crawled, issues found)
// 3. Issues list grouped by severity
// 4. Crawled pages list with details
//
// [id] = dynamic route — Next.js passes the audit ID from URL
// Like: Route::get('/audits/{id}', [AuditController::class, 'show'])
// ==============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface AuditReport {
  id: string;
  status: string;
  overallScore: number | null;
  technicalScore: number | null;
  contentScore: number | null;
  speedScore: number | null;
  totalPages: number;
  crawledPages: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  duration: number | null;
  createdAt: string;
  completedAt: string | null;
  site: {
    id: string;
    name: string;
    url: string;
  };
  issues: {
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    url: string | null;
    recommendation: string | null;
  }[];
  crawledPageData: {
    id: string;
    url: string;
    statusCode: number;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    wordCount: number;
    loadTime: number;
    totalImages: number;
    missingAlt: number;
    internalLinks: number;
    externalLinks: number;
    depth: number;
  }[];
}

export default function AuditReportPage() {
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  // activeTab = which section is shown (issues, pages, or summary)
  const [activeTab, setActiveTab] = useState('summary');
  const router = useRouter();
  // useParams gets the [id] from the URL
  // Like: $id = $request->route('id') in Laravel
  const params = useParams();
  const auditId = params.id as string;

  useEffect(() => {
    const fetchAudit = async () => {
      const token = Cookies.get('accessToken');
      if (!token) { router.push('/login'); return; }

      try {
        // GET /api/audits/:id — get full audit report
        // Like: Audit::with(['issues', 'crawledPages'])->findOrFail($id)
        const response = await api.get('/audits/' + auditId);
        setAudit(response.data);
      } catch {
        router.push('/dashboard/sites');
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ HELPER FUNCTIONS ============
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getSeverityStyle = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-200';
    if (severity === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (severity === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (severity === 'LOW') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryStyle = (category: string) => {
    if (category === 'TECHNICAL') return 'bg-purple-100 text-purple-700';
    if (category === 'CONTENT') return 'bg-blue-100 text-blue-700';
    if (category === 'SPEED') return 'bg-orange-100 text-orange-700';
    if (category === 'UX') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading audit report...</p>
        </div>
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============ NAVIGATION ============ */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">SEO Audit Tool</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/dashboard/sites" className="text-gray-600 hover:text-gray-900 transition">My Sites</Link>
            <span className="text-gray-300">|</span>
            <button onClick={() => { Cookies.remove('accessToken'); Cookies.remove('refreshToken'); router.push('/login'); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ============ HEADER: Site Info + Date ============ */}
        <div className="mb-6">
          <Link href={'/dashboard/audits?siteId=' + audit.site.id} className="text-blue-600 hover:underline text-sm mb-2 inline-block">Back to Audit History</Link>
          <h2 className="text-2xl font-bold text-gray-900">{audit.site.name}</h2>
          <p className="text-gray-500">{audit.site.url} | Audited on {new Date(audit.createdAt).toLocaleDateString()} at {new Date(audit.createdAt).toLocaleTimeString()}
            {audit.duration ? ' | Duration: ' + audit.duration + 's' : ''}</p>
        </div>

        {/* ============ SCORE CARDS ============ */}
        {/* Like: 4 dashboard cards showing scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Overall Score — big prominent card */}
          <div className={'rounded-xl p-6 border text-center ' + getScoreBg(audit.overallScore)}>
            <p className="text-sm text-gray-600 mb-1">Overall Score</p>
            <p className={'text-4xl font-bold ' + getScoreColor(audit.overallScore)}>
              {audit.overallScore !== null ? audit.overallScore : '--'}
            </p>
            <p className="text-xs text-gray-500 mt-1">out of 100</p>
          </div>
          {/* Technical Score */}
          <div className={'rounded-xl p-6 border text-center ' + getScoreBg(audit.technicalScore)}>
            <p className="text-sm text-gray-600 mb-1">Technical</p>
            <p className={'text-3xl font-bold ' + getScoreColor(audit.technicalScore)}>
              {audit.technicalScore !== null ? audit.technicalScore : '--'}
            </p>
          </div>
          {/* Content Score */}
          <div className={'rounded-xl p-6 border text-center ' + getScoreBg(audit.contentScore)}>
            <p className="text-sm text-gray-600 mb-1">Content</p>
            <p className={'text-3xl font-bold ' + getScoreColor(audit.contentScore)}>
              {audit.contentScore !== null ? audit.contentScore : '--'}
            </p>
          </div>
          {/* Speed Score */}
          <div className={'rounded-xl p-6 border text-center ' + getScoreBg(audit.speedScore)}>
            <p className="text-sm text-gray-600 mb-1">Speed</p>
            <p className={'text-3xl font-bold ' + getScoreColor(audit.speedScore)}>
              {audit.speedScore !== null ? audit.speedScore : '--'}
            </p>
          </div>
        </div>

        {/* ============ STATS ROW ============ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-gray-900">{audit.totalPages}</p>
            <p className="text-xs text-gray-500">Pages Crawled</p>
          </div>
          <div className="bg-white rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-gray-900">{audit.totalIssues}</p>
            <p className="text-xs text-gray-500">Total Issues</p>
          </div>
          <div className="bg-white rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-red-600">{audit.criticalIssues}</p>
            <p className="text-xs text-gray-500">Critical</p>
          </div>
          <div className="bg-white rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-orange-600">{audit.highIssues}</p>
            <p className="text-xs text-gray-500">High</p>
          </div>
          <div className="bg-white rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-yellow-600">{audit.totalIssues - audit.criticalIssues - audit.highIssues}</p>
            <p className="text-xs text-gray-500">Medium/Low</p>
          </div>
        </div>

        {/* ============ TABS: Summary | Issues | Pages ============ */}
        {/* Like: Bootstrap nav-tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border inline-flex">
          {['summary', 'issues', 'pages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={'px-5 py-2 rounded-md text-sm font-medium transition ' + (activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              {tab === 'summary' ? 'Summary' : tab === 'issues' ? 'Issues (' + audit.issues.length + ')' : 'Pages (' + audit.crawledPageData.length + ')'}
            </button>
          ))}
        </div>

        {/* ============ TAB CONTENT ============ */}

        {/* --- SUMMARY TAB --- */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Issues by Severity */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h3>
              <div className="space-y-3">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((severity) => {
                  const count = audit.issues.filter((i) => i.severity === severity).length;
                  if (count === 0) return null;
                  return (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={'px-2 py-0.5 text-xs rounded font-medium border ' + getSeverityStyle(severity)}>{severity}</span>
                        <span className="text-sm text-gray-600">{count} issue{count !== 1 ? 's' : ''}</span>
                      </div>
                      {/* Simple bar chart */}
                      <div className="w-48 bg-gray-100 rounded-full h-2">
                        <div className={'h-2 rounded-full ' + (severity === 'CRITICAL' ? 'bg-red-500' : severity === 'HIGH' ? 'bg-orange-500' : severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500')} style={{ width: Math.min(100, (count / Math.max(audit.totalIssues, 1)) * 100) + '%' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issues by Category */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['TECHNICAL', 'CONTENT', 'SPEED', 'UX'].map((category) => {
                  const count = audit.issues.filter((i) => i.category === category).length;
                  return (
                    <div key={category} className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className={'text-xs font-medium mt-1 px-2 py-0.5 rounded inline-block ' + getCategoryStyle(category)}>{category}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- ISSUES TAB --- */}
        {activeTab === 'issues' && (
          <div className="space-y-3">
            {audit.issues.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-lg font-semibold text-green-600">No issues found! Great SEO!</p>
              </div>
            ) : (
              audit.issues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-xl p-5 border hover:shadow-sm transition">
                  <div className="flex items-start gap-3">
                    {/* Severity + Category badges */}
                    <div className="flex flex-col gap-1">
                      <span className={'px-2 py-0.5 text-xs rounded font-medium border ' + getSeverityStyle(issue.severity)}>{issue.severity}</span>
                      <span className={'px-2 py-0.5 text-xs rounded font-medium ' + getCategoryStyle(issue.category)}>{issue.category}</span>
                    </div>
                    {/* Issue details */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                      {issue.recommendation && (
                        <p className="text-sm text-blue-700 mt-2 bg-blue-50 px-3 py-2 rounded">
                          <strong>Fix:</strong> {issue.recommendation}
                        </p>
                      )}
                      {issue.url && (
                        <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">{issue.url}</a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- PAGES TAB --- */}
        {activeTab === 'pages' && (
          <div className="space-y-3">
            {audit.crawledPageData.map((page) => (
              <div key={page.id} className="bg-white rounded-xl p-5 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{page.title || 'No title'}</h4>
                    <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{page.url}</a>
                  </div>
                  <span className={'px-2 py-1 text-xs rounded-full font-medium ' + (page.statusCode === 200 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {page.statusCode}
                  </span>
                </div>
                {/* Page stats grid */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-sm font-bold text-gray-900">{page.wordCount}</p>
                    <p className="text-xs text-gray-500">Words</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-sm font-bold text-gray-900">{page.loadTime}ms</p>
                    <p className="text-xs text-gray-500">Load Time</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-sm font-bold text-gray-900">{page.totalImages}</p>
                    <p className="text-xs text-gray-500">Images</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className={'text-sm font-bold ' + (page.missingAlt > 0 ? 'text-red-600' : 'text-green-600')}>{page.missingAlt}</p>
                    <p className="text-xs text-gray-500">Missing Alt</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-sm font-bold text-gray-900">{page.internalLinks}</p>
                    <p className="text-xs text-gray-500">Internal Links</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-sm font-bold text-gray-900">{page.externalLinks}</p>
                    <p className="text-xs text-gray-500">External Links</p>
                  </div>
                </div>
                {page.metaDescription && (
                  <p className="text-xs text-gray-500 mt-2 truncate">Meta: {page.metaDescription}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
