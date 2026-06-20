type EChartsLike = {
  registerTheme: (name: string, theme: Record<string, unknown>) => void;
};

const axisStyle = (textColor: string, lineColor: string) => ({
  axisLine: { lineStyle: { color: lineColor } },
  axisTick: { lineStyle: { color: lineColor } },
  axisLabel: { color: textColor },
  splitLine: { lineStyle: { color: [lineColor] } },
});

const createTheme = (
  colors: string[],
  backgroundColor: string,
  textColor: string,
  mutedColor: string,
  lineColor: string
) => ({
  color: colors,
  backgroundColor,
  textStyle: { color: textColor, fontFamily: 'Inter, sans-serif' },
  title: {
    textStyle: { color: textColor },
    subtextStyle: { color: mutedColor },
  },
  legend: {
    textStyle: { color: mutedColor },
  },
  tooltip: {
    backgroundColor: backgroundColor === 'transparent' ? '#ffffff' : backgroundColor,
    borderColor: lineColor,
    textStyle: { color: textColor },
  },
  categoryAxis: axisStyle(mutedColor, lineColor),
  valueAxis: axisStyle(mutedColor, lineColor),
  logAxis: axisStyle(mutedColor, lineColor),
  timeAxis: axisStyle(mutedColor, lineColor),
});

const THEMES = {
  dark: createTheme(['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091'], '#100c2a', '#f8fafc', '#cbd5e1', '#334155'),
  macarons: createTheme(['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3'], '#ffffff', '#293441', '#64748b', '#e2e8f0'),
  vintage: createTheme(['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d'], '#fef8ef', '#333333', '#8a7660', '#e6d6bd'),
  roma: createTheme(['#e01f54', '#001852', '#f5e8c8', '#b8d2c7', '#c6b38e', '#a4d8c2'], '#ffffff', '#2b2d42', '#64748b', '#e5e7eb'),
  shine: createTheme(['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8'], '#ffffff', '#1f2937', '#6b7280', '#e5e7eb'),
  infographic: createTheme(['#c1232b', '#27727b', '#fcce10', '#e87c25', '#b5c334', '#fe8463'], '#ffffff', '#1f2937', '#6b7280', '#e5e7eb'),
  'dark-blue': createTheme(['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78'], '#0f172a', '#f8fafc', '#cbd5e1', '#334155'),
  green: createTheme(['#408829', '#68a54a', '#a9cba2', '#86b379', '#397b29', '#8abb6f'], '#ffffff', '#1f3b2d', '#587466', '#d7e7dc'),
  red: createTheme(['#d7504b', '#c6e579', '#f4e001', '#f0805a', '#26c0c0', '#b5c334'], '#ffffff', '#3b1f1f', '#7f5b5b', '#ead6d6'),
  blue: createTheme(['#1790cf', '#1bb2d8', '#99d2dd', '#88b0bb', '#1c7099', '#038cc4'], '#ffffff', '#1e293b', '#64748b', '#dbeafe'),
  'tech-blue': createTheme(['#00c2ff', '#0075ff', '#7c3aed', '#22d3ee', '#38bdf8', '#818cf8'], '#08111f', '#e0f2fe', '#93c5fd', '#1e3a5f'),
  mint: createTheme(['#58d9a3', '#9fe6b8', '#32c5e9', '#67e0e3', '#9d96f5', '#ffdb5c'], '#ffffff', '#173b32', '#5f7f76', '#d7f3e8'),
};

let registered = false;

export function registerEchartsThemes(echarts: EChartsLike) {
  if (registered) return;

  Object.entries(THEMES).forEach(([name, theme]) => {
    echarts.registerTheme(name, theme);
  });

  registered = true;
}

export const DARK_CHART_THEMES = new Set(['dark', 'dark-blue', 'tech-blue']);
