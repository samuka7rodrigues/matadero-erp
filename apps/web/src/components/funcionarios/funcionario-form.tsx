'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { funcionarioSchema, type FuncionarioFormData, nifSchema } from '@/types/funcionarios';
import { createFuncionario } from '@/actions/funcionarios';
import { isValidNIF } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Departamento } from '@/types/database';

interface Props {
  departamentos: Departamento[];
}

const TIPO_CONTRATO_OPTIONS = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'fixo_discontinuo', label: 'Fijo-Discontinuo' },
  { value: 'formacao', label: 'Formación' },
  { value: 'pratica', label: 'Prácticas' },
  { value: 'obra_servico', label: 'Obra o Servicio' },
];

export function FuncionarioForm({ departamentos }: Props) {
  const t = useTranslations('Funcionarios');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nifValid, setNifValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      pais: 'ES',
      jornada: 'completa',
      horas_semanales: 40,
      salario_base: 1134,
      tipo_contrato: 'indefinido',
      convenio_aplicable: 'Convenio Nacional Mataderos',
      sexo: undefined,
      estado_civil: undefined,
    },
  });

  const nifValue = watch('nif');

  // Validar NIF em tempo real
  function handleNifChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase();
    setValue('nif', val, { shouldValidate: false });
    if (val.length === 9) {
      setNifValid(isValidNIF(val));
    } else {
      setNifValid(null);
    }
  }

  async function onSubmit(data: FuncionarioFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await createFuncionario(data);

    if (!result.success) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }

    router.push(`/funcionarios/${result.funcionario!.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {submitError}
        </div>
      )}

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nif">NIF *</Label>
            <div className="relative">
              <Input
                id="nif"
                {...register('nif')}
                onChange={handleNifChange}
                placeholder="12345678A"
                maxLength={9}
                className="font-mono uppercase pr-10"
              />
              {nifValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
              )}
              {nifValid === false && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            {errors.nif && <p className="text-xs text-destructive">{errors.nif.message}</p>}
            {nifValid === false && <p className="text-xs text-destructive">NIF inválido</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nie">NIE</Label>
            <Input id="nie" {...register('nie')} placeholder="X1234567A" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido1">1º Apellido *</Label>
            <Input id="apellido1" {...register('apellido1')} />
            {errors.apellido1 && <p className="text-xs text-destructive">{errors.apellido1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido2">2º Apellido</Label>
            <Input id="apellido2" {...register('apellido2')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento *</Label>
            <Input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} />
            {errors.fecha_nacimiento && (
              <p className="text-xs text-destructive">{errors.fecha_nacimiento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <Select id="sexo" {...register('sexo')}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Outro</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado_civil">Estado civil</Label>
            <Select id="estado_civil" {...register('estado_civil')}>
              <option value="">Seleccionar...</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="pareja_hecho">Pareja de hecho</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="viudo">Viudo/a</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Teléfono</Label>
            <Input id="telefone" {...register('telefone')} placeholder="+34 600 000 000" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register('direccion')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_postal">CP</Label>
            <Input id="codigo_postal" {...register('codigo_postal')} maxLength={5} />
            {errors.codigo_postal && <p className="text-xs text-destructive">{errors.codigo_postal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input id="ciudad" {...register('ciudad')} />
          </div>
        </CardContent>
      </Card>

      {/* Dados profissionais */}
      <Card>
        <CardHeader>
          <CardTitle>Datos profesionales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha_admision">Fecha de admisión *</Label>
            <Input id="fecha_admision" type="date" {...register('fecha_admision')} />
            {errors.fecha_admision && (
              <p className="text-xs text-destructive">{errors.fecha_admision.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_fin_contrato">Fecha fin contrato</Label>
            <Input id="fecha_fin_contrato" type="date" {...register('fecha_fin_contrato')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_contrato">Tipo de contrato *</Label>
            <Select id="tipo_contrato" {...register('tipo_contrato')}>
              {TIPO_CONTRATO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departamento_id">Departamento</Label>
            <Select id="departamento_id" {...register('departamento_id')}>
              <option value="">Seleccionar...</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria_profesional">Categoría profesional</Label>
            <Select id="categoria_profesional" {...register('categoria_profesional')}>
              <option value="">Seleccionar...</option>
              <option value="cortador">Cortador</option>
              <option value="deshuesador">Deshuesador</option>
              <option value="operario">Operario</option>
              <option value="clasificador">Clasificador</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="administrativo">Administrativo</option>
              <option value="encargado">Encargado</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horas_semanales">Horas semanales</Label>
            <Input
              id="horas_semanales"
              type="number"
              {...register('horas_semanales', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="salario_base">Salario base mensual (€) *</Label>
            <Input
              id="salario_base"
              type="number"
              step="0.01"
              {...register('salario_base', { valueAsNumber: true })}
            />
            {errors.salario_base && (
              <p className="text-xs text-destructive">{errors.salario_base.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              SMI 2026 España: 1.134€/mês (14 pagamentos)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/funcionarios')}>
          {t('actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'A guardar...' : t('actions.save')}
        </Button>
      </div>
    </form>
  );
}
