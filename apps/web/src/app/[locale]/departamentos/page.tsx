import { getTranslations } from 'next-intl/server';
import { Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MostrarTodos } from '@/components/common/mostrar-todos';

interface Departamento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export default async function DepartamentosPage() {
  const t = await getTranslations('Departamento');
  const supabase = createClient();

  const { data: departamentos } = await supabase
    .from('departamentos')
    .select('id, codigo, nombre, descripcion')
    .order('codigo');

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('list')}</CardTitle>
          </CardHeader>
          <CardContent>
            <MostrarTodos count={(departamentos as Departamento[] || []).length}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(departamentos as Departamento[] || []).map((d) => (
                <Card key={d.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{d.nombre}</CardTitle>
                      <Badge variant="outline">{d.codigo}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {d.descripcion && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {d.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Colaboradores:</span>
                      <span className="font-semibold">
                        {countByDept[d.id] || 0}
                      </span>
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