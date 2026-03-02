import { redirect } from '@/i18n/navigation';

export default function RootPage() {
  redirect({ href: '/login', locale: 'en' });
}
