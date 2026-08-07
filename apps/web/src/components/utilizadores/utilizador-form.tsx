'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { AlertCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { criarUtilizador } from '@/actions/utilizadores';
import type { RoleUtilizador } from '@/types/database';

const utilizadorSchema = z.object({
  nome: z.string().trim().min(1),
  email: z.string().trim().min(1).email(),
  telefone: z.string().trim().optional(),
  password: z.string().min(8),
  role: z.enum(['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor']),
});

type UtilizadorFormData = z.infer<typeof utilizadorSchema>;

const ROLES: RoleUtilizador[] = ['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor'];

export function UtilizadorForm() {
  const t = useTranslations('Utilizadores');
  const tp = useTranslations('Perfil.roles');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UtilizadorFormData>({
    resolver: zodResolver(utilizadorSchema),
    defaultValues: { role: 'colaborador', telefone: '' },
  });

  async function onSubmit(data: UtilizadorFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await criarUtilizador({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      password: data.password,
      role: data.role,
    });

    if (!result.success) {
      setSubmitError(result.error || t('erro'));
      setSubmitting(false);
      return;
    }

    router.push('/utilizadores');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('new')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">{t('nome')} *</Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')} *</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">{t('telefone')}</Label>
            <Input id="telefone" {...register('telefone')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')} *</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="role">{t('role')} *</Label>
            <Select id="role" className="w-full md:max-w-xs" {...register('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {tp(r)}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {t('guardar')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/utilizadores')}>
          {t('cancelar')}
        </Button>
      </div>
    </form>
  );
}
