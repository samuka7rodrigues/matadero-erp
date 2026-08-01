'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Trash2,
  UserX,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ListChecks,
  X,
} from 'lucide-react';
import {
  updateUtilizadorRole,
  updateUtilizadorAtivo,
  updateUtilizadorPermissoes,
  deleteUtilizador,
  type UtilizadorComColaborador,
} from '@/actions/utilizadores';
import { menuKeysForRole, menuOptions, ALWAYS_MENUS, type MenuOption } from '@/lib/navigation';
import type { RoleUtilizador } from '@/types/database';

interface Props {
  items: UtilizadorComColaborador[];
}

const ROLES: RoleUtilizador[] = ['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor'];

export function UtilizadoresList({ items }: Props) {
  const t = useTranslations('Utilizadores');
  const tNav = useTranslations();
  const tp = useTranslations('Perfil.roles');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [permUser, setPermUser] = useState<UtilizadorComColaborador | null>(null);
  const [permSet, setPermSet] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const top: MenuOption[] = [];
    const groups = new Map<string, MenuOption[]>();
    for (const o of menuOptions()) {
      if (ALWAYS_MENUS.includes(o.href)) continue;
      if (o.groupKey) {
        const arr = groups.get(o.groupKey) || [];
        arr.push(o);
        groups.set(o.groupKey, arr);
      } else {
        top.push(o);
      }
    }
    return { top, groups: Array.from(groups.entries()) };
  }, []);

  function nomeColaborador(c?: UtilizadorComColaborador['colaboradores']) {
    if (!c) return null;
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleRole(userId: string, role: RoleUtilizador) {
    setError(null);
    setSuccess(null);
    const result = await updateUtilizadorRole(userId, role);
    if (!result.success) {
      setError(result.error || t('erro'));
      return;
    }
    setSuccess(t('guardado'));
    router.refresh();
  }

  async function handleAtivo(userId: string, ativo: boolean) {
    if (!window.confirm(ativo ? t('confirmAtivar') : t('confirmInativar'))) return;
    setError(null);
    setSuccess(null);
    const result = await updateUtilizadorAtivo(userId, ativo);
    if (!result.success) {
      setError(result.error || t('erro'));
      return;
    }
    setSuccess(t('guardado'));
    router.refresh();
  }

  async function handleDelete(userId: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    setSuccess(null);
    const result = await deleteUtilizador(userId);
    if (!result.success) {
      setError(result.error || t('erro'));
      return;
    }
    setSuccess(t('guardado'));
    router.refresh();
  }

  function openPermissoes(u: UtilizadorComColaborador) {
    setError(null);
    setSuccess(null);
    const base =
      u.permissoes_menus?.menus && u.permissoes_menus.menus.length > 0
        ? u.permissoes_menus.menus
        : menuKeysForRole(u.role);
    setPermSet(new Set(base));
    setPermUser(u);
  }

  function toggle(href: string) {
    setPermSet((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  async function savePermissoes(menus: string[] | null) {
    if (!permUser) return;
    setSaving(true);
    setError(null);
    const result = await updateUtilizadorPermissoes(permUser.user_id, menus);
    setSaving(false);
    if (!result.success) {
      setError(result.error || t('erro'));
      return;
    }
    setPermUser(null);
    setSuccess(t('guardado'));
    router.refresh();
  }

  function checkbox(o: MenuOption) {
    return (
      <label
        key={o.href}
        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
      >
        <input
          type="checkbox"
          checked={permSet.has(o.href)}
          onChange={() => toggle(o.href)}
          className="h-4 w-4 rounded accent-primary"
        />
        {tNav(o.labelKey)}
      </label>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('noData')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nome')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('telefone')}</TableHead>
              <TableHead>{t('colaboradorLigado')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('estado')}</TableHead>
              <TableHead>{t('ultimoAcesso')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => {
              const nomeColab = nomeColaborador(u.colaboradores);
              return (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.nome_completo || nomeColab || '—'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.telefone || '—'}</TableCell>
                  <TableCell>
                    {nomeColab ? (
                      nomeColab
                    ) : (
                      <span className="text-muted-foreground">{t('semColaborador')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onChange={(e) => handleRole(u.user_id, e.target.value as RoleUtilizador)}
                      className="w-40"
                      title={u.email}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {tp(r)}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? 'success' : 'destructive'}>
                      {u.ativo ? t('ativo') : t('inativo')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.ultimo_acesso
                      ? new Date(u.ultimo_acesso).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('permissoes')}
                        onClick={() => openPermissoes(u)}
                      >
                        <ListChecks className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={u.ativo ? t('inativo') : t('ativo')}
                        onClick={() => handleAtivo(u.user_id, !u.ativo)}
                      >
                        {u.ativo ? (
                          <UserX className="h-4 w-4 text-destructive" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(u.user_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {permUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setPermUser(null)}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border bg-card shadow-xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold">{t('permissoesTitulo')}</h3>
                <p className="text-sm text-muted-foreground">
                  {permUser.nome_completo || nomeColaborador(permUser.colaboradores) || permUser.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => !saving && setPermUser(null)}
                aria-label={t('cancelar')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="px-5 pt-3 text-xs text-muted-foreground">
              {t('permissoesSubtitle')} {t('sempreVisiveis')}
            </p>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {!permUser.permissoes_menus && (
                <p className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {t('menusPadrao')}
                </p>
              )}
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('geral')}
              </div>
              {grouped.top.map((o) => checkbox(o))}
              {grouped.groups.map(([groupKey, items]) => (
                <div key={groupKey} className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {tNav(groupKey)}
                  </div>
                  {items.map((o) => checkbox(o))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t px-5 py-4">
              <Button variant="outline" onClick={() => savePermissoes(null)} disabled={saving}>
                {t('usarPadrao')}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPermUser(null)} disabled={saving}>
                  {t('cancelar')}
                </Button>
                <Button onClick={() => savePermissoes(Array.from(permSet))} disabled={saving}>
                  {t('guardar')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
