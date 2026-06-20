# EasyChart Next.js

This is a Next.js port of the original EasyChart Vite app.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run test:unit
npm run build
```

- `lint` runs TypeScript in strict mode.
- `test:unit` covers pure chart utility logic without launching a browser.
- `build` verifies the production Next.js bundle.

## Engineering notes

- UI styling is centralized in `src/app/globals.css` and Tailwind classes in components.
- ECharts lifecycle code lives in `src/components/Chart.tsx`.
- Chart option construction lives in `src/lib/chart-option-builders.ts`.
- Function plotting uses a small allowlisted expression parser in `src/lib/function-plot.ts`; it does not execute arbitrary JavaScript.
