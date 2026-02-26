// ==============================================
// Sites Management Page — /dashboard/sites
// Like: resources/views/sites/index.blade.php in Laravel
//
// This page:
// 1. Shows "Add New Site" form at top
// 2. Lists all user's websites below
// 3. "Run Audit" button — triggers real audit with page limit selector
// 4. Delete button with confirmation
// 5. Protected — only logged-in users can access
//
// API calls:
// GET    /api/sites       — fetch all sites
// POST   /api/sites       — add new site
// DELETE /api/sites/:id   — remove site
// POST   /api/audits      — run audit on a site (NEW!)
// ==============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface Site {
  id: string;
  url: string;
  name: string;
  favicon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    audits: number;
  };
}

export default function SitesPage() {
  // ============ STATE VARIABLES ============
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Site form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Audit states — NEW!
  // auditSiteId = which site's audit panel is open
  // auditLoading = shows spinner while audit is running
  // auditMaxPages = how many pages to crawl (user selects)
  const [auditSiteId, setAuditSiteId] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMaxPages, setAuditMaxPages] = useState(10);
  const [auditProgress, setAuditProgress] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchSites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSites = async () => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const response = await api.get('/sites');
      setSites(response.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // ============ ADD NEW SITE ============
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setFormLoading(true);
    try {
      await api.post('/sites', { url, name });
      setName('');
      setUrl('');
      setShowForm(false);
      setSuccessMessage('Site added successfully!');
      await fetchSites();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add site.');
    } finally {
      setFormLoading(false);
    }
  };

  // ============ DELETE A SITE ============
  const handleDelete = async (siteId: string) => {
    setDeleteLoading(true);
    try {
      await api.delete('/sites/' + siteId);
      setDeleteId(null);
      await fetchSites();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete site');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============ RUN AUDIT — NEW! ============
  // When user clicks "Run Audit" → selects page count → starts crawling
  // Like: public function runAudit(Request $request) in Laravel
  const handleRunAudit = async (siteId: string) => {
    setAuditLoading(true);
    setAuditProgress('Starting audit...');

    try {
      // Show progress messages while waiting
      setTimeout(() => setAuditProgress('Crawling website...'), 1000);
      setTimeout(() => setAuditProgress('Analyzing pages...'), 3000);
      setTimeout(() => setAuditProgress('Checking SEO issues...'), 5000);

      // POST /api/audits — triggers the multi-page crawler
      // Like: $audit = AuditService::runAudit($siteId, $maxPages)
      const response = await api.post('/audits', {
        siteId: siteId,
        maxPages: auditMaxPages,
      });

      // Audit complete! Redirect to the report page
      // Like: return redirect('/dashboard/audits/' . $audit->id)
      router.push('/dashboard/audits/' + response.data.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Audit failed. Please try again.');
      setAuditSiteId(null);
    } finally {
      setAuditLoading(false);
      setAuditProgress('');
    }
  };

  // ============ LOGOUT ============
  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    router.push('/login');
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading sites...</p>
        </div>
      </div>
    );
  }

  // ============ PAGE UI ============
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ============ NAVIGATION BAR ============ */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">SEO Audit Tool</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/dashboard/sites" className="text-blue-600 font-semibold">My Sites</Link>
            <span className="text-gray-300">|</span>
            <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Logout</button>
          </div>
        </div>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ============ PAGE HEADER + ADD BUTTON ============ */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Websites</h2>
            <p className="text-gray-500 mt-1">{sites.length} {sites.length === 1 ? 'site' : 'sites'} added</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add Website'}
          </button>
        </div>

        {/* ============ SUCCESS MESSAGE ============ */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">{successMessage}</div>
        )}

        {/* ============ ADD SITE FORM ============ */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 border mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Website</h3>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{formError}</div>
            )}
            <form onSubmit={handleAddSite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="My Business Website" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL *</label>
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={formLoading} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {formLoading ? 'Adding...' : 'Add Website'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ============ SITES LIST ============ */}
        {sites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border text-center">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No websites added yet</h3>
            <p className="text-gray-500 mb-6">Add your first website to start auditing its SEO</p>
            <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">+ Add Your First Website</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div key={site.id} className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition">

                {/* ---- Site Header ---- */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{site.name}</h3>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{site.url}</a>
                  </div>
                  <span className={'px-2 py-1 text-xs rounded-full ' + (site.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {site.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* ---- Site Stats ---- */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Audits Run</p>
                    <p className="text-lg font-bold text-gray-900">{site._count.audits}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Added</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(site.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* ---- Action Buttons ---- */}
                <div className="flex gap-2">
                  {/* Run Audit — NOW CONNECTED! Opens page limit selector */}
                  <button
                    className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
                    onClick={() => {
                      setAuditSiteId(auditSiteId === site.id ? null : site.id);
                      setDeleteId(null);  // Close delete dialog if open
                    }}
                  >
                    Run Audit
                  </button>
                  {/* View past audits — links to audit history */}
                  {site._count.audits > 0 && (
                    <Link
                      href={'/dashboard/audits?siteId=' + site.id}
                      className="bg-green-50 text-green-700 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-green-100 transition"
                    >
                      History
                    </Link>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => { setDeleteId(site.id); setAuditSiteId(null); }}
                    className="bg-red-50 text-red-600 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>

                {/* ---- Audit Panel — Shows when "Run Audit" clicked ---- */}
                {/* Like: a dropdown panel with page count selector + start button */}
                {auditSiteId === site.id && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {auditLoading ? (
                      // Audit in progress — show spinner + progress
                      <div className="text-center py-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-blue-700 mt-2 font-medium">{auditProgress}</p>
                        <p className="text-xs text-blue-500 mt-1">This may take a few seconds...</p>
                      </div>
                    ) : (
                      // Audit options — select page count + start
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-3">How many pages to audit?</p>
                        {/* Page count selector — like radio buttons */}
                        <div className="flex gap-2 mb-3">
                          {[5, 10, 25, 50, 100].map((count) => (
                            <button
                              key={count}
                              onClick={() => setAuditMaxPages(count)}
                              className={'px-3 py-1.5 rounded-lg text-sm font-medium transition ' + (auditMaxPages === count ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100')}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-blue-600 mb-3">
                          {auditMaxPages <= 10 ? 'Quick scan — homepage + key pages' : auditMaxPages <= 25 ? 'Standard audit — covers main sections' : auditMaxPages <= 50 ? 'Deep audit — thorough analysis' : 'Full audit — comprehensive coverage'}
                        </p>
                        {/* Start Audit button */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRunAudit(site.id)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                          >
                            Start Audit ({auditMaxPages} pages)
                          </button>
                          <button
                            onClick={() => setAuditSiteId(null)}
                            className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition border border-blue-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---- Delete Confirmation ---- */}
                {deleteId === site.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 mb-2">Delete this site? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(site.id)} disabled={deleteLoading} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50">
                        {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button onClick={() => setDeleteId(null)} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
