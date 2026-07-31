import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/request';

/**
 * Actualiza a sessão do Supabase e redireciona.
 * Usado no middleware para refrescar tokens automaticamente.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // A partir do @supabase/ssr@0.5.x, createMiddlewareClient foi removido.
  // Usa-se createServerClient com cookies getAll/setAll (Next.js 14+).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Detecta o locale atual (primeiro segmento da URL)
  const localeInPath = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
  const pathnameWithoutLocale = pathname.replace(`/${localeInPath}`, '') || '/';

  // Rotas públicas (sem precisar de auth)
  const publicPaths = ['/', '/login', '/forgot-password'];
  const isPublicPath = publicPaths.includes(pathnameWithoutLocale);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeInPath}/login`;
    return NextResponse.redirect(url);
  }

  return response;
}
