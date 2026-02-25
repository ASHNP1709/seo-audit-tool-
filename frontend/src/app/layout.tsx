// ============================================
// Root Layout — Wraps every page in the app
// Like: resources/views/layouts/app.blade.php in Laravel
// Every page inherits this layout (HTML head, body, fonts)
// ============================================

import type { Metadata } from 'next';
import './globals.css';

// Metadata = sets <title> and <meta> tags for SEO
// Like: @section('title', 'SEO Audit Tool') in Blade
export const metadata: Metadata = {
  title: 'SEO Audit Tool — Comprehensive SEO Analysis',
  description: 'AI-Powered SEO Audit Platform',
};

// This function wraps ALL pages
// {children} = the page content that changes on each route
// Like: @yield('content') in Blade layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}