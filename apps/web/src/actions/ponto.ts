'use server';

import { revalidatePath } from 'next/cache';
import { fromZonedTime } from 'date-fns-tz';
import { createClient } from '@/lib/supabase/server';
import { TIMEZONE, dataHojeTimezone } from '@/lib/ponto';

/**
 * Tipos de marcação — devem coincidir com o enum `tipo_marcacao`
 * do Supabase (migration 0002): entrada, saida, inicio_almoco,
 * volta_almoco, saida_emergencia.
 */
export type TipoMarcacao = 'entrada' | 'saida' | 'inicio_almoco' | 'volta_almoco';

export interface Marcacao {
  id: string;
  colaborador_id: string;
  data_hora: string;
  tipo: TipoMarcacao;
  dispositivo?: string | null;
}

export interface ResumoJornada {
  horas_ordinarias: number;
  horas_extras: number;
  horas_noturnas: number;
}

/**
 * Cria uma marcação de ponto para o utilizador autenticado.
 * Colaborador só pode marcar o seu próprio ponto (RLS garante isso).
 */
export async function createMarcacao(tipo: TipoMarcacao): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Não autenticado' };

  // Buscar o colaborador associado ao utilizador
  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('colaborador_id')
    .eq('user_id', user.id)
    .single();

  if (!utilizador?.colaborador_id) {
    return { success: false, error: 'Utilizador sem colaborador associado' };
  }

  // Inserir a marcação
  const { error } = await supabase.from('marcacoes_ponto').insert({
    colaborador_id: utilizador.colaborador_id,
    tipo,
    data_hora: new Date().toISOString(),
    dispositivo: 'web',
  });

  if (error) {
    // Verifica se foi a constraint de duplicação
    if (error.message.includes('Já existe uma marcação similar')) {
      return { success: false, error: 'Já marcou há menos de 60 segundos' };
    }
    if (error.code === '22P02') {
      return { success: false, error: 'Tipo de marcação inválido' };
    }
    console.error('Erro ao marcar ponto:', error);
    return { success: false, error: 'Erro ao registar marcação' };
  }

  revalidatePath('/[locale]/ponto', 'page');
  return { success: true };
}

/**
 * Lista as marcações de hoje (no fuso de Madrid) do utilizador autenticado.
 */
export async function getMarcacoesHoje(): Promise<Marcacao[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('colaborador_id')
    .eq('user_id', user.id)
    .single();

  if (!utilizador?.colaborador_id) return [];

  // Limites do dia atual no fuso do matadouro
  const hoje = dataHojeTimezone();
  const start = fromZonedTime(`${hoje}T00:00:00`, TIMEZONE).toISOString();
  const end = fromZonedTime(`${hoje}T23:59:59.999`, TIMEZONE).toISOString();

  const { data } = await supabase
    .from('marcacoes_ponto')
    .select('*')
    .eq('colaborador_id', utilizador.colaborador_id)
    .gte('data_hora', start)
    .lte('data_hora', end)
    .order('data_hora', { ascending: true });

  return (data as Marcacao[]) || [];
}

/**
 * Resumo das horas do dia (ordinárias, extras e noturnas) do utilizador.
 * Usa a função `calcular_horas_jornada` do Supabase (migration 0002/0003).
 */
export async function getResumoHoje(): Promise<ResumoJornada | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('colaborador_id')
    .eq('user_id', user.id)
    .single();

  if (!utilizador?.colaborador_id) return null;

  const { data, error } = await supabase.rpc('calcular_horas_jornada', {
    p_colaborador_id: utilizador.colaborador_id,
    p_data: dataHojeTimezone(),
  });

  if (error || !data) {
    console.error('Erro ao calcular horas da jornada:', error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    horas_ordinarias: Number(row.horas_ordinarias) || 0,
    horas_extras: Number(row.horas_extras) || 0,
    horas_noturnas: Number(row.horas_noturnas) || 0,
  };
}
