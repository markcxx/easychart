import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import type { ChartData, ChartDataPointStyle, ChartOptions, ChartSeries, ChartSubType, ChartType, ScatterPoint } from '@/types';
import { generateFunctionPlotData, normalizeFunctionPlot } from '@/lib/function-plot';
import { SCATTER_CLUSTER_COLORS, SCATTER_CLUSTER_COUNT, SCATTER_CLUSTER_DIMENSION_INDEX } from '@/lib/scatter-clustering';
import { CHINA_CITY_POINTS, getMapName } from '@/lib/map-geodata';
import { getEchartsThemePalette } from '@/lib/echarts-themes';

interface BuildChartOptionParams {
  data: ChartData;
  options: ChartOptions;
  chartType: ChartType;
  theme?: string;
  isDarkTheme: boolean;
  hasTheme: boolean;
}

interface AxisPointerLabelParams {
  value: string | number;
  seriesData?: Array<{ data?: unknown }>;
}

type MarkerCoord = [string | number, string | number];
type SeriesDataItem = number | string | { value: number | string; itemStyle?: Record<string, unknown>; label?: Record<string, unknown> };
type SeriesOption = Record<string, unknown> & {
  name: string;
  type: string;
  data: SeriesDataItem[];
  stack?: string;
};

const officialBarSubTypes = new Set<ChartSubType>([
  'waterfall',
  'negative-staggered',
  'negative-bar',
  'broken-axis',
  'rounded-stacked',
  'stacked',
  'stacked-horizontal',
]);

const specialLineSubTypes = new Set<ChartSubType>(['multi-x', 'function-plot']);

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

function shouldShowAxisLabels(options: ChartOptions) {
  return options.showAxisLabels ?? options.showXAxis;
}

function shouldShowSplitLine(options: ChartOptions) {
  return options.showGrid && options.showYSplitLine;
}

function getAnimationOption(options: ChartOptions) {
  const enabled = options.animationDuration > 0;

  return {
    animation: enabled,
    animationDuration: options.animationDuration,
    animationDurationUpdate: options.animationDuration,
    animationDelay: enabled ? (index: number) => Math.min(index * 45, 900) : 0,
    animationDelayUpdate: enabled ? (index: number) => Math.min(index * 20, 500) : 0,
    animationEasing: 'cubicOut' as const,
    animationEasingUpdate: 'cubicOut' as const,
  };
}

function getLinePalette(options: ChartOptions) {
  return [
    options.lineColor,
    options.secondaryLineColor,
    '#60a5fa',
    '#a78bfa',
    '#22c55e',
    '#f59e0b',
  ].filter(Boolean);
}

function getDefaultLineColor(options: ChartOptions, seriesIndex: number) {
  const palette = getLinePalette(options);
  return palette[seriesIndex % palette.length];
}

function hasCustomSeriesStyle(series: ChartSeries | undefined) {
  return series?.useCustomStyle === true;
}

function getSeriesBarWidth(options: ChartOptions, series: ChartSeries | undefined) {
  return `${hasCustomSeriesStyle(series) ? series?.barWidth ?? options.barWidth : options.barWidth}%`;
}

function hasCustomBarPointStyle(data: ChartData, series: ChartSeries | undefined, dataIndex: number) {
  if (data.barItemStyle?.enabled !== true) return false;
  const style = series?.dataPointStyles?.[dataIndex];
  return Boolean(style?.color || style?.barWidth);
}

function getCustomBarPointStyle(data: ChartData, series: ChartSeries | undefined, dataIndex: number): ChartDataPointStyle | undefined {
  return hasCustomBarPointStyle(data, series, dataIndex)
    ? series?.dataPointStyles?.[dataIndex]
    : undefined;
}

function buildBarDataItems(data: ChartData, series: ChartSeries, values: number[], hideWidthOverrides = false): SeriesDataItem[] {
  return values.map((value, dataIndex) => {
    const style = getCustomBarPointStyle(data, series, dataIndex);
    if (!style) return value;
    if (hideWidthOverrides && style.barWidth) return '-';
    if (!style.color) return value;

    return {
      value,
      itemStyle: {
        color: style.color,
      },
    };
  });
}

function buildBarWidthOverrideSeries(
  data: ChartData,
  options: ChartOptions,
  series: ChartSeries,
  values: number[],
  baseSeries: SeriesOption
): SeriesOption[] {
  if (data.barItemStyle?.enabled !== true) return [];

  return values.flatMap((value, dataIndex) => {
    const style = getCustomBarPointStyle(data, series, dataIndex);
    if (!style?.barWidth) return [];

    const overrideData = values.map((_, index): SeriesDataItem => {
      if (index !== dataIndex) return '-';
      if (!style.color) return value;

      return {
        value,
        itemStyle: {
          color: style.color,
        },
      };
    });

    return [{
      ...baseSeries,
      data: overrideData,
      barWidth: `${style.barWidth}%`,
      barGap: '-100%',
      markLine: undefined,
      markPoint: undefined,
    }];
  });
}

function getSeriesLineWidth(options: ChartOptions, series: ChartSeries | undefined) {
  return hasCustomSeriesStyle(series) ? series?.lineWidth ?? options.lineWidth : options.lineWidth;
}

function getLineColor(options: ChartOptions, series: ChartSeries | undefined, seriesIndex: number, hasTheme: boolean) {
  if (hasCustomSeriesStyle(series) && series?.color) return series.color;
  return hasTheme && !options.useCustomLinePalette ? undefined : getDefaultLineColor(options, seriesIndex);
}

function getLineStyle(options: ChartOptions, series: ChartSeries | undefined, seriesIndex: number, hasTheme: boolean) {
  const color = getLineColor(options, series, seriesIndex, hasTheme);
  const width = getSeriesLineWidth(options, series);
  return color ? { width, color } : { width };
}

function getLineItemStyle(options: ChartOptions, series: ChartSeries | undefined, seriesIndex: number, hasTheme: boolean) {
  const color = getLineColor(options, series, seriesIndex, hasTheme);
  return color ? { color } : undefined;
}

function colorWithAlpha(color: string, alpha: number) {
  if (!color.startsWith('#')) return color;

  const raw = color.slice(1);
  const value = raw.length === 3
    ? raw.split('').map(part => part + part).join('')
    : raw;

  if (value.length !== 6) return color;

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getLineAreaStyle(options: ChartOptions, series: ChartSeries | undefined, seriesIndex: number, hasTheme: boolean) {
  const lineColor = getLineColor(options, series, seriesIndex, hasTheme);
  const canUseSeriesStyle = hasCustomSeriesStyle(series);
  const baseColor = (canUseSeriesStyle ? series?.areaColor : undefined) || options.areaColor || lineColor;
  const gradientStart = (canUseSeriesStyle ? series?.areaGradientStart : undefined) || options.areaGradientStart || lineColor;
  const gradientEnd = (canUseSeriesStyle ? series?.areaGradientEnd : undefined) || options.areaGradientEnd || baseColor;
  const themeOwnsColor = hasTheme && !options.useCustomLinePalette;

  if (options.subType === 'gradient-stacked-area' && (canUseSeriesStyle && (series?.areaGradientStart || series?.areaGradientEnd) || !themeOwnsColor)) {
    return {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: colorWithAlpha(gradientStart || '#2563eb', Math.max(options.areaOpacity, 0.2)) },
        { offset: 1, color: colorWithAlpha(gradientEnd || '#dbeafe', 0.08) },
      ]),
    };
  }

  if (baseColor && (canUseSeriesStyle && series?.areaColor || !themeOwnsColor)) {
    return {
      color: baseColor,
      opacity: options.areaOpacity,
    };
  }

  return {
    opacity: options.areaOpacity,
  };
}

function getMarkerName(type: string, fallback: string) {
  if (fallback) return fallback;
  if (type === 'max') return '最大值';
  if (type === 'min') return '最小值';
  if (type === 'average') return '平均值';
  return '自定义';
}

function getMarkerCoord(category: string, value: number, isHorizontal = false): MarkerCoord {
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

function withRoundedStackEnds(series: SeriesOption[]) {
  const stackInfo: Record<string, { stackStart: number[]; stackEnd: number[] }> = {};
  const firstSeries = series[0];
  if (!firstSeries) return series;

  for (let i = 0; i < firstSeries.data.length; ++i) {
    for (let j = 0; j < series.length; ++j) {
      const seriesItem = series[j];
      const stackName = seriesItem.stack;
      if (!stackName) continue;

      stackInfo[stackName] ||= { stackStart: [], stackEnd: [] };

      const data = seriesItem.data[i];
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
    data: item.data.map((value, index) => {
      const info = item.stack ? stackInfo[item.stack] : undefined;
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

function getEditableSeries(data: ChartData, options: ChartOptions, stack?: string, fallbackPosition = 'top'): SeriesOption[] {
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
      barWidth: getSeriesBarWidth(options, series),
      emphasis: { focus: 'series' },
      label: getLabelOption(options, fallbackPosition),
      itemStyle: hasCustomSeriesStyle(series) && series.color ? { color: series.color } : undefined,
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
    axisLabel: { show: shouldShowAxisLabels(options) },
    axisTick: { show: options.showXAxis },
    axisLine: { show: options.showXAxis },
    splitLine: { show: isHorizontal && shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType } },
  };
}

function getValueAxis(options: ChartOptions, categories?: string[]) {
  return {
    type: categories ? 'category' : 'value',
    data: categories,
    axisLabel: { show: shouldShowAxisLabels(options) },
    axisTick: { show: options.showXAxis },
    axisLine: { show: options.showXAxis },
    splitLine: { show: !categories && shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType } },
  };
}

function getBarGrid(options: ChartOptions, topWhenTitle = 90, topWithoutTitle = 24) {
  return {
    show: options.showGrid,
    left: '5%',
    right: '5%',
    top: options.showTitle ? topWhenTitle : topWithoutTitle,
    bottom: options.showXAxis ? '8%' : '5%',
    containLabel: shouldShowAxisLabels(options),
    borderColor: '#e9e8e5',
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

function buildOfficialBarOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean): EChartsCoreOption {
  const categories = getChartCategories(data);
  const common = {
    ...getAnimationOption(options),
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
      grid: { show: options.showGrid, left: '3%', right: '4%', bottom: '3%', top: options.showTitle ? 80 : 20, containLabel: true },
      xAxis: {
        type: 'category',
        splitLine: { show: false },
        axisLabel: { show: shouldShowAxisLabels(options) },
        axisTick: { show: options.showXAxis },
        axisLine: { show: options.showXAxis },
        data: waterfallCategories,
      },
      yAxis: {
        type: 'value',
        axisLabel: { show: shouldShowAxisLabels(options) },
        axisTick: { show: options.showXAxis },
        axisLine: { show: options.showXAxis },
        splitLine: { show: shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType } },
      },
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
          barWidth: getSeriesBarWidth(options, data.series[0]),
          itemStyle: hasCustomSeriesStyle(data.series[0]) && data.series[0]?.color ? { color: data.series[0].color } : undefined,
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
      grid: { show: options.showGrid, top: options.showTitle ? 80 : 30, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        position: 'top',
        splitLine: { show: shouldShowSplitLine(options), lineStyle: { type: 'dashed' } },
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
          barWidth: getSeriesBarWidth(options, data.series[0]),
          itemStyle: hasCustomSeriesStyle(data.series[0]) && data.series[0]?.color ? { color: data.series[0].color } : undefined,
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
        barWidth: getSeriesBarWidth(options, item),
        label: getLabelOption(options, isNegative ? 'left' : 'inside'),
        emphasis: { focus: 'series' },
        itemStyle: hasCustomSeriesStyle(item) && item.color ? { color: item.color } : undefined,
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
    const allValues = editableSeries.flatMap(series => series.data.filter((value): value is number => typeof value === 'number'));
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
          axisLabel: { show: shouldShowAxisLabels(options) },
          axisTick: { show: options.showXAxis },
          axisLine: { show: options.showXAxis },
          splitLine: { show: shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType } },
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

function getSecondaryCategories(data: ChartData, categories: string[]) {
  if (data.secondaryCategories?.length === categories.length) {
    return data.secondaryCategories;
  }

  return categories.map((category, index) => `${category}-对比${index + 1}`);
}

function formatAxisPointerLabel(prefix: string, params: AxisPointerLabelParams) {
  const firstSeriesData = params.seriesData?.[0]?.data;
  return `${prefix} ${params.value}${params.seriesData?.length ? `：${firstSeriesData}` : ''}`;
}

function buildSpecialLineOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean): EChartsCoreOption {
  const categories = getChartCategories(data);
  const common = {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || 'transparent',
    title: getTitleOption(options, isDarkTheme),
  };

  if (options.subType === 'function-plot') {
    const functionPlot = normalizeFunctionPlot(data.functionPlot);

    return {
      ...common,
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
        show: options.showGrid,
        top: options.showTitle ? 80 : 40,
        left: 50,
        right: 40,
        bottom: 50,
      },
      xAxis: {
        name: options.showXAxis ? 'x' : undefined,
        axisLabel: { show: shouldShowAxisLabels(options) },
        axisTick: { show: options.showXAxis },
        axisLine: { show: options.showXAxis },
        minorTick: { show: options.showXAxis },
        splitLine: { show: shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType } },
        minorSplitLine: { show: options.showGrid },
      },
      yAxis: {
        name: options.showXAxis ? 'y' : undefined,
        min: functionPlot.yMin,
        max: functionPlot.yMax,
        axisLabel: { show: shouldShowAxisLabels(options) },
        axisTick: { show: options.showXAxis },
        axisLine: { show: options.showXAxis },
        minorTick: { show: options.showXAxis },
        splitLine: { show: shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType } },
        minorSplitLine: { show: options.showGrid },
      },
      dataZoom: [
        {
          show: true,
          type: 'inside',
          filterMode: 'none',
          xAxisIndex: [0],
          startValue: Math.max(functionPlot.xMin, -20),
          endValue: Math.min(functionPlot.xMax, 20),
        },
        {
          show: true,
          type: 'inside',
          filterMode: 'none',
          yAxisIndex: [0],
          startValue: Math.max(functionPlot.yMin, -20),
          endValue: Math.min(functionPlot.yMax, 20),
        },
      ],
      series: [
        {
          name: '函数曲线',
          type: 'line',
          showSymbol: false,
          clip: true,
          lineStyle: getLineStyle(options, undefined, 0, hasTheme),
          itemStyle: getLineItemStyle(options, undefined, 0, hasTheme),
          data: generateFunctionPlotData(functionPlot),
        },
      ],
    };
  }

  const secondaryCategories = getSecondaryCategories(data, categories);
  const sourceSeries = data.series.length
    ? data.series
    : [{ name: '系列1', data: categories.map(() => 0) }];
  const lineColors = getLinePalette(options).slice(0, 2);
  const secondaryAxisColor = getLineColor(options, sourceSeries[0], 0, hasTheme);
  const primaryAxisColor = getLineColor(options, sourceSeries[1], 1, hasTheme);

  return {
    ...common,
    color: hasTheme && !options.useCustomLinePalette ? undefined : lineColors,
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
      show: options.showGrid,
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
        axisLabel: { show: shouldShowAxisLabels(options), rotate: options.xLabelRotate },
        axisLine: {
          onZero: false,
          show: options.showXAxis,
          lineStyle: primaryAxisColor ? { color: primaryAxisColor } : undefined,
        },
        axisPointer: {
          label: {
            formatter: (params: AxisPointerLabelParams) => formatAxisPointerLabel('主 X 轴', params),
          },
        },
        data: categories,
      },
      {
        type: 'category',
        position: 'top',
        axisTick: { alignWithLabel: true, show: options.showXAxis },
        axisLabel: { show: shouldShowAxisLabels(options), rotate: options.xLabelRotate },
        axisLine: {
          onZero: false,
          show: options.showXAxis,
          lineStyle: secondaryAxisColor ? { color: secondaryAxisColor } : undefined,
        },
        axisPointer: {
          label: {
            formatter: (params: AxisPointerLabelParams) => formatAxisPointerLabel('第二 X 轴', params),
          },
        },
        data: secondaryCategories,
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: { show: shouldShowAxisLabels(options) },
        axisTick: { show: options.showXAxis },
        axisLine: { show: options.showXAxis },
        splitLine: {
          show: shouldShowSplitLine(options),
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
        lineStyle: getLineStyle(options, series, seriesIndex, hasTheme),
        itemStyle: getLineItemStyle(options, series, seriesIndex, hasTheme),
        emphasis: { focus: 'series' },
        label: getLabelOption(options, 'top'),
        data: values,
        ...getSeriesMarkers(data, options, seriesIndex, axisCategories, values),
      };
    }),
  };
}

function getPieRadius(options: ChartOptions, fallbackInner = 40, fallbackOuter = 70) {
  const inner = Math.max(0, Math.min(options.pieInnerRadius ?? fallbackInner, 95));
  const outer = Math.max(inner + 5, Math.min(options.pieOuterRadius ?? fallbackOuter, 100));

  return [`${inner}%`, `${outer}%`];
}

function getPieData(data: ChartData, seriesIndex = 0) {
  const series = data.series[seriesIndex] || data.series[0];
  if (!series) return [];

  return data.categories.map((category, index) => ({
    name: category,
    value: series.data[index] || 0,
  }));
}

function getPieLabelOption(options: ChartOptions, fallbackPosition: string = 'outside') {
  return {
    show: options.showDataLabels,
    position: options.labelPosition === 'none' ? fallbackPosition : options.labelPosition,
  };
}

function buildPieSeries(data: ChartData, options: ChartOptions) {
  const series = data.series[0];
  if (!series) return [];

  const common = {
    type: 'pie',
    name: series.name,
    data: getPieData(data),
  };

  if (options.subType === 'nested-donut') {
    const innerData = getPieData(data).slice(0, 3).map((item, index) => ({
      ...item,
      selected: index === 2,
    }));
    const outerData = getPieData(data, 1);

    return [
      {
        ...common,
        selectedMode: 'single',
        radius: [0, `${Math.max(24, Math.min(options.pieInnerRadius, 40))}%`],
        label: {
          show: options.showDataLabels,
          position: 'inner',
          fontSize: 14,
        },
        labelLine: { show: false },
        data: innerData,
      },
      {
        ...common,
        name: data.series[1]?.name || series.name,
        radius: getPieRadius(options, 45, 64),
        labelLine: { length: 30 },
        label: {
          ...getPieLabelOption(options),
          formatter: '{b}: {c} ({d}%)',
        },
        data: outerData,
      },
    ];
  }

  if (options.subType === 'nightingale') {
    return [
      {
        ...common,
        name: series.name || 'Radius Mode',
        radius: getPieRadius(options, 12, 72),
        center: ['25%', '52%'],
        roseType: 'radius',
        itemStyle: { borderRadius: 5 },
        label: getPieLabelOption(options),
        emphasis: { label: { show: true } },
      },
      {
        ...common,
        name: data.series[1]?.name || 'Area Mode',
        radius: getPieRadius(options, 12, 72),
        center: ['75%', '52%'],
        roseType: 'area',
        itemStyle: { borderRadius: 5 },
        label: getPieLabelOption(options),
        emphasis: { label: { show: true } },
        data: getPieData(data, 1),
      },
    ];
  }

  if (options.subType === 'nightingale-basic') {
    return [{
      ...common,
      radius: getPieRadius(options, 20, 78),
      center: ['50%', '52%'],
      roseType: 'area',
      itemStyle: { borderRadius: 8 },
      label: getPieLabelOption(options),
    }];
  }

  if (options.subType === 'donut' || options.subType === 'rounded-donut' || options.subType === 'gap-donut') {
    const isRounded = options.subType === 'rounded-donut' || options.subType === 'gap-donut';
    const itemStyle = options.subType === 'rounded-donut'
      ? { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }
      : isRounded
        ? { borderRadius: 10 }
        : undefined;

    return [{
      ...common,
      radius: getPieRadius(options),
      avoidLabelOverlap: false,
      padAngle: options.subType === 'gap-donut' ? options.piePadAngle : 0,
      itemStyle,
      label: {
        show: options.showDataLabels,
        position: options.showDataLabels ? getPieLabelOption(options, 'center').position : 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: 'bold',
        },
      },
      labelLine: { show: options.showDataLabels },
    }];
  }

  return [{
    ...common,
    radius: `${Math.max(5, Math.min(options.pieOuterRadius || 70, 100))}%`,
    label: getPieLabelOption(options),
  }];
}

function isFiniteScatterPoint(point: ScatterPoint) {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

function getScatterPoints(data: ChartData): ScatterPoint[] {
  if (data.scatterData?.length) {
    return data.scatterData.filter(isFiniteScatterPoint);
  }

  const xSeries = data.series[0]?.data || [];
  const ySeries = data.series[1]?.data || data.series[0]?.data || [];
  const pointCount = Math.max(data.categories.length, xSeries.length, ySeries.length);

  return Array.from({ length: pointCount }, (_, index): ScatterPoint => [
    Number(xSeries[index] ?? index + 1),
    Number(ySeries[index] ?? 0),
  ]).filter(isFiniteScatterPoint);
}

function getScatterTooltipOption(options: ChartOptions) {
  if (!options.showTooltip) return undefined;

  return {
    trigger: 'item',
    position: 'top',
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

function getScatterAxis(options: ChartOptions, isDarkTheme: boolean, splitLine = true) {
  return {
    type: 'value',
    axisLabel: {
      show: shouldShowAxisLabels(options),
      color: isDarkTheme ? '#cbd5e1' : '#57657a',
      fontFamily: 'Inter, sans-serif',
    },
    axisTick: { show: options.showXAxis },
    axisLine: { show: options.showXAxis },
    splitLine: {
      show: splitLine && shouldShowSplitLine(options),
      lineStyle: { type: options.ySplitLineType, color: isDarkTheme ? '#334155' : '#e9e8e5' },
    },
  };
}

function getScatterGrid(options: ChartOptions, left: string | number = '8%') {
  return {
    show: options.showGrid,
    left,
    right: '6%',
    top: options.showTitle ? 90 : 32,
    bottom: options.showXAxis ? 48 : 28,
    containLabel: true,
    borderColor: '#e9e8e5',
  };
}

function mergeScatterColors(colors: string[] | undefined, count: number) {
  return Array.from({ length: count }, (_, index) => (
    colors?.[index]?.trim() || SCATTER_CLUSTER_COLORS[index % SCATTER_CLUSTER_COLORS.length]
  ));
}

function buildBasicScatterOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean): EChartsCoreOption {
  const series = data.series[0];
  const itemStyle = hasCustomSeriesStyle(series) && series?.color ? { color: series.color } : undefined;
  const seriesName = series?.name || '散点';

  return {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
    color: hasTheme ? undefined : ['#2563eb'],
    title: getTitleOption(options, isDarkTheme),
    tooltip: getScatterTooltipOption(options),
    legend: options.showLegend
      ? {
        data: [seriesName],
        bottom: 0,
        left: 'center',
        textStyle: { color: isDarkTheme ? '#cbd5e1' : '#434655', fontFamily: 'Inter, sans-serif', fontSize: 13 },
      }
      : undefined,
    grid: getScatterGrid(options),
    xAxis: getScatterAxis(options, isDarkTheme),
    yAxis: getScatterAxis(options, isDarkTheme),
    series: [
      {
        name: seriesName,
        type: 'scatter',
        symbolSize: options.scatterSize,
        data: getScatterPoints(data),
        itemStyle,
        label: getLabelOption(options, 'top'),
      },
    ],
  };
}

function buildClusteredScatterOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean): EChartsCoreOption {
  const points = getScatterPoints(data);
  const clusterColors = mergeScatterColors(data.scatterStyle?.clusterColors, SCATTER_CLUSTER_COUNT);
  const pieces = Array.from({ length: SCATTER_CLUSTER_COUNT }, (_, index) => ({
    value: index,
    label: `cluster ${index}`,
    color: clusterColors[index],
  }));

  return {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
    title: getTitleOption(options, isDarkTheme),
    dataset: [
      { source: points },
      {
        transform: {
          type: 'ecStat:clustering',
          config: {
            clusterCount: SCATTER_CLUSTER_COUNT,
            outputType: 'single',
            outputClusterIndexDimension: SCATTER_CLUSTER_DIMENSION_INDEX,
          },
        },
      },
    ],
    tooltip: options.showTooltip ? { position: 'top' } : undefined,
    visualMap: {
      show: options.showLegend,
      type: 'piecewise',
      top: 'middle',
      min: 0,
      max: SCATTER_CLUSTER_COUNT,
      left: 10,
      selectedMode: 'multiple',
      splitNumber: SCATTER_CLUSTER_COUNT,
      dimension: SCATTER_CLUSTER_DIMENSION_INDEX,
      pieces,
      inRange: {
        color: clusterColors,
      },
      outOfRange: {
        opacity: 0,
      },
      textStyle: {
        color: isDarkTheme ? '#cbd5e1' : '#434655',
        fontFamily: 'Inter, sans-serif',
      },
    },
    grid: getScatterGrid(options, 120),
    xAxis: getScatterAxis(options, isDarkTheme),
    yAxis: getScatterAxis(options, isDarkTheme),
    series: {
      type: 'scatter',
      encode: { tooltip: [0, 1] },
      symbolSize: options.scatterSize,
      itemStyle: {
        borderColor: '#555',
      },
      datasetIndex: 1,
    },
  };
}

function getDefaultSingleAxisData(data: ChartData) {
  if (data.singleAxisScatterData) return data.singleAxisScatterData;

  const hours = data.categories.length ? data.categories : ['0', '1', '2', '3', '4', '5'];
  const days = data.series.length ? data.series.map((series) => series.name) : ['数据'];
  const points = data.series.flatMap((series, dayIndex) => (
    hours.map((_, hourIndex): [number, number, number] => [
      dayIndex,
      hourIndex,
      Math.max(0, Math.round(series.data[hourIndex] ?? 0)),
    ])
  ));

  return { hours, days, data: points };
}

function buildSingleAxisScatterOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean): EChartsCoreOption {
  const singleAxisData = getDefaultSingleAxisData(data);
  const axisCount = Math.max(singleAxisData.days.length, 1);
  const isCompactPreview = options.animationDuration === 0 && !options.showTitle && !options.showTooltip;
  const axisLeft = isCompactPreview ? 52 : 150;
  const singleAxisColors = mergeScatterColors(data.scatterStyle?.singleAxisColors, axisCount);
  const title = singleAxisData.days.map((day, index) => ({
    textBaseline: 'middle',
    top: `${((index + 0.5) * 100) / axisCount}%`,
    text: day,
    textStyle: {
      color: isDarkTheme ? '#e2e8f0' : '#434655',
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      fontWeight: 500,
    },
  }));
  const singleAxis = singleAxisData.days.map((_, index) => ({
    left: axisLeft,
    right: options.showLegend && !isCompactPreview ? 120 : 20,
    type: 'category',
    boundaryGap: false,
    data: singleAxisData.hours,
    top: `${(index * 100) / axisCount + 5}%`,
    height: `${100 / axisCount - 10}%`,
    axisLabel: {
      interval: isCompactPreview ? 4 : 2,
      show: shouldShowAxisLabels(options),
      color: isDarkTheme ? '#cbd5e1' : '#57657a',
      fontFamily: 'Inter, sans-serif',
    },
    axisTick: { show: options.showXAxis },
    axisLine: { show: options.showXAxis },
    splitLine: {
      show: shouldShowSplitLine(options),
      lineStyle: { type: options.ySplitLineType, color: isDarkTheme ? '#334155' : '#e9e8e5' },
    },
  }));
  const series = singleAxisData.days.map((day, index) => ({
    name: day,
    singleAxisIndex: index,
    coordinateSystem: 'singleAxis',
    type: 'scatter',
    data: [] as Array<[number, number]>,
    symbolSize: (dataItem: [number, number]) => dataItem[1] * 4,
    itemStyle: {
      color: singleAxisColors[index],
    },
  }));

  singleAxisData.data.forEach((point) => {
    const targetSeries = series[point[0]];
    if (targetSeries) {
      targetSeries.data.push([point[1], point[2]]);
    }
  });

  return {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
    color: hasTheme ? undefined : singleAxisColors,
    tooltip: options.showTooltip ? { position: 'top' } : undefined,
    legend: options.showLegend
      ? {
        data: singleAxisData.days,
        orient: 'vertical',
        right: 8,
        top: 'middle',
        textStyle: { color: isDarkTheme ? '#cbd5e1' : '#434655', fontFamily: 'Inter, sans-serif', fontSize: 13 },
      }
      : undefined,
    title,
    singleAxis,
    series,
  };
}

function buildScatterOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean): EChartsCoreOption {
  if (options.subType === 'clustered') {
    return buildClusteredScatterOption(data, options, isDarkTheme, hasTheme);
  }

  if (options.subType === 'single-axis') {
    return buildSingleAxisScatterOption(data, options, isDarkTheme, hasTheme);
  }

  return buildBasicScatterOption(data, options, isDarkTheme, hasTheme);
}

function getMapData(data: ChartData) {
  const series = data.series[0];
  return data.categories.map((name, index) => ({
    name,
    value: series?.data[index] ?? 0,
  }));
}

function getMapVisualMap(
  data: ChartData,
  options: ChartOptions,
  isDarkTheme: boolean,
  palette: string[],
  seriesIndex?: number | number[]
) {
  const values = data.series[0]?.data || [];
  const configuredMin = options.mapVisualMap?.min;
  const configuredMax = options.mapVisualMap?.max;
  const min = Number.isFinite(configuredMin) ? configuredMin : Math.min(0, ...values);
  const max = Number.isFinite(configuredMax) ? configuredMax : Math.max(100, ...values);
  const isPiecewise = options.mapVisualMap?.isPiecewise === true || options.mapVisualMap?.is_piecewise === true;

  return {
    show: options.showLegend,
    type: isPiecewise ? 'piecewise' : 'continuous',
    min,
    max,
    left: 16,
    bottom: 18,
    calculable: !isPiecewise,
    splitNumber: options.mapVisualMap?.splitNumber || 5,
    seriesIndex,
    textStyle: {
      color: isDarkTheme ? '#cbd5e1' : '#434655',
      fontFamily: 'Inter, sans-serif',
    },
    inRange: {
      color: [
        colorWithAlpha(palette[0] || '#2563eb', isDarkTheme ? 0.35 : 0.18),
        palette[2] || palette[0] || '#60a5fa',
        palette[0] || '#2563eb',
        palette[1] || '#1e40af',
      ],
    },
    outOfRange: {
      color: isDarkTheme ? '#1e293b' : '#e5e7eb',
    },
  };
}

function buildMapOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean, theme?: string): EChartsCoreOption {
  const subType = options.subType;
  const mapName = getMapName(subType, options.mapRegion || data.mapStyle?.region);
  const mapData = getMapData(data);
  const palette = getEchartsThemePalette(theme);
  const mapItemStyle = {
    areaColor: colorWithAlpha(palette[0] || '#2563eb', isDarkTheme ? 0.16 : 0.1),
    borderColor: isDarkTheme ? colorWithAlpha(palette[1] || '#60a5fa', 0.65) : '#ffffff',
    borderWidth: 1,
  };
  const emphasis = {
    label: { color: isDarkTheme ? '#f8fafc' : '#111827' },
    itemStyle: {
      areaColor: colorWithAlpha(palette[1] || palette[0] || '#93c5fd', isDarkTheme ? 0.65 : 0.5),
    },
  };

  if (subType === 'china-cities') {
    const pointLookup = new Map((data.mapPoints?.length ? data.mapPoints : CHINA_CITY_POINTS).map((point) => [point.name, point]));
    const cityData = data.categories.flatMap((name, index) => {
      const point = pointLookup.get(name);
      if (!point) return [];
      return [{
        name,
        value: [...point.coord, data.series[0]?.data[index] ?? point.value],
      }];
    });

    return {
      ...getAnimationOption(options),
      backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
      title: getTitleOption(options, isDarkTheme),
      tooltip: options.showTooltip
        ? {
          trigger: 'item',
          formatter: (params: { name?: string; value?: number[] | number }) => {
            const value = Array.isArray(params.value) ? params.value[2] : params.value;
            return `${params.name || ''}<br/>${value ?? '-'}`;
          },
        }
        : undefined,
      visualMap: getMapVisualMap(data, options, isDarkTheme, palette, 1),
      geo: {
        map: mapName,
        roam: true,
        zoom: 1.15,
        label: {
          show: options.showDataLabels,
          color: isDarkTheme ? '#cbd5e1' : '#334155',
          fontFamily: 'Inter, sans-serif',
        },
        itemStyle: mapItemStyle,
        emphasis,
      },
      series: [
        {
          name: '中国地图',
          type: 'map',
          map: mapName,
          geoIndex: 0,
          data: [],
          tooltip: { show: false },
        },
        {
          name: data.series[0]?.name || '城市数据',
          type: 'scatter',
          coordinateSystem: 'geo',
          symbolSize: (value: number[]) => Math.max(8, Math.min(34, Math.sqrt(Number(value[2] || 0)) * 2.2)),
          itemStyle: {
            color: palette[3] || palette[1] || '#ef4444',
            borderColor: '#ffffff',
            borderWidth: 1,
          },
          label: {
            show: options.showDataLabels,
            formatter: '{b}',
            position: 'right',
          },
          data: cityData,
        },
      ],
    };
  }

  return {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
    title: getTitleOption(options, isDarkTheme),
    tooltip: options.showTooltip ? { trigger: 'item' } : undefined,
    visualMap: getMapVisualMap(data, options, isDarkTheme, palette, 0),
    series: [
      {
        name: data.series[0]?.name || '地图数据',
        type: 'map',
        map: mapName,
        roam: true,
        zoom: subType === 'world' ? 1 : 1.12,
        itemStyle: mapItemStyle,
        emphasis,
        label: {
          show: options.showDataLabels,
          color: isDarkTheme ? '#cbd5e1' : '#334155',
          fontFamily: 'Inter, sans-serif',
        },
        data: mapData,
      },
    ],
  };
}

function getRadarIndicators(data: ChartData) {
  return data.categories.map((category, index) => {
    const configuredMax = data.radarIndicators?.[index]?.max ?? data.radarIndicators?.find((indicator) => indicator.name === category)?.max;
    const numericConfiguredMax = Number(configuredMax);
    const values = data.series.map((series) => Number(series.data[index] ?? 0)).filter(Number.isFinite);
    const maxValue = Math.max(1, ...values);
    const fallbackMax = Math.ceil((maxValue * 1.2) / 10) * 10;

    return {
      name: category,
      max: Number.isFinite(numericConfiguredMax) && numericConfiguredMax > 0 ? numericConfiguredMax : fallbackMax,
    };
  });
}

function buildRadarOption(data: ChartData, options: ChartOptions, isDarkTheme: boolean, hasTheme: boolean, theme?: string): EChartsCoreOption {
  const palette = getEchartsThemePalette(theme);
  const radarSeriesData = data.series.map((series, seriesIndex) => {
    const color = hasCustomSeriesStyle(series) && series.color ? series.color : palette[seriesIndex % palette.length];
    const lineWidth = hasCustomSeriesStyle(series) ? series.lineWidth ?? options.lineWidth : options.lineWidth;

    return {
      value: data.categories.map((_, categoryIndex) => series.data[categoryIndex] ?? 0),
      name: series.name,
      itemStyle: color ? { color } : undefined,
      lineStyle: {
        color,
        width: lineWidth,
      },
      areaStyle: options.fillArea
        ? {
          opacity: options.areaOpacity ?? 0.25,
          color: color ? colorWithAlpha(color, options.areaOpacity ?? 0.25) : undefined,
        }
        : undefined,
    };
  });

  return {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
    color: hasTheme ? undefined : palette,
    title: getTitleOption(options, isDarkTheme),
    tooltip: options.showTooltip ? { trigger: 'item' } : undefined,
    legend: options.showLegend ? {
      data: data.series.map((series) => series.name),
      type: options.legendType || 'plain',
      orient: options.legendLayout,
      bottom: options.legendLayout === 'horizontal' ? 0 : 'center',
      right: options.legendLayout === 'vertical' ? 0 : 'center',
      left: options.legendLayout === 'horizontal' ? 'center' : undefined,
      icon: 'roundRect',
      itemWidth: 16,
      itemHeight: 8,
      textStyle: { color: isDarkTheme ? '#cbd5e1' : '#434655', fontFamily: 'Inter, sans-serif', fontSize: 13 },
    } : undefined,
    radar: {
      indicator: getRadarIndicators(data),
      radius: options.showLegend && options.legendLayout === 'horizontal' ? '62%' : '70%',
      center: options.showLegend && options.legendLayout === 'vertical' ? ['42%', '54%'] : ['50%', '54%'],
      axisName: {
        color: isDarkTheme ? '#cbd5e1' : '#434655',
        fontFamily: 'Inter, sans-serif',
      },
      splitLine: {
        lineStyle: {
          color: isDarkTheme ? ['#334155'] : ['#e5e7eb'],
        },
      },
      splitArea: {
        areaStyle: {
          color: isDarkTheme
            ? ['rgba(15, 23, 42, 0.15)', 'rgba(15, 23, 42, 0.28)']
            : ['rgba(248, 250, 252, 0.65)', 'rgba(241, 245, 249, 0.85)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: isDarkTheme ? '#475569' : '#d1d5db',
        },
      },
    },
    series: [
      {
        name: options.title || 'Budget vs spending',
        type: 'radar',
        data: radarSeriesData,
        label: getLabelOption(options),
      },
    ],
  };
}

function buildDefaultSeries(data: ChartData, options: ChartOptions, chartType: ChartType, hasTheme: boolean) {
  const isPie = chartType === 'pie';
  const isHorizontal = options.subType === 'horizontal' && chartType === 'bar';

  if (isPie) {
    return buildPieSeries(data, options);
  }

  return data.series.flatMap((series, seriesIndex) => {
    const isBar = chartType === 'bar';
    const isLine = chartType === 'line';
    const isPolar = options.subType === 'polar-label' && isBar;
    const values = data.categories.map((_, dataIndex) => series.data[dataIndex] ?? 0);

    let itemStyle: Record<string, unknown> | undefined;
    if (isBar) {
      if (options.subType === 'rounded' || options.subType === 'rounded-stacked') {
        itemStyle = { borderRadius: isHorizontal ? [0, 20, 20, 0] : [20, 20, 0, 0] };
      } else {
        itemStyle = { borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] };
      }
      if (options.subType === 'waterfall' && seriesIndex === 0) {
        itemStyle = { ...itemStyle, borderColor: 'transparent', color: 'transparent' };
      } else if (hasCustomSeriesStyle(series) && series.color) {
        itemStyle = { ...itemStyle, color: series.color };
      }
    } else if (isLine) {
      itemStyle = getLineItemStyle(options, series, seriesIndex, hasTheme);
    }

    const areaStyle = isLine && (
      options.subType === 'area' ||
      options.subType === 'stacked-area' ||
      options.subType === 'gradient-stacked-area' ||
      options.fillArea
    )
      ? getLineAreaStyle(options, series, seriesIndex, hasTheme)
      : undefined;

    const stackName = (
      options.subType === 'stacked' ||
      options.subType === 'stacked-area' ||
      options.subType === 'gradient-stacked-area' ||
      options.subType === 'rounded-stacked' ||
      options.subType === 'waterfall'
    )
      ? 'total'
      : undefined;

    const seriesData = isBar
      ? buildBarDataItems(data, series, values, true)
      : values;
    const baseSeries: SeriesOption = {
      name: series.name,
      type: chartType,
      coordinateSystem: isPolar ? 'polar' : 'cartesian2d',
      data: seriesData,
      barWidth: isBar ? getSeriesBarWidth(options, series) : undefined,
      symbol: isLine ? options.lineSymbol : undefined,
      showSymbol: isLine ? options.lineSymbol !== 'none' : undefined,
      symbolSize: isLine ? options.lineSymbolSize : chartType === 'scatter' ? options.scatterSize : undefined,
      lineStyle: isLine ? getLineStyle(options, series, seriesIndex, hasTheme) : undefined,
      itemStyle,
      stack: stackName,
      smooth: isLine && (options.subType === 'smooth' || options.subType === 'bump' || options.smoothLine) ? true : undefined,
      step: isLine && (options.subType === 'step' || options.stepLine) ? 'middle' : undefined,
      areaStyle,
      label: {
        show: options.showDataLabels,
        position: isHorizontal && options.labelPosition === 'top' ? 'right' : options.labelPosition,
      },
      ...(isBar || isLine ? getSeriesMarkers(data, options, seriesIndex, data.categories, values, isHorizontal) : {}),
    };

    return isBar
      ? [baseSeries, ...buildBarWidthOverrideSeries(data, options, series, values, baseSeries)]
      : [baseSeries];
  });
}

function buildDefaultOption({
  data,
  options,
  chartType,
  isDarkTheme,
  hasTheme,
}: BuildChartOptionParams): EChartsCoreOption {
  const isPie = chartType === 'pie';
  const isHorizontal = options.subType === 'horizontal' && chartType === 'bar';

  return {
    ...getAnimationOption(options),
    backgroundColor: options.backgroundColor || (hasTheme ? undefined : 'transparent'),
    color: chartType === 'line' && (!hasTheme || options.useCustomLinePalette)
      ? getLinePalette(options)
      : hasTheme
        ? undefined
        : ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#818cf8', '#a78bfa'],
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
      shadowColor: 'rgba(0, 0, 0, 0.1)',
    } : undefined,
    legend: options.showLegend ? {
      data: isPie ? data.categories : data.series.map(series => series.name),
      type: options.legendType || 'plain',
      orient: options.legendLayout,
      bottom: options.legendLayout === 'horizontal' ? 0 : 'center',
      right: options.legendLayout === 'vertical' ? 0 : 'center',
      left: options.legendLayout === 'horizontal' ? 'center' : undefined,
      icon: 'roundRect',
      itemWidth: 16,
      itemHeight: 8,
      textStyle: { color: isDarkTheme ? '#cbd5e1' : '#434655', fontFamily: 'Inter, sans-serif', fontSize: 13 },
    } : undefined,
    grid: !options.showGrid || isPie || options.subType === 'polar-label' ? { show: false, left: '5%', right: '5%', bottom: options.showLegend && options.legendLayout === 'horizontal' ? '12%' : '5%', top: options.showTitle ? '20%' : '10%', containLabel: true } : {
      show: true,
      left: '5%', right: '5%', bottom: options.showLegend && options.legendLayout === 'horizontal' ? '12%' : '5%', top: options.showTitle ? '20%' : '10%',
      containLabel: true,
      borderColor: isDarkTheme ? '#334155' : '#eee',
    },
    polar: options.subType === 'polar-label' ? { radius: [30, '80%'] } : undefined,
    angleAxis: options.subType === 'polar-label' ? { type: 'value', startAngle: 90 } : undefined,
    radiusAxis: options.subType === 'polar-label' ? { type: 'category', data: data.categories } : undefined,
    xAxis: isPie || options.subType === 'polar-label' ? undefined : {
      show: options.showXAxis,
      type: isHorizontal ? 'value' : 'category',
      data: isHorizontal ? undefined : data.categories,
      axisLine: { show: options.showXAxis },
      axisTick: { show: false },
      axisLabel: {
        show: shouldShowAxisLabels(options),
        color: isDarkTheme ? '#cbd5e1' : '#57657a',
        fontFamily: 'Inter, sans-serif',
        margin: 15,
        rotate: options.xLabelRotate,
      },
      splitLine: isHorizontal ? { show: shouldShowSplitLine(options), lineStyle: { type: options.ySplitLineType, color: isDarkTheme ? '#334155' : '#e9e8e5' } } : undefined,
    },
    yAxis: isPie || options.subType === 'polar-label' ? undefined : {
      type: isHorizontal ? 'category' : (options.subType === 'log' ? 'log' : 'value'),
      data: isHorizontal ? data.categories : undefined,
      logBase: options.subType === 'log' ? 10 : undefined,
      splitLine: isHorizontal ? { show: false } : {
        show: shouldShowSplitLine(options),
        lineStyle: { type: options.ySplitLineType, color: isDarkTheme ? '#334155' : '#e9e8e5' },
      },
      axisLabel: {
        show: shouldShowAxisLabels(options),
        color: isDarkTheme ? '#cbd5e1' : '#57657a',
        fontFamily: 'Inter, sans-serif',
      },
      axisTick: { show: options.showXAxis },
      axisLine: { show: options.showXAxis },
    },
    series: buildDefaultSeries(data, options, chartType, hasTheme),
  };
}

export function buildChartOption(params: BuildChartOptionParams): EChartsCoreOption {
  const { data, options, chartType, theme, isDarkTheme, hasTheme } = params;

  if (chartType === 'map') {
    return buildMapOption(data, options, isDarkTheme, hasTheme, theme);
  }

  if (chartType === 'radar') {
    return buildRadarOption(data, options, isDarkTheme, hasTheme, theme);
  }

  if (chartType === 'scatter') {
    return buildScatterOption(data, options, isDarkTheme, hasTheme);
  }

  if (chartType === 'line' && options.subType && specialLineSubTypes.has(options.subType)) {
    return buildSpecialLineOption(data, options, isDarkTheme, hasTheme);
  }

  if (chartType === 'bar' && options.subType && officialBarSubTypes.has(options.subType)) {
    return buildOfficialBarOption(data, options, isDarkTheme);
  }

  return buildDefaultOption(params);
}
