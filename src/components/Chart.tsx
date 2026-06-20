"use client";

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { AxisBreak } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import type { ChartData, ChartOptions, ChartType } from '@/types';
import { DARK_CHART_THEMES, registerEchartsThemes } from '@/lib/echarts-themes';
import { buildChartOption } from '@/lib/chart-option-builders';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  TitleComponent,
  TooltipComponent,
  AxisBreak,
  CanvasRenderer,
]);

registerEchartsThemes(echarts);

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
