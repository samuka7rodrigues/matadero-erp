import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { Building2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { listDepartamentosCompleto } from '@/actions/departamentos';
import { DepartamentoActions } from '@/components/departamentos/departamento-actions';

export default async function DepartamentosPage() {
  const t = await getTranslations('Departamento');
  const supabase = createClient();

  const departamentos = await listDepartamentosCompleto();

  // Contar colaboradores por departamento
  const { data: counts } = await supabase
    .from('colaboradores')
    .select('departamento_id')
    .eq('estado', 'ativo')
    .is('deleted_at', null);

  const countByDept: Record<string, number> = {};
  (counts || []).forEach((f: any) => {
    if (f.departamento_id) {
      countByDept[f.departamento_id] = (countByDept[f.departamento_id] || 0) + 1;
    }
  });

  // Permissões: apenas admin/rh gerem departamentos
  let podeGerir = false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: utilizador } = await supabase
      .from('utilizadores')
      .select('role')
      .eq('user_id', user.id)
      .single();
    podeGerir = !!utilizador && ['admin', 'rh'].includes(utilizador.role);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          </div>
          {podeGerir && (
            <Button asChild>
              <Link href="/departamentos/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('new')}
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('list')}</CardTitle>
          </CardHeader>
          <CardContent>
            <MostrarTodos count={departamentos.length}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departamentos.map((d) => (
                  <Card key={d.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{d.nombre}</CardTitle>
                        <div className="flex items-center gap-2">
                          {!d.activo && (
                            <Badge variant="secondary">{t('inactivo')}</Badge>
                          )}
                          <Badge variant="outline">{d.codigo}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {d.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {d.descripcion}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{t('colaboradores')}:</span>
                          <span className="font-semibold">
                            {countByDept[d.id] || 0}
                          </span>
                        </div>
                        {podeGerir && <DepartamentoActions id={d.id} />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </MostrarTodos>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
