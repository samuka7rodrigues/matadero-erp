import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './layout/sidebar';
import { Header } from './layout/header';

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

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <Sidebar role={utilizador?.role || 'colaborador'} />
      <div className="flex flex-1 flex-col">
        <Header user={user} role={utilizador?.role || 'colaborador'} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
