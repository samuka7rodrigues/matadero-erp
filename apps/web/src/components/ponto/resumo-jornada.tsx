import { getTranslations } from 'next-intl/server';
import { Clock, TimerReset, Moon, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResumoJornada } from '@/actions/ponto';

interface ResumoJornadaProps {
  resumo: ResumoJornada | null;
}

function formatHoras(value: number): string {
  const h = Math.floor(value);
  const min = Math.round((value - h) * 60);
  return min > 0 ? `${h}h ${min.toString().padStart(2, '0')}min` : `${h}h`;
}

export async function ResumoJornadaCard({ resumo }: ResumoJornadaProps) {
  const t = await getTranslations('Ponto');

  if (!resumo) return null;

  const total = resumo.horas_ordinarias + resumo.horas_extras;
  const stats = [
    { key: 'horasOrdinarias', value: resumo.horas_ordinarias, icon: Clock, highlight: false },
    { key: 'horasExtras', value: resumo.horas_extras, icon: TimerReset, highlight: false },
    { key: 'horasNoturnas', value: resumo.horas_noturnas, icon: Moon, highlight: false },
    { key: 'total', value: total, icon: Hourglass, highlight: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('resumo.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(({ key, value, icon: Icon, highlight }) => (
            <div
              key={key}
              className={`rounded-lg border p-4 ${
                highlight ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 text-xs opacity-80">
                <Icon className="h-4 w-4" />
                {t(`resumo.${key}`)}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatHoras(value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
