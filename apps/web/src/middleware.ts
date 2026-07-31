import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/request';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * Rotas públicas (sem auth) que NÃO devem ter Cache-Control: no-store.
 * Tudo o resto sob /[locale]/* é considerado protegido.
 */
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

function isPublicPath(pathname: string): boolean {
  // Remove o prefixo do locale: /pt-BR/login -> /login
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return true; // raiz
  const route = `/${segments.slice(1).join('/')}`;
  return PUBLIC_PATHS.some((p) => route === p || route.startsWith(p + '/'));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Primeiro, aplica o middleware do next-intl (lida com locale prefix e redirects)
  const response = intlMiddleware(request);

  // Depois, adiciona Cache-Control: no-store em rotas protegidas
  // para evitar que o browser mostre uma página stale ao clicar "voltar"
  // e force o utilizador a revalidar a sessão (=> não parece um logout mágico).
  if (!isPublicPath(pathname)) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  // Matcher do next-intl: tudo exceto api, _next, ficheiros estáticos
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};