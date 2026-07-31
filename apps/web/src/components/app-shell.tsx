import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { LocaleSwitcher } from './locale-switcher';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obter role do utilizador
  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role, funcionario_id')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <Sidebar role={utilizador?.role || 'funcionario'} />
      <div className="flex flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
