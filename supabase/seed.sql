-- ============================================================
-- ERP Matadero — Seed de dados de TESTE (colaboradores + ponto)
-- ============================================================
-- ⚠️ SÓ PARA DESENVOLVIMENTO. Não executar em produção.
--
-- O que faz:
--   1. Cria colaboradores de teste (1 admin + 5 operários)
--   2. Cria os utilizadores de autenticação (email + password)
--   3. Liga auth.users -> public.utilizadores -> public.colaboradores
--   4. (Opcional) Insere marcações de ponto de exemplo para hoje
--
-- Como executar: Supabase Dashboard → SQL Editor → New query → colar → Run
--
-- Credenciais de teste (todas com a mesma password):
--   admin@matadero.es  / Teste123!   (role: admin)
--   juan@matadero.es   / Teste123!   (role: colaborador)
--   maria@matadero.es  / Teste123!   (role: colaborador)
--   pedro@matadero.es  / Teste123!   (role: colaborador)
--   ana@matadero.es    / Teste123!   (role: colaborador)
--   carlos@matadero.es / Teste123!   (role: colaborador)
--
-- Pré-requisito: migrations 0001, 0002 e 0003 já executadas.
-- Idempotente: pode ser executado várias vezes sem duplicar dados.
-- ============================================================

DO $$
DECLARE
  v_password TEXT := 'Teste123!';
  v_user_id  uuid;
  v_colab_id  uuid;
  v_dep_id   uuid;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      -- email, role, nif, nombre, apellido1, apellido2, nac, adm, tipo_contrato, salario, departamento
      ('admin@matadero.es'::citext, 'admin',      '00000000A', 'Admin', 'Sistema', NULL,        '1990-01-01'::date, '2026-01-01'::date, 'indefinido'::tipo_contrato, 3000::numeric, 'ADM'),
      ('juan@matadero.es'::citext,  'colaborador', '11111111A', 'Juan',  'García',  'Pérez',     '1985-03-15'::date, '2020-01-15'::date, 'indefinido'::tipo_contrato, 1500::numeric, 'SACRIF'),
      ('maria@matadero.es'::citext, 'colaborador', '22222222B', 'María', 'López',   'Gómez',     '1990-07-22'::date, '2021-06-01'::date, 'indefinido'::tipo_contrato, 1600::numeric, 'DESP'),
      ('pedro@matadero.es'::citext, 'colaborador', '33333333C', 'Pedro', 'Martínez', 'Ruiz',     '1988-11-30'::date, '2019-09-10'::date, 'temporal'::tipo_contrato,   1400::numeric, 'CAM'),
      ('ana@matadero.es'::citext,   'colaborador', '44444444D', 'Ana',   'Rodríguez', 'Sanz',    '1992-05-18'::date, '2022-03-20'::date, 'indefinido'::tipo_contrato, 1700::numeric, 'CAL'),
      ('carlos@matadero.es'::citext,'colaborador', '55555555E', 'Carlos','Sánchez', 'Díaz',     '1986-09-12'::date, '2018-11-05'::date, 'indefinido'::tipo_contrato, 1550::numeric, 'MANT')
    ) AS t(email, v_role, nif, nombre, apellido1, apellido2, nac, adm, tipo_contrato, salario, dep)
  LOOP
    -- 1. Departamento (pelo código)
    SELECT id INTO v_dep_id FROM public.departamentos WHERE codigo = rec.dep;

    -- 2. Colaborador (criar se não existir pelo email)
    SELECT id INTO v_colab_id FROM public.colaboradores WHERE email = rec.email;
    IF v_colab_id IS NULL THEN
      INSERT INTO public.colaboradores (
        nif, nombre, apellido1, apellido2, fecha_nacimiento, fecha_admision,
        email, tipo_contrato, salario_base, departamento_id
      ) VALUES (
        rec.nif, rec.nombre, rec.apellido1, rec.apellido2, rec.nac, rec.adm,
        rec.email, rec.tipo_contrato, rec.salario, v_dep_id
      )
      RETURNING id INTO v_colab_id;
      RAISE NOTICE 'Colaborador criado: % (%)', rec.email, rec.nif;
    END IF;

    -- 3. Utilizador de autenticação (criar se não existir)
    SELECT id INTO v_user_id FROM auth.users WHERE email = rec.email::text;
    IF v_user_id IS NULL THEN
      PERFORM auth.admin_create_user(jsonb_build_object(
        'email', rec.email::text,
        'password', v_password,
        'email_confirm', true
      ));
      SELECT id INTO v_user_id FROM auth.users WHERE email = rec.email::text;
      RAISE NOTICE 'Utilizador auth criado: %', rec.email;
    END IF;

    -- 4. Liga auth.user -> colaborador na tabela utilizadores
    INSERT INTO public.utilizadores (user_id, colaborador_id, email, role, ativo)
    VALUES (v_user_id, v_colab_id, rec.email, rec.v_role::role_utilizador, TRUE)
    ON CONFLICT (user_id) DO UPDATE
      SET colaborador_id = EXCLUDED.colaborador_id,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          ativo = TRUE;
  END LOOP;
END $$;

-- ============================================================
-- (OPCIONAL) Marcações de ponto de exemplo para HOJE
-- Jornada de 8h: entrada 08:00, almoço 13:00-14:00, saída 17:00
-- para juan@matadero.es — assim o "Resumo do dia" mostra valores.
-- ============================================================
DO $$
DECLARE
  v_hoje    DATE := (NOW() AT TIME ZONE 'Europe/Madrid')::date;
  v_colab_id uuid;
  v_count   integer;
BEGIN
  SELECT id INTO v_colab_id FROM public.colaboradores WHERE email = 'juan@matadero.es';

  IF v_colab_id IS NULL THEN
    RAISE NOTICE 'juan@matadero.es não existe — marcações de teste saltadas.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.marcacoes_ponto
  WHERE colaborador_id = v_colab_id
    AND ((data_hora AT TIME ZONE 'Europe/Madrid')::date) = v_hoje;

  IF v_count > 0 THEN
    RAISE NOTICE 'juan@matadero.es já tem marcações hoje — nada inserido.';
    RETURN;
  END IF;

  INSERT INTO public.marcacoes_ponto (colaborador_id, data_hora, tipo, dispositivo)
  VALUES
    (v_colab_id, ((v_hoje || ' 08:00:00')::timestamp AT TIME ZONE 'Europe/Madrid'), 'entrada',        'seed'),
    (v_colab_id, ((v_hoje || ' 13:00:00')::timestamp AT TIME ZONE 'Europe/Madrid'), 'inicio_almoco',  'seed'),
    (v_colab_id, ((v_hoje || ' 14:00:00')::timestamp AT TIME ZONE 'Europe/Madrid'), 'volta_almoco',   'seed'),
    (v_colab_id, ((v_hoje || ' 17:00:00')::timestamp AT TIME ZONE 'Europe/Madrid'), 'saida',          'seed');

  RAISE NOTICE 'Marcações de exemplo inseridas para juan@matadero.es (08:00 → 13:00 → 14:00 → 17:00).';
END $$;

-- ============================================================
-- Confirmação final
-- ============================================================
SELECT u.email, u.role, f.nombre, f.apellido1, d.nombre AS departamento
FROM public.utilizadores u
LEFT JOIN public.colaboradores f ON u.colaborador_id = f.id
LEFT JOIN public.departamentos d ON f.departamento_id = d.id
ORDER BY u.email;
