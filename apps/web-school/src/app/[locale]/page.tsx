import { redirect } from 'next/navigation';

// Root page redirects to dashboard; the (dashboard) layout handles auth checks
export default function RootPage() {
  // Next.js route groups: (dashboard)/page.tsx serves the actual dashboard UI.
  // This file only exists as a fallback; redirect to login for unauthenticated visitors.
  // The dashboard layout will redirect back to login if not authenticated.
  redirect('/en/login');
}
