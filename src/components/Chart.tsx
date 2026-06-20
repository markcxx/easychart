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
import { ChartData, ChartType, ChartOptions } from '@/types';
import { DARK_CHART_THEMES, registerEchartsThemes } from '@/lib/echarts-themes';

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

const officialBarSubTypes = new Set([
  'waterfall',
  'negative-staggered',
  'negative-bar',
  'broken-axis',
  'rounded-stacked',
  'stacked',
  'stacked-horizontal',
]);

const specialLineSubTypes = new Set(['multi-x', 'function-plot']);

function getLabelOption(options: ChartOptions, fallbackPosition: string = 'top') {
  const position = options.labelPosition === 'none' ? fallbackPosition : options.labelPosition;

  return {
    show: options.showDataLabels,
    position,
  };
}

function getTitleOption(options: ChartOptions, isDarkTheme: boolean) {
  if (!options.showTitle) return undefined;

  return {
    text: options.title,
    subtext: options.subtitle,
    left: options.titleAlign,
    textStyle: {
      fontFamily: 'Inter, sans-serif',
      fontSize: options.titleSize,
      fontWeight: options.titleBold ? 'bold' : 'normal',
      color: isDarkTheme ? '#fff' : '#1a1c1a',
    },
    subtextStyle: {
      fontFamily: 'Inter, sans-serif',
      color: isDarkTheme ? '#cbd5e1' : '#737686',
    },
  };
}

function getTooltipOption(options: ChartOptions, isPie = false) {
  if (!options.showTooltip) return undefined;

  return {
    trigger: isPie ? 'item' : 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: `rgba(255, 255, 255, ${options.tooltipAlpha})`,
    borderColor: '#e3e2e0',
    borderWidth: 1,
    textStyle: { color: '#1a1c1a', fontFamily: 'Inter, sans-serif' },
    padding: [10, 15],
    borderRadius: 8,
    shadowBlur: 10,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  };
}

function getMarkerName(type: string, fallback: string) {
  if (fallback) return fallback;
  if (type === 'max') return '最大值';
  if (type === 'min') return '最小值';
  if (type === 'average') return '平均值';
  return '自定义';
}

function getMarkerCoord(category: string, value: number, isHorizontal = false) {
  return isHorizontal ? [value, category] : [category, value];
}

function getAverageMarkerPoint(name: string, categories: string[], values: number[], isHorizontal = false) {
  const validValues = values.filter(value => Number.isFinite(value));
  const average = validValues.length
    ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    : 0;
  const closestIndex = values.reduce((closest, value, index) => {
    return Math.abs(value - average) < Math.abs(values[closest] - average) ? index : closest;
  }, 0);
  const value = Number(average.toFixed(2));

  return {
    name,
    value,
    coord: getMarkerCoord(categories[closestIndex] || categories[0] || '', value, isHorizontal),
  };
}

function getSeriesMarkers(
  data: ChartData,
  options: ChartOptions,
  seriesIndex: number,
  categories: string[],
  values: number[],
  isHorizontal = false
) {
  const markLines = (data.markLines || []).filter(marker => marker.seriesIndex == null || marker.seriesIndex === seriesIndex);
  const markPoints = (data.markPoints || []).filter(marker => marker.seriesIndex == null || marker.seriesIndex === seriesIndex);

  const markLineData = markLines.map(marker => {
    const name = getMarkerName(marker.type, marker.name);

    if (marker.type === 'custom') {
      return isHorizontal
        ? { name, xAxis: marker.value ?? 0 }
        : { name, yAxis: marker.value ?? 0 };
    }

    return { name, type: marker.type };
  });

  const markPointData = markPoints.map(marker => {
    const name = getMarkerName(marker.type, marker.name);

    if (marker.type === 'average') {
      return getAverageMarkerPoint(name, categories, values, isHorizontal);
    }

    if (marker.type === 'custom') {
      const categoryIndex = marker.categoryIndex ?? 0;
      const value = marker.value ?? values[categoryIndex] ?? 0;

      return {
        name,
        value,
        coord: getMarkerCoord(categories[categoryIndex] || categories[0] || '', value, isHorizontal),
      };
    }

    return { name, type: marker.type };
  });

  return {
    markLine: options.showMarkLine && markLineData.length
      ? {
        symbol: ['none', 'none'],
        lineStyle: {
          type: options.markLineType,
          color: options.markLineColor,
          width: 2,
        },
        label: {
          color: options.markLineColor,
        },
        data: markLineData,
      }
      : undefined,
    markPoint: options.showMarkPoint && markPointData.length
      ? {
        symbol: options.markPointSymbol === 'none' ? 'pin' : options.markPointSymbol,
        symbolSize: options.markPointSymbolSize,
        itemStyle: {
          color: options.markPointColor,
        },
        label: {
          color: '#fff',
          fontWeight: 'bold',
        },
        data: markPointData,
      }
      : undefined,
  };
}

function withRoundedStackEnds(series: any[]) {
  const stackInfo: Record<string, { stackStart: number[]; stackEnd: number[] }> = {};

  for (let i = 0; i < series[0].data.length; ++i) {
    for (let j = 0; j < series.length; ++j) {
      const stackName = series[j].stack;
      if (!stackName) continue;

      if (!stackInfo[stackName]) {
        stackInfo[stackName] = { stackStart: [], stackEnd: [] };
      }

      const data = series[j].data[i];
      if (data && data !== '-') {
        if (stackInfo[stackName].stackStart[i] == null) {
          stackInfo[stackName].stackStart[i] = j;
        }
        stackInfo[stackName].stackEnd[i] = j;
      }
    }
  }

  return series.map((item, seriesIndex) => ({
    ...item,
    data: item.data.map((value: number | string, index: number) => {
      const info = stackInfo[item.stack];
      const isEnd = info?.stackEnd[index] === seriesIndex;

      return {
        value,
        itemStyle: {
          borderRadius: [isEnd ? 20 : 0, isEnd ? 20 : 0, 0, 0],
        },
      };
    }),
  }));
}

function getChartCategories(data: ChartData) {
  return data.categories.length ? data.categories : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
}

function getSeriesValues(data: ChartData, index: number, categories: string[]) {
  const source = data.series[index]?.data || data.series[0]?.data || [];
  return categories.map((_, itemIndex) => Math.abs(Math.round(source[itemIndex] ?? 0)));
}

function getEditableSeries(data: ChartData, options: ChartOptions, stack?: string, fallbackPosition = 'top') {
  const categories = getChartCategories(data);
  const sourceSeries = data.series.length
    ? data.series
    : [{ name: '系列1', data: categories.map(() => 0) }];

  return sourceSeries.map((series, seriesIndex) => {
    const values = categories.map((_, index) => {
      const value = series.data[index] ?? 0;
      if (series.role === 'negative') return -Math.abs(value);
      if (series.role === 'positive') return Math.abs(value);
      return value;
    });

    return {
      name: series.name,
      type: 'bar',
      stack: getStackName(series.role, stack),
      barWidth: `${options.barWidth}%`,
      emphasis: { focus: 'series' },
      label: getLabelOption(options, fallbackPosition),
      data: values,
      ...getSeriesMarkers(data, options, seriesIndex, categories, values),
    };
  });
}

function getStackName(role: ChartData['series'][number]['role'], defaultStack?: string) {
  if (role === 'normal') return undefined;
  if (role === 'stack' || role === 'positive' || role === 'negative') return defaultStack || '总量';
  return defaultStack;
}

function getCategoryAxis(categories: string[], options: ChartOptions, isHorizontal = false) {
  return {
    type: isHorizontal ? 'value' : 'category',
    data: isHorizontal ? undefined : categories,
    axisLabel: { show: options.showXAxis },
    axisTick: { show: options.showXAxis },
    axisLine: { show: options.showXAxis },
    splitLine: { show: isHorizontal && options.showYSplitLine, lineStyle: { type: options.ySplitLineType } },
  };
}

function getValueAxis(options: ChartOptions, categories?: string[]) {
  return {
    type: categories ? 'category' : 'value',
    data: categories,
    axisLabel: { show: options.showXAxis },
    axisTick: { show: options.showXAxis },
    axisLine: { show: options.showXAxis },
    splitLine: { show: !categories && options.showYSplitLine, lineStyle: { type: options.ySplitLineType } },
  };
}

function getBarGrid(options: ChartOptions, topWhenTitle = 90, topWithoutTitle = 24) {
  return {
    left: '5%',
    right: '5%',
    top: options.showTitle ? topWhenTitle : topWithoutTitle,
    bottom: options.showXAxis ? '8%' : '5%',
    containLabel: options.showXAxis,
  };
}

function getAxisBreaksFromValues(values: number[]) {
  const sortedValues = Array.from(new Set(values.filter(value => value > 0).sort((a, b) => a - b)));
  if (sortedValues.length < 2) return [];

  const gaps = sortedValues
    .slice(0, -1)
    .map((value, index) => {
      const nextValue = sortedValues[index + 1];
      return {
        index,
        startValue: value,
        endValue: nextValue,
        ratio: nextValue / Math.max(value, 1),
        distance: nextValue - value,
      };
    })
    .filter(gap => gap.ratio >= 4 && gap.distance > 0);

  return gaps
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)
    .map(gap => {
      const padding = gap.distance * 0.05;

      return {
        start: Math.ceil(gap.startValue + padding),
        end: Math.floor(gap.endValue - padding),
        gap: '1.5%',
      };
    })
    .filter(gap => gap.end > gap.start);
}

function inferNegativeBarRole(seriesIndex: number, seriesCount: number) {
  if (seriesCount === 1) return 'normal';
  if (seriesCount === 2) return seriesIndex === 1 ? 'negative' : 'positive';
  if (seriesIndex === 1) return 'positive';
  if (seriesIndex === 2) return 'negative';
  return 'normal';
}

function buildOfficialBarOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean) {
  const categories = getChartCategories(data);
  const common = {
    animationDuration: options.animationDuration,
    backgroundColor: options.backgroundColor || 'transparent',
    title: getTitleOption(options, isDarkTheme),
    tooltip: getTooltipOption(options),
  };

  if (options.subType === 'waterfall') {
    const sourceCategories = categories.slice(0, 6);
    const values = getSeriesValues(data, 0, sourceCategories);
    const total = values.reduce((sum, value) => sum + value, 0);
    const waterfallCategories = ['总计', ...sourceCategories];
    const waterfallValues = [total, ...values];
    let remaining = total;
    const placeholder = [0, ...values.map(value => {
      remaining -= value;
      return Math.max(remaining, 0);
    })];

    return {
      ...common,
      grid: { left: '3%', right: '4%', bottom: '3%', top: options.showTitle ? 80 : 20, containLabel: true },
      xAxis: {
        type: 'category',
        splitLine: { show: false },
        data: waterfallCategories,
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '占位',
          type: 'bar',
          stack: '总量',
          itemStyle: { borderColor: 'transparent', color: 'transparent' },
          emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
          data: placeholder,
        },
        {
          name: data.series[0]?.name || '变化值',
          type: 'bar',
          stack: '总量',
          label: getLabelOption(options, 'inside'),
          data: waterfallValues,
          ...getSeriesMarkers(data, options, 0, waterfallCategories, waterfallValues),
        },
      ],
    };
  }

  if (options.subType === 'negative-staggered') {
    const labelRight = { position: 'right' };
    const sourceCategories = categories.slice(0, 10);
    const sourceValues = sourceCategories.map((_, index) => data.series[0]?.data[index] ?? 0);
    const hasNegativeValue = sourceValues.some(value => value < 0);
    const values = sourceValues.map((value, index) => {
      if (hasNegativeValue) return value;
      return index % 2 === 0 ? -Math.abs(value) : Math.abs(value);
    });

    return {
      ...common,
      grid: { top: options.showTitle ? 80 : 30, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        position: 'top',
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        axisLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        data: sourceCategories,
      },
      series: [
        {
          name: data.series[0]?.name || '指标',
          type: 'bar',
          stack: '总量',
          label: options.showDataLabels
            ? { show: true, formatter: '{b}', position: options.labelPosition === 'none' ? 'inside' : options.labelPosition }
            : { show: false },
          data: values.map(value => value < 0 ? { value, label: labelRight } : value),
          ...getSeriesMarkers(data, options, 0, sourceCategories, values, true),
        },
      ],
    };
  }

  if (options.subType === 'negative-bar') {
    const roleSeries = data.series.length ? data.series : [{ name: '利润', data: categories.map(() => 0) }];
    const series = roleSeries.map((item, seriesIndex) => {
      const role = item.role || inferNegativeBarRole(seriesIndex, roleSeries.length);
      const isNegative = role === 'negative';
      const isStacked = role === 'positive' || role === 'negative' || role === 'stack';
      const values = categories.map((_, index) => {
        const value = item.data[index] ?? 0;
        if (role === 'negative') return -Math.abs(value);
        if (role === 'positive' || role === 'stack') return Math.abs(value);
        return value;
      });

      return {
        name: item.name,
        type: 'bar',
        stack: isStacked ? '总量' : undefined,
        barWidth: `${options.barWidth}%`,
        label: getLabelOption(options, isNegative ? 'left' : 'inside'),
        emphasis: { focus: 'series' },
        data: values,
        ...getSeriesMarkers(data, options, seriesIndex, categories, values, true),
      };
    });

    return {
      ...common,
      legend: options.showLegend ? { data: series.map(item => item.name) } : undefined,
      grid: getBarGrid(options),
      xAxis: [getCategoryAxis(categories, options, true)],
      yAxis: [getValueAxis(options, categories)],
      series,
    };
  }

  if (options.subType === 'broken-axis') {
    const editableSeries = getEditableSeries(data, options);
    const allValues = editableSeries.flatMap(series => series.data as number[]);
    const positiveValues = allValues.filter(value => value > 0);
    const breaks = getAxisBreaksFromValues(positiveValues);
    const hasLargeGap = breaks.length > 0;

    return {
      ...common,
      legend: options.showLegend ? {} : undefined,
      grid: getBarGrid(options, 120, 28),
      xAxis: [getCategoryAxis(categories, options)],
      yAxis: [
        {
          type: 'value',
          breaks: hasLargeGap ? breaks : undefined,
          breakArea: hasLargeGap
            ? {
              itemStyle: { opacity: 1 },
              zigzagZ: 200,
            }
            : undefined,
        },
      ],
      series: editableSeries,
    };
  }

  if (options.subType === 'rounded-stacked') {
    const series = withRoundedStackEnds(getEditableSeries(data, options, '总量'))
      .map(seriesItem => ({ ...seriesItem, label: getLabelOption(options) }));

    return {
      ...common,
      legend: options.showLegend ? {} : undefined,
      grid: getBarGrid(options),
      xAxis: getCategoryAxis(categories, options),
      yAxis: getValueAxis(options),
      series,
    };
  }

  if (options.subType === 'stacked-horizontal') {
    return {
      ...common,
      legend: options.showLegend ? {} : undefined,
      grid: getBarGrid(options),
      xAxis: getCategoryAxis(categories, options, true),
      yAxis: getValueAxis(options, categories),
      series: getEditableSeries(data, options, '总量', 'inside'),
    };
  }

  return {
    ...common,
    legend: options.showLegend ? {} : undefined,
    grid: getBarGrid(options),
    xAxis: [getCategoryAxis(categories, options)],
    yAxis: [getValueAxis(options)],
    series: getEditableSeries(data, options, '总量'),
  };
}

function getFunctionPlotData() {
  const result: number[][] = [];

  for (let i = -200; i <= 200; i += 0.5) {
    const x = i / 10;
    const y = Math.sin(x) * Math.cos(x * 2 + 1) * Math.sin(x * 3 + 2) * 50;
    result.push([Number(i.toFixed(1)), Number(y.toFixed(4))]);
  }

  return result;
}

function getSecondaryCategories(data: ChartData, categories: string[]) {
  if (data.secondaryCategories?.length === categories.length) {
    return data.secondaryCategories;
  }

  return categories.map((category, index) => `${category}-对比${index + 1}`);
}

function buildSpecialLineOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean) {
  const categories = getChartCategories(data);
  const common = {
    animationDuration: options.animationDuration,
    backgroundColor: options.backgroundColor || 'transparent',
    title: getTitleOption(options, isDarkTheme),
  };

  if (options.subType === 'function-plot') {
    return {
      ...common,
      animation: false,
      tooltip: options.showTooltip
        ? {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          backgroundColor: `rgba(255, 255, 255, ${options.tooltipAlpha})`,
          borderColor: '#e3e2e0',
          borderWidth: 1,
          textStyle: { color: '#1a1c1a', fontFamily: 'Inter, sans-serif' },
          padding: [10, 15],
          borderRadius: 8,
        }
        : undefined,
      grid: {
        top: options.showTitle ? 80 : 40,
        left: 50,
        right: 40,
        bottom: 50,
      },
      xAxis: {
        name: 'x',
        minorTick: { show: true },
        minorSplitLine: { show: true },
      },
      yAxis: {
        name: 'y',
        min: -100,
        max: 100,
        minorTick: { show: true },
        minorSplitLine: { show: true },
      },
      dataZoom: [
        {
          show: true,
          type: 'inside',
          filterMode: 'none',
          xAxisIndex: [0],
          startValue: -20,
          endValue: 20,
        },
        {
          show: true,
          type: 'inside',
          filterMode: 'none',
          yAxisIndex: [0],
          startValue: -20,
          endValue: 20,
        },
      ],
      series: [
        {
          name: '函数曲线',
          type: 'line',
          showSymbol: false,
          clip: true,
          lineStyle: { width: options.barWidth / 10 },
          data: getFunctionPlotData(),
        },
      ],
    };
  }

  const colors = ['#5470C6', '#EE6666'];
  const secondaryCategories = getSecondaryCategories(data, categories);
  const sourceSeries = data.series.length
    ? data.series
    : [{ name: '系列1', data: categories.map(() => 0) }];

  return {
    ...common,
    color: colors,
    tooltip: options.showTooltip
      ? {
        trigger: 'none',
        axisPointer: { type: 'cross' },
        backgroundColor: `rgba(255, 255, 255, ${options.tooltipAlpha})`,
        borderColor: '#e3e2e0',
        borderWidth: 1,
        textStyle: { color: '#1a1c1a', fontFamily: 'Inter, sans-serif' },
        padding: [10, 15],
        borderRadius: 8,
      }
      : undefined,
    legend: options.showLegend ? {} : undefined,
    grid: {
      top: options.showTitle ? 90 : 70,
      bottom: 50,
      left: '5%',
      right: '5%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        position: 'bottom',
        axisTick: { alignWithLabel: true, show: options.showXAxis },
        axisLabel: { show: options.showXAxis, rotate: options.xLabelRotate },
        axisLine: {
          onZero: false,
          show: options.showXAxis,
          lineStyle: { color: colors[1] },
        },
        axisPointer: {
          label: {
            formatter: (params: any) => `主 X 轴 ${params.value}${params.seriesData.length ? `：${params.seriesData[0].data}` : ''}`,
          },
        },
        data: categories,
      },
      {
        type: 'category',
        position: 'top',
        axisTick: { alignWithLabel: true, show: options.showXAxis },
        axisLabel: { show: options.showXAxis, rotate: options.xLabelRotate },
        axisLine: {
          onZero: false,
          show: options.showXAxis,
          lineStyle: { color: colors[0] },
        },
        axisPointer: {
          label: {
            formatter: (params: any) => `第二 X 轴 ${params.value}${params.seriesData.length ? `：${params.seriesData[0].data}` : ''}`,
          },
        },
        data: secondaryCategories,
      },
    ],
    yAxis: [
      {
        type: 'value',
        splitLine: {
          show: options.showYSplitLine,
          lineStyle: { type: options.ySplitLineType },
        },
      },
    ],
    series: sourceSeries.map((series, seriesIndex) => {
      const xAxisIndex = sourceSeries.length > 1 && seriesIndex % 2 === 0 ? 1 : 0;
      const axisCategories = xAxisIndex === 1 ? secondaryCategories : categories;
      const values = axisCategories.map((_, index) => series.data[index] ?? 0);

      return {
        name: series.name,
        type: 'line',
        xAxisIndex,
        smooth: options.smoothLine,
        symbol: options.lineSymbol,
        showSymbol: options.lineSymbol !== 'none',
        symbolSize: options.lineSymbolSize,
        lineStyle: { width: options.barWidth / 10 },
        emphasis: { focus: 'series' },
        label: getLabelOption(options, 'top'),
        data: values,
        ...getSeriesMarkers(data, options, seriesIndex, axisCategories, values),
      };
    }),
  };
}

export function Chart({ id, className, isSidebarCollapsed, theme = 'default', data, options, chartType }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
        chartInstance.current.dispose();
    }

    // Init echarts with the selected theme, default needs to be undefined
    const validTheme = theme === 'default' ? undefined : theme;
    const isDarkTheme = validTheme ? DARK_CHART_THEMES.has(validTheme) : false;
    chartInstance.current = echarts.init(chartRef.current, validTheme);

    const isPie = chartType === 'pie';
    const isHorizontal = options.subType === 'horizontal' && chartType === 'bar';
    
    // Construct series dynamically
    let seriesData: any[] = [];
    
    if (isPie) {
       // Combine all series into nested rings or just use the first series for simplicity.
       // Let's use the first series
       const s = data.series[0];
       if (s) {
           seriesData = [{
              type: 'pie',
              name: s.name,
              radius: options.subType === 'basic' ? '70%' : ['40%', '70%'],
              data: data.categories.map((c, i) => ({ name: c, value: s.data[i] || 0 })),
              label: {
                  show: options.showDataLabels,
                  position: options.labelPosition === 'none' ? 'outside' : options.labelPosition
              }
           }];
       }
    } else {
        seriesData = data.series.map((s, idx) => {
            const isBar = chartType === 'bar';
            const isLine = chartType === 'line';
            const isPolar = options.subType === 'polar-label' && isBar;
            const values = data.categories.map((_, dataIndex) => s.data[dataIndex] ?? 0);
            
            let itemStyle: any = undefined;
            if (isBar) {
              if (options.subType === 'rounded' || options.subType === 'rounded-stacked') {
                itemStyle = { borderRadius: isHorizontal ? [0, 20, 20, 0] : [20, 20, 0, 0] };
              } else {
                itemStyle = { borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] };
              }
              if (options.subType === 'waterfall' && idx === 0) {
                itemStyle = { ...itemStyle, borderColor: 'transparent', color: 'transparent' };
              }
            }

            let areaStyle: any = undefined;
            if (isLine) {
                if (options.subType === 'area' || options.subType === 'stacked-area' || options.subType === 'gradient-stacked-area' || options.fillArea) {
                    areaStyle = {};
                    if (options.subType === 'gradient-stacked-area') {
                        areaStyle = {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(58,77,233,0.8)' },
                                { offset: 1, color: 'rgba(58,77,233,0.3)' }
                            ])
                        };
                    }
                }
            }

            let stackName = undefined;
            if (options.subType === 'stacked' || options.subType === 'stacked-area' || options.subType === 'gradient-stacked-area' || options.subType === 'rounded-stacked' || options.subType === 'waterfall') {
                stackName = 'total';
            }

            return {
              name: s.name,
              type: chartType,
              coordinateSystem: isPolar ? 'polar' : 'cartesian2d',
              data: values,
              barWidth: isBar ? `${options.barWidth}%` : undefined,
              symbol: isLine ? options.lineSymbol : undefined,
              showSymbol: isLine ? options.lineSymbol !== 'none' : undefined,
              symbolSize: isLine ? options.lineSymbolSize : chartType === 'scatter' ? options.barWidth / 2 : undefined,
              lineStyle: isLine ? { width: options.barWidth / 10 } : undefined,
              itemStyle,
              stack: stackName,
              smooth: isLine && (options.subType === 'smooth' || options.subType === 'bump' || options.smoothLine) ? true : undefined,
              step: isLine && (options.subType === 'step' || options.stepLine) ? 'middle' : undefined,
              areaStyle,
              label: {
                   show: options.showDataLabels,
                   position: isHorizontal && options.labelPosition === 'top' ? 'right' : options.labelPosition
              },
              ...(isBar || isLine ? getSeriesMarkers(data, options, idx, data.categories, values, isHorizontal) : {})
            };
        });
    }

    const echartsOption = chartType === 'line' && options.subType && specialLineSubTypes.has(options.subType)
      ? buildSpecialLineOption(data, options, isDarkTheme)
      : chartType === 'bar' && options.subType && officialBarSubTypes.has(options.subType)
        ? buildOfficialBarOption(data, options, isDarkTheme)
        : {
      animationDuration: options.animationDuration,
      backgroundColor: options.backgroundColor || (validTheme ? undefined : 'transparent'),
      color: validTheme ? undefined : ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#818cf8', '#a78bfa'],
      title: getTitleOption(options, isDarkTheme),
      tooltip: options.showTooltip ? {
        trigger: isPie ? 'item' : 'axis',
        axisPointer: { type: chartType === 'bar' ? 'shadow' : 'line' },
        backgroundColor: `rgba(255, 255, 255, ${options.tooltipAlpha})`,
        borderColor: '#e3e2e0',
        borderWidth: 1,
        textStyle: { color: '#1a1c1a', fontFamily: 'Inter, sans-serif' },
        padding: [10, 15],
        borderRadius: 8,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.1)'
      } : undefined,
      legend: options.showLegend ? {
        data: isPie ? data.categories : data.series.map(s => s.name),
        type: options.legendType || 'plain',
        orient: options.legendLayout,
        bottom: options.legendLayout === 'horizontal' ? 0 : 'center',
        right: options.legendLayout === 'vertical' ? 0 : 'center',
        left: options.legendLayout === 'horizontal' ? 'center' : undefined,
        icon: 'roundRect',
        itemWidth: 16,
        itemHeight: 8,
        textStyle: { color: isDarkTheme ? '#cbd5e1' : '#434655', fontFamily: 'Inter, sans-serif', fontSize: 13 }
      } : undefined,
      grid: !options.showGrid || isPie || options.subType === 'polar-label' ? { show: false, left: '5%', right: '5%', bottom: options.showLegend && options.legendLayout === 'horizontal' ? '12%' : '5%', top: options.showTitle ? '20%' : '10%', containLabel: true } : {
        show: true,
        left: '5%', right: '5%', bottom: options.showLegend && options.legendLayout === 'horizontal' ? '12%' : '5%', top: options.showTitle ? '20%' : '10%',
        containLabel: true,
        borderColor: isDarkTheme ? '#334155' : '#eee'
      },
      polar: options.subType === 'polar-label' ? { radius: [30, '80%'] } : undefined,
      angleAxis: options.subType === 'polar-label' ? { type: 'value', startAngle: 90 } : undefined,
      radiusAxis: options.subType === 'polar-label' ? { type: 'category', data: data.categories } : undefined,
      xAxis: isPie || options.subType === 'polar-label' ? undefined : {
        show: options.showXAxis,
        type: isHorizontal ? 'value' : 'category',
        data: isHorizontal ? undefined : data.categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
           color: isDarkTheme ? '#cbd5e1' : '#57657a', 
           fontFamily: 'Inter, sans-serif', 
           margin: 15,
           rotate: options.xLabelRotate 
        },
        splitLine: isHorizontal ? { show: options.showYSplitLine, lineStyle: { type: options.ySplitLineType, color: isDarkTheme ? '#334155' : '#e9e8e5' } } : undefined
      },
      yAxis: isPie || options.subType === 'polar-label' ? undefined : {
        type: isHorizontal ? 'category' : (options.subType === 'log' ? 'log' : 'value'),
        data: isHorizontal ? data.categories : undefined,
        logBase: options.subType === 'log' ? 10 : undefined,
        splitLine: isHorizontal ? { show: false } : { 
            show: options.showYSplitLine,
            lineStyle: { type: options.ySplitLineType, color: isDarkTheme ? '#334155' : '#e9e8e5' } 
        },
        axisLabel: { color: isDarkTheme ? '#cbd5e1' : '#57657a', fontFamily: 'Inter, sans-serif' }
      },
      series: seriesData
    };

    chartInstance.current.setOption(echartsOption);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    
    // Also resize when sidebar collapses/expands
    const timeout = setTimeout(() => {
        handleResize();
    }, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [isSidebarCollapsed, theme, data, options, chartType]);

  return <div id={id} ref={chartRef} className={className} />;
}
