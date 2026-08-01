import { getTranslations } from 'next-intl/server';
import { UserCircle2, Mail, Phone, Shield, Clock, CalendarDays } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PerfilForm } from '@/components/perfil/perfil-form';
import { getMeuPerfil } from '@/actions/utilizadores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function PerfilPage() {
  const t = await getTranslations('Perfil');
  const perfil = await getMeuPerfil();

  const nome =
    perfil?.nome_completo ||
    [perfil?.colaboradores?.nombre, perfil?.colaboradores?.apellido1, perfil?.colaboradores?.apellido2]
      .filter(Boolean)
      .join(' ') ||
    '—';

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              {nome}
            </CardTitle>
            <CardDescription>
              <Badge variant="secondary">{perfil ? t(`roles.${perfil.role}`) : '—'}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('email')}</p>
                <p className="text-sm font-medium">{perfil?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t('telefone')}</p>
                <PerfilForm telefoneAtual={perfil?.telefone || null} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('role')}</p>
                <p className="text-sm font-medium">{perfil ? t(`roles.${perfil.role}`) : '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('ultimoAcesso')}</p>
                <p className="text-sm font-medium">
                  {perfil?.ultimo_acesso
                    ? new Date(perfil.ultimo_acesso).toLocaleString()
                    : t('nunca')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('criadoEm')}</p>
                <p className="text-sm font-medium">
                  {perfil?.created_at ? new Date(perfil.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('estado')}</p>
                <Badge variant={perfil?.ativo ? 'success' : 'destructive'}>
                  {perfil?.ativo ? t('ativo') : t('inativo')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
