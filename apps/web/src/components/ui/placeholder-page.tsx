/**
 * Página placeholder reutilizável para módulos em desenvolvimento.
 * Mostra o título, ícone e uma mensagem "Em breve" / "Próximamente".
 */
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppShell } from '@/components/app-shell';
import type { LucideIcon } from 'lucide-react';

interface Props {
  titleKey: string;
  description?: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ titleKey, description, icon: Icon }: Props) {
  const tCommon = useTranslations('Common');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{titleKey}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">{tCommon('soon')}</CardTitle>
            <CardDescription>{tCommon('underDevelopment')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Este módulo está planeado para versões futuras.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}