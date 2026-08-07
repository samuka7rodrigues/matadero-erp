'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function DocumentosFiltros() {
  const t = useTranslations('Documentos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [referencia, setReferencia] = useState(searchParams.get('referencia') || '');
  const [data, setData] = useState(searchParams.get('data') || '');

  function applyFilter() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (referencia) params.set('referencia', referencia);
    if (data) params.set('data', data);
    router.push(`/documentos?${params.toString()}`);
  }

  function clearFilters() {
    setSearch('');
    setReferencia('');
    setData('');
    router.push('/documentos');
  }

  const hasFilter = !!search || !!referencia || !!data;

  return (
    <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('filterNome')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
          className="pl-9"
        />
      </div>
      <div className="relative flex-1 min-w-[160px]">
        <Input
          placeholder={t('filterReferencia')}
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
        />
      </div>
      <div className="w-full sm:w-auto">
        <Input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          title={t('filterData')}
          className="w-full sm:w-40"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={applyFilter}>{tc('filter')}</Button>
        {hasFilter && (
          <Button variant="outline" onClick={clearFilters}>
            <FilterX className="mr-1.5 h-4 w-4" />
            {t('clearFiltros')}
          </Button>
        )}
      </div>
    </div>
  );
}
