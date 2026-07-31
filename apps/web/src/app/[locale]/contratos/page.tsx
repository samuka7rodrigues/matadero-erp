import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export default function ContratosPage() {
  const t = useTranslations('Nav');
  return <PlaceholderPage titleKey={t('contratos')} icon={FileText} />;
}