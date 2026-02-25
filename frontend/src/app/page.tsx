// ============================================
// Homepage — / (root)
// Like: resources/views/welcome.blade.php in Laravel
// This redirects to login or dashboard
// ============================================

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login page
  // Like: Route::get('/', fn() => redirect('/login'))
  redirect('/login');
}