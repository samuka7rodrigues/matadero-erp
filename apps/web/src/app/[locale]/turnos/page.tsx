import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export default function TurnosPage() {
  const t = useTranslations('Nav');
  return <PlaceholderPage titleKey={t('turnos')} icon={Calendar} />;
}