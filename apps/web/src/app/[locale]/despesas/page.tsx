import { Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export default function DespesasPage() {
  const t = useTranslations('Nav');
  return <PlaceholderPage titleKey={t('despesas')} icon={Receipt} />;
}