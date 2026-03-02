import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|hi)/:path*', '/((?!_next|favicon\\.ico|api).*)'],
};
