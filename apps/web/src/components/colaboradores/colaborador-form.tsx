'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { colaboradorSchema, type ColaboradorFormData } from '@/types/colaboradores';
import { createColaborador, updateColaborador, uploadDocumento } from '@/actions/colaboradores';
import type { ColaboradorCompleto } from '@/types/database';
import { AlertCircle, FileText, X } from 'lucide-react';

const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'dni', label: 'DNI' },
  { value: 'nie', label: 'NIE' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'exame_medico', label: 'Exame médico' },
  { value: 'epi', label: 'EPI' },
  { value: 'outro', label: 'Outro' },
];

interface Props {
  departamentos: Array<{ id: string; nombre: string }>;
  initialData?: ColaboradorCompleto | null;
  isEditing?: boolean;
}

const TIPO_CONTRATO_OPTIONS = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'formacao', label: 'Formação' },
  { value: 'pratica', label: 'Prática' },
  { value: 'fixo_discontinuo', label: 'Fixo descontínuo' },
  { value: 'obra_servico', label: 'Obra ou Serviço' },
];

// Campo único para os dois países: mutuas de Espanha e seguradoras de Portugal.
const MUTUA_OPTIONS = [
  'FREMAP',
  'ASEPEYO',
  'Mutua Activa',
  'Ibermutua',
  'UMA',
  'Fraternidad-Muprespa',
  'Fidelidade',
  'Tranquilidade',
  'AGEAS',
  'Allianz',
  'Mapfre',
  'Zurich',
  'AIG',
  'Ocidental',
  'Liberty',
];

function mapColaboradorToForm(f: ColaboradorCompleto): ColaboradorFormData {
  return {
    nif: f.nif || '',
    nie: f.nie || '',
    passaporte: f.passaporte || '',
    nombre: f.nombre,
    apellido1: f.apellido1,
    apellido2: f.apellido2 || '',
    fecha_nacimiento: f.fecha_nacimiento?.slice(0, 10) || '',
    nacionalidad: f.nacionalidad || 'ES',
    estado_civil: f.estado_civil || '',
    sexo: f.sexo,
    email: f.email,
    telefono: f.telefono || '',
    telefono_emergencia: f.telefono_emergencia || '',
    contacto_emergencia: f.contacto_emergencia || '',
    direccion: f.direccion || '',
    codigo_postal: f.codigo_postal || '',
    ciudad: f.ciudad || '',
    provincia: f.provincia || '',
    pais: f.pais || 'ES',
    fecha_admision: f.fecha_admision?.slice(0, 10) || '',
    fecha_fin_contrato: f.fecha_fin_contrato?.slice(0, 10) || '',
    estado: f.estado,
    tipo_contrato: f.tipo_contrato,
    jornada: f.jornada,
    horas_semanales: f.horas_semanales,
    categoria_profesional: f.categoria_profesional || '',
    departamento_id: f.departamento_id || '',
    puesto: f.puesto || '',
    salario_base: f.salario_base,
    nivel_profesional: f.nivel_profesional || '',
    convenio_aplicable: f.convenio_aplicable || 'Convenio Nacional Mataderos',
    iban: f.iban || '',
    banco_nombre: f.banco_nombre || '',
    numero_seguridad_social: f.numero_seguridad_social || '',
    mutua: f.mutua || '',
    criar_acesso: false,
    role: 'colaborador',
    password: '',
    confirmar_password: '',
  };
}

export function ColaboradorForm({ departamentos, initialData, isEditing = false }: Props) {
  const t = useTranslations('Colaboradores');
  const locale = useLocale();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<Array<{ file: File; tipo: string }>>([]);
  const [docTipo, setDocTipo] = useState('outro');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addDocumento(list: FileList | null) {
    if (!list) return;
    const novos = Array.from(list).map((file) => ({ file, tipo: docTipo }));
    setDocumentos((prev) => [...prev, ...novos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeDocumento(index: number) {
    setDocumentos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadDocumentosPendentes(colaboradorId: string) {
    for (const doc of documentos) {
      const formData = new FormData();
      formData.append('file', doc.file);
      formData.append('tipo', doc.tipo);
      await uploadDocumento(colaboradorId, formData);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ColaboradorFormData>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: initialData ? mapColaboradorToForm(initialData) : {
      pais: 'ES',
      jornada: 'completa',
      horas_semanales: 40,
      salario_base: 1134,
      tipo_contrato: 'indefinido',
      convenio_aplicable: 'Convenio Nacional Mataderos',
      sexo: undefined,
      estado_civil: undefined,
      criar_acesso: true,
      role: 'colaborador',
    },
  });

  const criarAcesso = watch('criar_acesso');

  async function onSubmit(data: ColaboradorFormData) {
    setSubmitting(true);
    setSubmitError(null);

    if (isEditing && initialData) {
      const result = await updateColaborador(initialData.id, data);

      if (!result.success) {
        setSubmitError(result.error || 'Erro desconhecido');
        setSubmitting(false);
        return;
      }

      router.push(`/colaboradores/${initialData.id}`);
      return;
    }

    const result = await createColaborador(data);

    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }

    if (documentos.length > 0) {
      await uploadDocumentosPendentes(result.id);
    }

    router.push(`/colaboradores/${result.id}`);
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
            <Label htmlFor="nif">NIF</Label>
            <Input
              id="nif"
              {...register('nif')}
              placeholder="12345678A"
              className="font-mono uppercase"
            />
            {errors.nif && <p className="text-xs text-destructive">{errors.nif.message}</p>}
            <p className="text-xs text-muted-foreground">Opcional — pode ser preenchido mais tarde</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nie">NIE</Label>
            <Input id="nie" {...register('nie')} placeholder="X1234567A" className="font-mono uppercase" />
            {errors.nie && <p className="text-xs text-destructive">{errors.nie.message}</p>}
            <p className="text-xs text-muted-foreground">Opcional — pode ser preenchido mais tarde</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passaporte">Passaporte</Label>
            <Input id="passaporte" {...register('passaporte')} placeholder="ABC123456" className="font-mono uppercase" />
            {errors.passaporte && <p className="text-xs text-destructive">{errors.passaporte.message}</p>}
            <p className="text-xs text-muted-foreground">Opcional — pode ser preenchido mais tarde</p>
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
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...register('telefono')} placeholder="+34 600 000 000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono_emergencia">Teléfono emergência</Label>
            <Input id="telefono_emergencia" {...register('telefono_emergencia')} placeholder="+34 600 000 000" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contacto_emergencia">Contacto de emergência</Label>
            <Input id="contacto_emergencia" {...register('contacto_emergencia')} placeholder="Nome de quem contactar" />
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

          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia</Label>
            <Input id="provincia" {...register('provincia')} />
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

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select id="estado" {...register('estado')}>
                <option value="ativo">Ativo</option>
                <option value="baixa">Baixa</option>
                <option value="ferias">Férias</option>
                <option value="suspenso">Suspenso</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo_contrato">Tipo de contrato *</Label>
            <Select id="tipo_contrato" {...register('tipo_contrato')}>
              {TIPO_CONTRATO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jornada">Jornada</Label>
            <Select id="jornada" {...register('jornada')}>
              <option value="completa">Jornada completa</option>
              <option value="parcial">Jornada parcial</option>
              <option value="reduzida">Jornada reduzida</option>
              <option value="intensiva">Jornada intensiva</option>
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
            <Label htmlFor="puesto">Puesto</Label>
            <Input id="puesto" {...register('puesto')} placeholder="Cargo específico" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel_profesional">Nivel profesional</Label>
            <Input id="nivel_profesional" {...register('nivel_profesional')} />
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

      {/* Dados bancários */}
      <Card>
        <CardHeader>
          <CardTitle>Datos bancarios</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" {...register('iban')} placeholder="ES00 0000 0000 0000 0000 0000" className="font-mono" />
            {errors.iban && <p className="text-xs text-destructive">{errors.iban.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="banco_nombre">Banco</Label>
            <Input id="banco_nombre" {...register('banco_nombre')} />
          </div>
        </CardContent>
      </Card>

      {/* Segurança Social */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad Social</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero_seguridad_social">Nº Seguridad Social</Label>
            <Input id="numero_seguridad_social" {...register('numero_seguridad_social')} className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mutua">{t('fields.mutua')}</Label>
            <Select id="mutua" {...register('mutua')}>
              <option value="">{locale === 'pt-BR' ? 'Selecionar...' : 'Seleccionar...'}</option>
              {MUTUA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documentação (só na criação — na edição usa a ficha de documentos) */}
      {!isEditing && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentação (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Anexa documentos (contrato, DNI, exames, EPI...) — são carregados após o colaborador ser criado.
            </p>
          ) : (
            <ul className="space-y-2">
              {documentos.map((doc, i) => (
                <li key={i} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{doc.file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground uppercase">{doc.tipo}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeDocumento(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doc-tipo">Tipo de documento</Label>
              <Select id="doc-tipo" value={docTipo} onChange={(e) => setDocTipo(e.target.value)}>
                {TIPO_DOCUMENTO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-files">Ficheiros</Label>
              <Input
                id="doc-files"
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => addDocumento(e.target.files)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Acesso ao portal */}
      {!isEditing && (
      <Card>
        <CardHeader>
          <CardTitle>Acesso ao portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              {...register('criar_acesso')}
              className="h-4 w-4 rounded border-input"
            />
            Criar utilizador de acesso (login) para este colaborador
          </label>

          {criarAcesso && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Perfil de acesso</Label>
                <Select id="role" {...register('role')}>
                  <option value="colaborador">Colaborador</option>
                  <option value="encarregado">Encarregado</option>
                  <option value="rh">Recursos Humanos</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="auditor">Auditor</option>
                  <option value="admin">Administrador</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...register('password')} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmar_password">Confirmar password *</Label>
                <Input id="confirmar_password" type="password" {...register('confirmar_password')} placeholder="Repete a password" autoComplete="new-password" />
                {errors.confirmar_password && (
                  <p className="text-xs text-destructive">{errors.confirmar_password.message}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(isEditing && initialData ? `/colaboradores/${initialData.id}` : '/colaboradores')}>
          {t('actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'A guardar...' : t('actions.save')}
        </Button>
      </div>
    </form>
  );
}
