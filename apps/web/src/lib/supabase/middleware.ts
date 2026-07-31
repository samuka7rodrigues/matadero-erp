import { createMiddlewareClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/request';

/**
 * Actualiza a sessão do Supabase e redireciona.
 * Usado no middleware para refrescar tokens automaticamente.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createMiddlewareClient({
    request,
    response,
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redireciona para /login se tentar aceder a área protegida sem auth
  const publicPaths = ['/login', '/forgot-password', '/'];
  const isPublicPath = publicPaths.some((p) => pathname.endsWith(p)) ||
    locales.some((l) => pathname.endsWith(`/${l}`));

  if (!user && !isPublicPath) {
    const locale = pathname.split('/')[1] || defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return response;
}
