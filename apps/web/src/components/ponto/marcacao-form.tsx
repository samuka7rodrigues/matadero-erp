'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatInTimeZone } from 'date-fns-tz';
import { es, ptBR } from 'date-fns/locale';
import {
  LogIn,
  LogOut,
  Coffee,
  PlayCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createMarcacao, type Marcacao, type TipoMarcacao } from '@/actions/ponto';
import { TIMEZONE } from '@/lib/ponto';
import type { LucideIcon } from 'lucide-react';

interface MarcacaoFormProps {
  marcacoesHoje: Marcacao[];
}

const TIPO_CONFIG: Record<TipoMarcacao, { icon: LucideIcon; variant: 'default' | 'success' | 'warning' | 'secondary' }> = {
  entrada: { icon: LogIn, variant: 'success' },
  saida: { icon: LogOut, variant: 'default' },
  inicio_almoco: { icon: Coffee, variant: 'warning' },
  volta_almoco: { icon: PlayCircle, variant: 'secondary' },
};

/** Próxima marcação sugerida numa jornada normal. */
function proximaSugerida(ultima?: Marcacao): TipoMarcacao {
  if (!ultima) return 'entrada';
  switch (ultima.tipo) {
    case 'entrada':
      return 'inicio_almoco';
    case 'inicio_almoco':
      return 'volta_almoco';
    case 'volta_almoco':
      return 'saida';
    case 'saida':
      return 'entrada';
  }
}

export function MarcacaoForm({ marcacoesHoje }: MarcacaoFormProps) {
  const t = useTranslations('Ponto');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const ultima = marcacoesHoje[marcacoesHoje.length - 1];
  const sugerida = proximaSugerida(ultima);

  const handleMarcar = (tipo: TipoMarcacao) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createMarcacao(tipo);
      if (!result.success) {
        setError(result.error || 'Erro desconhecido');
      } else {
        setSuccess(true);
      }
    });
  };

  const formatHora = (iso: string) =>
    formatInTimeZone(iso, TIMEZONE, 'HH:mm:ss', { locale: locale === 'es' ? es : ptBR });

  const formatTipo = (tipo: TipoMarcacao) => t(`tipo.${tipo}`);

  const buttons: { tipo: TipoMarcacao; icon: LucideIcon; labelKey: string }[] = [
    { tipo: 'entrada', icon: LogIn, labelKey: 'markEntry' },
    { tipo: 'inicio_almoco', icon: Coffee, labelKey: 'markLunchStart' },
    { tipo: 'volta_almoco', icon: PlayCircle, labelKey: 'markLunchEnd' },
    { tipo: 'saida', icon: LogOut, labelKey: 'markExit' },
  ];

  return (
    <div className="space-y-6">
      {/* Botões de marcação */}
      <Card>
        <CardHeader>
          <CardTitle>{t('markTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {buttons.map(({ tipo, icon: Icon, labelKey }) => (
              <Button
                key={tipo}
                onClick={() => handleMarcar(tipo)}
                disabled={isPending}
                variant={sugerida === tipo ? 'default' : 'outline'}
                className="h-20 flex-col gap-1"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="text-xs">{t(labelKey)}</span>
              </Button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive text-center">{error}</p>
          )}

          {success && !error && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-emerald-600 text-center">
              <CheckCircle2 className="h-4 w-4" />
              {t('messages.marcado')}
            </p>
          )}

          {ultima && (
            <p className="mt-3 text-xs text-muted-foreground text-center">
              {t('ultimaMarcacao')}: <strong>{formatTipo(ultima.tipo)}</strong> às{' '}
              <strong>{formatHora(ultima.data_hora)}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Histórico de hoje */}
      <Card>
        <CardHeader>
          <CardTitle>{t('todayHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {marcacoesHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('noMarcacoes')}
            </p>
          ) : (
            <div className="space-y-2">
              {marcacoesHoje.map((m) => {
                const cfg = TIPO_CONFIG[m.tipo];
                const Icon = cfg.icon;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border rounded-md p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatTipo(m.tipo)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatHora(m.data_hora)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{formatTipo(m.tipo)}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
