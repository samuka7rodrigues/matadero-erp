import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export default function UtilizadoresPage() {
  const t = useTranslations('Nav');
  return <PlaceholderPage titleKey={t('utilizadores')} icon={Shield} />;
}