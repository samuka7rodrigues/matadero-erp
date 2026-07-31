import { createClient as createServerClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase de Admin (service role).
 * ⚠️ APENAS para uso no servidor e em casos muito específicos (webhooks, migrations).
 * NUNCA expor ao cliente.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
