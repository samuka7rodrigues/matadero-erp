import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export default function FaturasPage() {
  const t = useTranslations('Nav');
  return <PlaceholderPage titleKey={t('faturas')} icon={Wallet} />;
}