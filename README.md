# Matriz de Priorização de Projetos — CMPC

Aplicação web **totalmente editável** para priorizar projetos de CapEx por
**critérios ponderados**, organizada em **5 temas ("cestas")**. Inspirada na
Matriz de Priorização da Usiminas, adaptada à realidade do CMPC.

Cada tema tem o **seu próprio conjunto de critérios**, ajustável de forma única e
aplicado a todos os projetos daquela cesta. A nota de cada projeto é
**Σ(valor da opção escolhida × peso do critério)**, e o projeto é classificado em
faixas (Baixa / Média / Alta) com limites configuráveis.

## Temas padrão

1. Aumento de Capacidade
2. Melhoria Operacional
3. Sustaining / Manutenção
4. Segurança e Meio Ambiente
5. Outros

Todos os temas, critérios, pesos, opções (A/B/C/D) e faixas podem ser editados no
próprio app.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (componentes Radix)
- **Zustand** (estado) com persistência automática em `localStorage`
- **Recharts** (gráfico de distribuição)
- **Vitest** + Testing Library (testes do motor de pontuação e smoke da UI)

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção (gera dist/)
npm run preview  # serve o build localmente
npm test         # roda os testes (Vitest)
```

## Como usar

- **Resultados** — ranking de priorização, KPIs, gráfico de distribuição por
  faixa e filtro por tema. Ordene por % do máximo ou por nota bruta.
- **Projetos** — cadastre/edite projetos. No formulário, escolha o tema e pontue
  o projeto nos critérios daquela cesta (a nota e a faixa aparecem ao vivo).
- **Temas** — edite os critérios de cada cesta: nome, descrição, **peso**, as
  **opções A/B/C/D** (rótulo, valor e descrição) e as **faixas** de classificação
  (use "Sugerir limites" para distribuir os cortes pela nota máxima).
- **Configurações** — Exportar / Importar todo o modelo em JSON e restaurar o
  padrão.

> Os dados ficam salvos **neste navegador** (localStorage). Use **Exportar JSON**
> para guardar, versionar ou compartilhar um modelo.

## Estrutura

```
src/
  lib/        types.ts · scoring.ts (motor) · seed.ts (conteúdo inicial) · id.ts · format.ts
  store/      useAppStore.ts (zustand + persist)
  components/
    ui/        componentes shadcn/ui
    common/    indicators.tsx (BandBadge, ThemeDot)
    results/   ResultsDashboard.tsx
    projects/  ProjectsView.tsx · ProjectDialog.tsx · ScorePanel.tsx
    themes/    ThemesView.tsx · CriterionEditor.tsx · BandEditor.tsx
    settings/  SettingsView.tsx
```

## Notas

- **OneDrive:** este projeto vive sob uma pasta sincronizada pelo OneDrive. O
  `node_modules/` está no `.gitignore`; se a sincronização ficar pesada,
  considere excluir a pasta do sync do OneDrive.
- O motor de pontuação (`src/lib/scoring.ts`) é puro e coberto por testes; a UI
  recalcula tudo automaticamente ao editar pesos/critérios.

## Roadmap (próximos ajustes)

- Code-splitting do bundle (recharts é pesado).
- Importação direta do `.xlsx` da matriz Usiminas.
- Exportar ranking para PDF/Excel.
- Modo escuro.
