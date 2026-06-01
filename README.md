

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

-

## Roadmap (próximos ajustes)

- Code-splitting do bundle (recharts é pesado).
- Importação direta do `.xlsx` da matriz Usiminas.
- Exportar ranking para PDF/Excel.
- Modo escuro.
