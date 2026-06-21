import type { ChartType } from '@/types';

export const CHART_TYPES: ChartType[] = ['bar', 'line', 'pie', 'scatter', 'map', 'radar'];

export function isChartType(value: string | undefined): value is ChartType {
  return Boolean(value && CHART_TYPES.includes(value as ChartType));
}

export function getChartRoute(chartType: ChartType, projectId?: string | null) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return `/charts/${chartType}${query}`;
}
