# Documento de Regras de Negócio
## ERP Matadero — Legislação Espanhola Aplicável

**Versão:** 1.0
**Data:** 2026-07-31
**Complementa:** `01-analise-funcional.md`

---

## ⚠️ AVISO IMPORTANTE

Este documento resume aspetos da legislação laboral espanhola aplicável a um matadouro com ~100 colaboradores. **Não constitui aconselhamento jurídico.** Antes de implementação, o cliente deve validar cada regra com o seu **assessoria jurídica / graduado social**, pois detalhes podem variar conforme:

- **Convenio Colectivo aplicable** (existe convenio nacional de mataderos: *"Convenio colectivo nacional de mataderos, aves y conejos"*)
- **Comunidade Autónoma** (cada CC.AA pode ter particularidades)
- **Convenio de empresa** (se existir e ter prioridade)

---

## 1. Convenios Colectivos de Referência

### 1.1. Convenio Nacional de Mataderos

- **Nome completo:** *Convenio colectivo nacional para las industrias de mataderos, aves, conejos y otras especies*
- **Publicação:** BOE (Boletín Oficial del Estado)
- **Aplica-se a:** trabalhadores de matadouros industriais em toda Espanha
- **Define:**
  - Categorias profissionais (cortador, deshuesador, clasificador, etc.)
  - Tabelas salariais mínimas
  - Jornada anual
  - Horários e turnos
  - Regime de férias
  - Horas extras e plus de nocturnidade

**Acção:** Obter cópia atualizada do convenio e criar tabela de equivalências no sistema (categoria → salário base, jornada, horário).

### 1.2. Estrutura Salarial Típica (referência 2024–2025)

```
Salário Base + Complementos = Total Bruto
   ├── Salário Base (tabela convenio)
   ├── Plus de produtividade / atividade
   ├── Plus de penosidade / toxicidade
   ├── Complemento de posto (câmara fria, etc.)
   ├── Horas extras
   ├── Horas noturnas (plus)
   └── Gratificações extraordinarias (verão + Natal)

Descontos:
   ├── Cotización Seguridad Social (~6,35% trabalhador, em 2026)
   ├── IRPF (variável, 15–47% conforme rendimento)
   └── Outros (antecipios, etc.)
```

---

## 2. Jornada e Horas

### 2.1. Jornada Máxima
- **Máximo anual:** 1.826 horas e 27 minutos (ley — Estatuto dos Trabalhadores art. 34)
- **Máximo semanal:** 40 horas de trabalho efetivo (média anual)
- **Descanso mínimo:** 12 horas entre jornadas
- **Descanso semanal:** mínimo 1 dia e meio (36 horas consecutivas)

### 2.2. Real Decreto 8/2019 — Registo Horário Obrigatório

**Pontos críticos que o sistema TEM de cumprir:**

1. **Registo diário** de início e fim da jornada de cada trabalhador
2. **Inclui:** horas ordinárias, complementárias, extras, nocturnas, etc.
3. **Conservação:** mínimo **4 anos** (acceso por trabajador, representación legal, Inspección de Trabajo)
4. **Formato:** qualquer formato (papel, digital) **desde que** seja fidedigno e inviolável
5. **Disponibilidade:** imediato ao trabalhador e seus representantes legais
6. **Acesso remoto (cloud):** válido, desde que cumpram requisitos anteriores

**Implicações técnicas:**
- Marcações devem ser **imutáveis** após confirmação (ou com workflow de correção)
- Logs de auditoria devem registar qualquer alteração
- Exportação fácil em CSV/XML para Inspeccion de Trabajo
- Timezone consistente (sempre UTC + offset guardado)

### 2.3. Horas Extras
- **Limite:** máximo **80 horas/ano** por trabalhador (salvo acordo)
- **Tipos:**
  - **HE estructurales:** habituales, computam para limite mensal (máx 80h/ano)
  - **HE de fuerza mayor:** catástrofe ou risco, SEM límite (remuneradas ou compensadas)
- **Valor mínimo:** +75% hora ordinária (estructurais), +100% (não estructurales) — verificar convenio

### 2.4. Trabalho Noturno
- **Definição:** trabalho entre **22h00 e 06h00**
- **Limite:** máximo 8h/dia em média (25 dias/semana)
- **Plus:** mínimo **+25%** sobre hora ordinária (salvo convenio tenha valor superior)

### 2.5. Trabalho em Domingos e Feriados
- Em matadouros часто há laboração em domingos (atividade contínua)
- Plus conforme convenio ou autorización gubernativa

---

## 3. Férias (Vacaciones)

### 3.1. Mínimo Legal
- **30 dias naturais/ano** (24 dias úteis segundo muchos convenios)

### 3.2. Calendário Laboral
- Cada empresa publica até final de año anterior
- 15 dias correlativos como mínimo durante verão (junho-setembro), salvo acordo

### 3.3. Férias Não Gozadas
- Não podem ser compensadas em dinheiro (salvo cessação de contrato)

### 3.4. Calendário de Feriados por CC.AA.
**Implicação:** o sistema deve ter uma tabela de feriados configurável por CC.AA (Andaluzia, Castilla-León, etc.).

Exemplo CC.AA. tipo:
```
Nacionais (10): 1 jan, 6 jan, 1 maio, 15 ago, 12 out, 1 nov, 6 dez, 8 dez, 25 dez, [variável]
Regionais (2–4): según CC.AA.
Locais (2): según município
```

---

## 4. Contratos de Trabalho

### 4.1. Tipos Principais

| Tipo | Código | Duração | Uso típico em matadouro |
|---|---|---|---|
| Indefinido | 100 | Sem limite | Pessoal estável (mantenimiento, administrativos) |
| Temporal | 200/300 | Até 6 meses (pode prorrogar até 12) | Picos de produção, campanhas |
| Formação | 400 | Máx 12 meses | Aprendizes |
| Prática | 410 | 6–12 meses | Recém-formados |
| Fixos-discontinuos | 330 | Sazonal | Campanhas de abate (Navidad, verão) |

### 4.2. Contrato Fixos-Discontinuos (relevante para matadouro)

- **Característica:** relação laboral permanente mas com descontinuidade no tempo
- **Uso típico:** campanhas sazonais
- **Implicações:**
  - O sistema deve gerir **chamadas** (llamamiento) por ordem de antigüedad
  - Férias acumulam-se durante o período ativo
  - Cotização pode ser por dias efetivamente trabalhados (em certos casos)

---

## 5. Nómina / Recibos de Vencimento

### 5.1. Recibo Oficial — Conteúdo Obrigatório

O recibo deve incluir, conforme **Estatuto dos Trabalhadores art. 29**:

1. Identificação da empresa (CIF, nombre, domicilio)
2. Identificação do trabalhador (NIF/NIE, nombre, grupo profesional)
3. Periodo de líquidación (mes/ano)
4. **Devengos** (tudo o que recebe):
   - Salário base
   - Complementos salariales
   - Complementos de puesto (toxicidad, penosidad)
   - Horas extras (quantidade e valor)
   - Horas complementarias
   - Gratificações extraordinarias
   - Pagas prorateadas
5. **Deducciones:**
   - Cotización Seguridad Social (trabalhador)
   - Retención IRPF (porcentaje)
   - Anticipos
   - Embargos (se aplicável)
6. **Liquido a percibir** (total - descuentos)
7. **Firma del trabajador** ou "recibo electrónico"
8. **Firma de la empresa** (sello ou meio eletrónico equivalente)
9. **Data emissão**

### 5.2. Pagas Extraordinárias
- **Mínimo:** 2/ano (verão + Natal)
- **Prazo:** verão (junho–setembro, según acuerdo) e Natal (antes de 22 dezembro)
- **Cálculo:** salario base + complementos habituales (não inclui horas extras variáveis)

### 5.3. Recibo Eletrónico — Requisitos (LGPD art. 7 + Ley 3/2018 LOPDGDD)
- Consentimento explícito do trabalhador
- Formato **não manipulável** (PDF/A preferível)
- Sistema de **autenticação** no acesso
- **Acesso em qualquer momento** (não pode perder acesso após cessação, durante 4 anos)

---

## 6. Cotización a la Seguridad Social

### 6.1. Bases de Cotización (2026 — referência verificar)

| Contingência | Trabalhador | Empresa |
|---|---|---|
| Comuns | ~4,70% | ~23,60% |
| Desemprego | ~1,55% (geral) | ~5,50% |
| FOGASA | 0% | 0,20% |
| Formação profissional | 0,10% | 0,60% |
| AT/EP (acidente trabalho) | 0% | varía según actividad |

**Nota:** Para matadouros, a atividade tem **cotización AT/EP mais alta** (mecanização, cuchillos, câmaras frias).

### 6.2. Sistema de Cotización para Fijos-Discontinuos

Modelo especial desde 2012 — contribuição por dias efetivamente prestados.

---

## 7. IRPF (Retencións no Recibo)

### 7.1. Tipo Geral por Rendimentos do Trabalho
- Escala progresiva (desde 19% ate 47%)
- Aplicável conforme **circunstâncias pessoais** (estado civil, filhos, idade)

### 7.2. Tipo de Retención na Fonte
- Calculado pela empresa ou pelo trabalhador (este pode aumentá-lo)
- **Implicação:** o sistema deve permitir calcular e atualizar retenciones conforme circunstâncias comunicadas pelo trabalhador

### 7.3. Certificado de Retenciones
No final do ano, a empresa emite **certificado de retenciones del IRPF** para declaração da renda do trabalhador.

---

## 8. Cessação de Contrato / Finiquito

### 8.1. Causas de Extinção
- Por vontade do trabalhador (dimisión — pré-aviso 15 dias)
- Por decisão da empresa (despido disciplinário, objetivo, coletivo)
- Por mutuo acordo
- Por invalidez
- Por expiração do contrato temporal
- Por força maior

### 8.2. Finiquito — Componentes
- Salário dias trabalhados no mês
- Paga extra proporcional
- Férias não gozadas (valorizadas)
- **Indemnização** (se aplicável):
  - Despido improcedente: 33 dias/ano (máx 24 meses)
  - Despido objetivo: 20 dias/ano (máx 12 meses)
- **Pré-aviso:** 15 días (salvo excepciones)

### 8.3. Documento de Finiquito (Recibo Saldo y Finiquito)
Modelo oficial — o trabalhador deve assinar ou marcar desacordo.

---

## 9. SST — Segurança e Saúde no Trabalho

### 9.1. Avaliação de Riscos Específicos de Matadouro

| Risco | Exemplo | Medida |
|---|---|---|
| **Cortes** | Manipulação de facas, serras | EPI (luvas anticorte), formação |
| **Atropello** | Veículos no pátio | Formação, sinalização, velocidade |
| **Quedas** | Pisos molhados/gordurosos | Pavimento antiderrapante, calçado |
| **Ruído** | Câmaras, máquinas | EPI auditivos |
| **Temperatura** | Câmara fria (+0°C) | Roupa térmica, rotatividade |
| **Agentes biológicos** | Zoonoses (brucelose, etc.) | Vacinação, EPI, vigilancia médica |
| **Cargas** | Elevação (>15kg) | Formação, auxilios mecânicos |
| **Psicossocial** | Ritmo intenso, trabalho em frio | Pausas, organização |

### 9.2. EPI's Obrigatórios em Matadouro

- Calçado de segurança com biqueira de aço
- Luvas anticorte (Nível 5)
- Avental impermeável de proteção
- Protector facial / óculos
- Protetores auditivos
- Roupa térmica para câmaras frias
- Capacete quando necessário

**Implicação RH:** sistema deve registar entrega de EPI por colaborador, com data, modelo, tamanho, assinatura.

### 9.3. Reconhecimento Médico (Vigilancia de la Salud)
- **Obrigatório** para postos com riscos específicos (art. 22 Ley 31/1995 LPRL)
- **Periodicidade:** anual (recomendada) ou conforme protocolo
- **Apto / No Apto / Con Aps restricciones**

**RN derivada:** Colaborador "No Apto" para um posto deve ser **reubicado** ou **não escalado** nesse posto.

### 9.4. Incapacidade Temporal (IT — Baixa Médica)
- **Modalidades:**
  - Comum (doença comum, accidente no laboral)
  - Profissional (accidente de trabalho, doença profissional)
- **Documentos:**
  - Parte de baja (médico)
  - Partes de confirmación (semanal)
  - Parte de alta
- **Prestación:** Seguridad Social paga a partir do 4º dia (comum) ou 1º dia (profissional)

---

## 10. Faturação (IVA e Fatura Eletrónica)

### 10.1. IVA — Tipos Aplicáveis no Setor

A maior parte do comércio de carne:
- **Carne:** 10% (tipo reducido) ou **4%** (produtos da terra / produtos agrícolas)
- **Subprodutos:** depende do destino
- **Serviços:** 21% (geral)

### 10.2. Numeração de Faturas
- **Obligatória** sequência contínua por série
- Sem lacunas (salvo anulação documentada com série rectificativa)
- Conservação: **4 anos** (Lei 58/2003 General Tributaria + Ley 56/2007)
- **Fatura eletrónica:** obrigatória para proveedores de Administrações Públicas (Ley 25/2013 — FacturaE formato XML)

### 10.3. Fatura para Cliente Particular / Empresa
Campos obrigatórios (RD 1619/2012):
- Número, série, data
- Identificação vendedor (CIF, nome, morada)
- Identificación comprador (NIF/CIF, nome, morada)
- Descrição bens/serviços
- Quantidade, preço unitário
- Descontos
- Base imponible
- IVA (tipo, cuota)
- Retención IRPF (si aplica)
- Total

---

## 11. Proteção de Dados (RGPD + LOPDGDD)

### 11.1. Dados Tratados

**Categorias especiais (alto risco):**
- Dados de salud (reconocimientos médicos, bajas)
- Dados biométricos (se usar en ponto)
- Afiliação sindical (em alguns casos)

**Base legitimadora:**
- Execução de contrato laboral (maior parte)
- Obrigação legal (SS, Hacienda)
- Consentimento explícito (para tratamentos opcionais — fotos, dados de contacto emerg.)

### 11.2. Obrigações Documentais
- Registro de Actividades de Tratamiento (RAT)
- DPIA se tratamento de dados especiais em larga escala
- Contrato de Encargado de Tratamiento (com fornecedores)

### 11.3. Direitos do Trabalhador
- Acceso, rectificación, supresión, portabilidad
- Limitación y oposición
- **Importante:** direito de **supressão NÃO se aplica** quando há obrigação legal de conservar (SS, Hacienda, Inspeccion Trabalho) — **retenção obrigatória de 4 anos**

---

## 12. Convenios Colectivos Específicos por CC.AA.

Além do convenio nacional, algumas CC.AA. têm **convenios autonómicos** de mataderos.

**Acção:** validar com cliente qual se aplica (geralmente o nacional quando não há acordo de empresa).

---

## 13. Quadro Resumo — Regras Críticas para o Sistema

| # | Regra | Implementação obrigatória |
|---|---|---|
| 1 | Jornada máxima 40h/semana (média anual) | Cálculo de horas no apuramento |
| 2 | Registo diário conforme RD 8/2019 | Tabela de marcações imutável |
| 3 | Conservação de registos 4 anos | Política de retenção |
| 4 | Límite 80h extras/ano | Bloqueio/alerta |
| 5 | Plus nocturnidade ≥25% | Cálculo automático |
| 6 | Mínimo 12h descanso entre jornadas | Validação na atribuição de turnos |
| 7 | Férias mínimas 30 días naturais | Validação em aprovação |
| 8 | 15 días férias verano | Validação no calendário |
| 9 | Recibo com todos os campos do art. 29 ET | Template oficial |
| 10 | Numeração faturas sequencial | Auto-numeração sem lacunas |
| 11 | RGPD — base legitimadora por tratamento | Consentimento explícito quando aplicável |
| 12 | EPI por puesto de trabalho | Tabela EPI por cargo |
| 13 | Reconhecimento médico válido para posto sensível | Bloqueio si "No Apto" |
| 14 | Indemnização por despido conforme tipo | Cálculo do finiquito |
| 15 | 2 pagas extras/ano mínimo | Configuração de calendário |

---

## 14. Próximos Passos

1. **Validar todas as regras** com assessoria jurídica do cliente
2. **Obter cópia atualizada** do Convenio Colectivo aplicable
3. **Mapear categorías profissionais** según convenio
4. **Configurar calendário laboral** (feriados nacionais, regionais, locais)
5. **Definir tabla salarial** segundo convenio
6. **Implementar regras de cálculo** de horas extras, plus, etc.

---

**Fim do Documento de Regras de Negócio v1.0**
