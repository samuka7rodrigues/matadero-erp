import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './layout/sidebar';
import { Header } from './layout/header';
import { allowedMenuKeys } from '@/lib/navigation';
import type { RoleUtilizador } from '@/types/database';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obter role do utilizador
  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role, colaborador_id')
    .eq('user_id', user.id)
    .single();

  const role: RoleUtilizador = utilizador?.role || 'colaborador';

  // Permissões de menus: override individual (permissoes_menus) ou
  // padrão do perfil. Sem registo -> menus por defeito da role.
  const { data: perms } = await supabase
    .from('permissoes_menus')
    .select('menus')
    .eq('user_id', user.id)
    .maybeSingle();

  const menus = allowedMenuKeys(role, perms?.menus);

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <Sidebar allowedMenus={menus} />
      <div className="flex flex-1 flex-col">
        <Header user={user} allowedMenus={menus} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
