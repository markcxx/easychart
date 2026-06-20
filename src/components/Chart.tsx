"use client";

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  PolarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ChartData, ChartType, ChartOptions } from '@/types';
import { DARK_CHART_THEMES, registerEchartsThemes } from '@/lib/echarts-themes';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  PolarComponent,
  TitleComponent,
  TooltipComponent,
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

  return sourceSeries.map(series => ({
    name: series.name,
    type: 'bar',
    stack: getStackName(series.role, stack),
    barWidth: `${options.barWidth}%`,
    emphasis: { focus: 'series' },
    label: getLabelOption(options, fallbackPosition),
    data: categories.map((_, index) => {
      const value = series.data[index] ?? 0;
      if (series.role === 'negative') return -Math.abs(value);
      if (series.role === 'positive') return Math.abs(value);
      return value;
    }),
  }));
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
        data: ['总计', ...sourceCategories],
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
          data: [total, ...values],
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

      return {
        name: item.name,
        type: 'bar',
        stack: isStacked ? '总量' : undefined,
        barWidth: `${options.barWidth}%`,
        label: getLabelOption(options, isNegative ? 'left' : 'inside'),
        emphasis: { focus: 'series' },
        data: categories.map((_, index) => {
          const value = item.data[index] ?? 0;
          if (role === 'negative') return -Math.abs(value);
          if (role === 'positive' || role === 'stack') return Math.abs(value);
          return value;
        }),
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
    const maxValue = Math.max(...allValues, 1);
    const minValue = positiveValues.length ? Math.min(...positiveValues) : 0;
    const hasLargeGap = minValue > 0 && maxValue / minValue > 20;
    const breaks = [
      { start: Math.round(maxValue * 0.18), end: Math.round(maxValue * 0.45), gap: '1.5%' },
      { start: Math.round(maxValue * 0.5), end: Math.round(maxValue * 0.82), gap: '1.5%' },
    ];

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
              data: s.data,
              barWidth: isBar ? `${options.barWidth}%` : undefined,
              symbolSize: chartType === 'scatter' ? options.barWidth / 2 : undefined,
              lineStyle: isLine ? { width: options.barWidth / 10 } : undefined,
              itemStyle,
              stack: stackName,
              smooth: isLine && (options.subType === 'smooth' || options.subType === 'bump' || options.smoothLine) ? true : undefined,
              step: isLine && (options.subType === 'step' || options.stepLine) ? 'middle' : undefined,
              areaStyle,
              label: {
                   show: options.showDataLabels,
                   position: isHorizontal && options.labelPosition === 'top' ? 'right' : options.labelPosition
              }
            };
        });
    }

    const echartsOption = chartType === 'bar' && options.subType && officialBarSubTypes.has(options.subType)
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
