'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { empresaSchema, type EmpresaFormData } from '@/types/empresa';
import type { Empresa } from '@/types/database';
import { createEmpresa, updateEmpresa, uploadLogotipo } from '@/actions/empresa';
import { useTranslations } from 'next-intl';
import { AlertCircle, ImagePlus } from 'lucide-react';

interface Props {
  initialData?: Empresa | null;
  isEditing?: boolean;
}

function mapEmpresaToForm(e: Empresa): EmpresaFormData {
  return {
    nombre: e.nombre,
    nombre_comercial: e.nombre_comercial || '',
    cif_nif: e.cif_nif || '',
    iva: e.iva ?? 21,
    direccion: e.direccion || '',
    ciudad: e.ciudad || '',
    codigo_postal: e.codigo_postal || '',
    pais: e.pais || 'ES',
    telefono: e.telefono || '',
    correo: e.correo || '',
    web: e.web || '',
    banco: e.banco || '',
    iban: e.iban || '',
    swift: e.swift || '',
    responsable_direccion: e.responsable_direccion || '',
    responsable_rrhh: e.responsable_rrhh || '',
    responsable_finanzas: e.responsable_finanzas || '',
    responsable_operaciones: e.responsable_operaciones || '',
  };
}

export function EmpresaForm({ initialData, isEditing = false }: Props) {
  const t = useTranslations('Empresa');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: initialData
      ? mapEmpresaToForm(initialData)
      : { iva: 21, pais: 'ES' },
  });

  async function onSubmit(data: EmpresaFormData) {
    setSubmitting(true);
    setSubmitError(null);

    let empresaId: string | undefined;
    if (isEditing && initialData) {
      const result = await updateEmpresa(initialData.id, data);
      if (!result.success) {
        setSubmitError(result.error || 'Erro desconhecido');
        setSubmitting(false);
        return;
      }
      empresaId = initialData.id;
    } else {
      const result = await createEmpresa(data);
      if (!result.success || !result.id) {
        setSubmitError(result.error || 'Erro desconhecido');
        setSubmitting(false);
        return;
      }
      empresaId = result.id;
    }

    if (logoFile && empresaId) {
      const formData = new FormData();
      formData.append('file', logoFile);
      const logoResult = await uploadLogotipo(empresaId, formData);
      if (!logoResult.success) {
        setSubmitError(logoResult.error || 'Erro ao carregar logotipo');
      }
    }

    router.push(`/empresas/${empresaId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.identificacion')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">{t('fields.nombre')} *</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_comercial">{t('fields.nombreComercial')}</Label>
            <Input id="nombre_comercial" {...register('nombre_comercial')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cif_nif">{t('fields.cifNif')}</Label>
            <Input id="cif_nif" {...register('cif_nif')} placeholder="B12345678" className="font-mono uppercase" />
            {errors.cif_nif && <p className="text-xs text-destructive">{errors.cif_nif.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="iva">{t('fields.iva')}</Label>
            <Input id="iva" type="number" step="0.01" {...register('iva', { valueAsNumber: true })} />
            {errors.iva && <p className="text-xs text-destructive">{errors.iva.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.contacto')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">{t('fields.direccion')}</Label>
            <Input id="direccion" {...register('direccion')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">{t('fields.ciudad')}</Label>
            <Input id="ciudad" {...register('ciudad')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_postal">{t('fields.codigoPostal')}</Label>
            <Input id="codigo_postal" {...register('codigo_postal')} maxLength={5} />
            {errors.codigo_postal && <p className="text-xs text-destructive">{errors.codigo_postal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">{t('fields.pais')}</Label>
            <Input id="pais" {...register('pais')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">{t('fields.telefono')}</Label>
            <Input id="telefono" {...register('telefono')} placeholder="+34 900 000 000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo">{t('fields.correo')}</Label>
            <Input id="correo" type="email" {...register('correo')} />
            {errors.correo && <p className="text-xs text-destructive">{errors.correo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="web">{t('fields.web')}</Label>
            <Input id="web" {...register('web')} placeholder="https://..." />
            {errors.web && <p className="text-xs text-destructive">{errors.web.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Banca */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.banca')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="banco">{t('fields.banco')}</Label>
            <Input id="banco" {...register('banco')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">{t('fields.iban')}</Label>
            <Input id="iban" {...register('iban')} placeholder="ES00 0000 ..." className="font-mono" />
            {errors.iban && <p className="text-xs text-destructive">{errors.iban.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="swift">{t('fields.swift')}</Label>
            <Input id="swift" {...register('swift')} className="font-mono uppercase" />
            {errors.swift && <p className="text-xs text-destructive">{errors.swift.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Responsáveis */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.responsables')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="responsable_direccion">{t('fields.responsableDireccion')}</Label>
            <Input id="responsable_direccion" {...register('responsable_direccion')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable_rrhh">{t('fields.responsableRrhh')}</Label>
            <Input id="responsable_rrhh" {...register('responsable_rrhh')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable_finanzas">{t('fields.responsableFinanzas')}</Label>
            <Input id="responsable_finanzas" {...register('responsable_finanzas')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable_operaciones">{t('fields.responsableOperaciones')}</Label>
            <Input id="responsable_operaciones" {...register('responsable_operaciones')} />
          </div>
        </CardContent>
      </Card>

      {/* Logotipo */}
      <Card>
        <CardHeader>
          <CardTitle>{t('fields.logotipo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="flex flex-1 items-center gap-3 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50">
              <ImagePlus className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {logoFile ? logoFile.name : t('actions.uploadLogotipo')}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, SVG · máx. 5 MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/empresas')}
        >
          {t('actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'A guardar...' : t('actions.save')}
        </Button>
      </div>
    </form>
  );
}
