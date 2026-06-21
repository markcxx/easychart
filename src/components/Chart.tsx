"use client";

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, MapChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts';
import {
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  RadarComponent,
  SingleAxisComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { AxisBreak } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import type { ChartData, ChartOptions, ChartType } from '@/types';
import { DARK_CHART_THEMES, registerEchartsThemes } from '@/lib/echarts-themes';
import { buildChartOption } from '@/lib/chart-option-builders';
import { clusterScatterPoints, SCATTER_CLUSTER_COUNT, SCATTER_CLUSTER_DIMENSION_INDEX } from '@/lib/scatter-clustering';
import { registerBuiltinMaps } from '@/lib/map-geodata';

echarts.use([
  BarChart,
  LineChart,
  MapChart,
  PieChart,
  RadarChart,
  ScatterChart,
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  RadarComponent,
  SingleAxisComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  AxisBreak,
  CanvasRenderer,
]);

registerEchartsThemes(echarts);
registerBuiltinMaps(echarts);

type ClusteringTransformParam = {
  upstream: {
    count: () => number;
    retrieveValue: (dataIndex: number, dimIndex: number) => unknown;
  };
  config?: {
    clusterCount?: number;
    outputClusterIndexDimension?: number;
  };
};

const clusteringTransformKey = '__easychartClusteringTransformRegistered';
const globalScope = globalThis as typeof globalThis & Record<string, boolean | undefined>;

if (!globalScope[clusteringTransformKey]) {
  echarts.registerTransform({
    type: 'ecStat:clustering',
    transform: (param: ClusteringTransformParam) => {
      const clusterCount = param.config?.clusterCount ?? SCATTER_CLUSTER_COUNT;
      const clusterDimension = param.config?.outputClusterIndexDimension ?? SCATTER_CLUSTER_DIMENSION_INDEX;
      const points = Array.from({ length: param.upstream.count() }, (_, index) => {
        const x = Number(param.upstream.retrieveValue(index, 0));
        const y = Number(param.upstream.retrieveValue(index, 1));
        return [x, y] as [number, number];
      }).filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
      const clusteredPoints = clusterScatterPoints(points, clusterCount).map((point) => {
        const row: number[] = [point[0], point[1]];
        row[clusterDimension] = point[2];
        return row;
      });

      return {
        data: clusteredPoints,
        dimensions: ['x', 'y', 'cluster'],
      };
    },
  } as Parameters<typeof echarts.registerTransform>[0]);
  globalScope[clusteringTransformKey] = true;
}

interface ChartProps {
  id?: string;
  className?: string;
  isSidebarCollapsed: boolean;
  theme?: string;
  data: ChartData;
  options: ChartOptions;
  chartType: ChartType;
}

export function Chart({ id, className, isSidebarCollapsed, theme = 'default', data, options, chartType }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const chartTheme = useRef<string>('default');

  useEffect(() => {
    if (!chartRef.current) return;

    const validTheme = theme === 'default' ? undefined : theme;
    const isDarkTheme = validTheme ? DARK_CHART_THEMES.has(validTheme) : false;

    if (!chartInstance.current || chartTheme.current !== theme) {
      chartInstance.current?.dispose();
      chartInstance.current = echarts.init(chartRef.current, validTheme);
      chartTheme.current = theme;
    }

    const echartsOption = buildChartOption({
      data,
      options,
      chartType,
      theme,
      isDarkTheme,
      hasTheme: Boolean(validTheme),
    });

    chartInstance.current.setOption(echartsOption, { notMerge: true, lazyUpdate: false });
    window.requestAnimationFrame(() => chartInstance.current?.resize());
  }, [theme, data, options, chartType]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    const timeout = window.setTimeout(handleResize, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(timeout);
    };
  }, [isSidebarCollapsed]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return <div id={id} ref={chartRef} className={className} />;
}
