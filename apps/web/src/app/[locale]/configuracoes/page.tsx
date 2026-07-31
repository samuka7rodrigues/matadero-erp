import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export default function ConfiguracoesPage() {
  const t = useTranslations('Nav');
  return <PlaceholderPage titleKey={t('configuracoes')} icon={Settings} />;
}