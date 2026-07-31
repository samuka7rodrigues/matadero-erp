import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Receipt, Building2 } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="container mx-auto py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          {t('App.name')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('App.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>{t('Nav.rh')}</CardTitle>
            <CardDescription>8 módulos · 100 funcionários</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Clock className="h-8 w-8 text-primary mb-2" />
            <CardTitle>{t('Nav.ponto')}</CardTitle>
            <CardDescription>RD 8/2019 · 4 anos</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Receipt className="h-8 w-8 text-primary mb-2" />
            <CardTitle>{t('Nav.financeiro')}</CardTitle>
            <CardDescription>IVA · FacturaE</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Building2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>{t('Nav.configuracoes')}</CardTitle>
            <CardDescription>Multi-idioma · Multi-role</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="text-center mt-12">
        <Button asChild size="lg">
          <Link href="/login">{t('Auth.login')}</Link>
        </Button>
      </div>
    </main>
  );
}
