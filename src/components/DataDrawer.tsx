"use client";

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, UploadCloud, PlusSquare, Columns, Trash2, ChevronLeft, Minimize2, Palette, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { DEFAULT_FUNCTION_PLOT, normalizeFunctionPlot } from '@/lib/function-plot';
import { parseImportFile, type ImportedTable } from '@/lib/import-data';
import { MAP_PROVINCES } from '@/lib/map-geodata';
import { SCATTER_CLUSTER_COLORS, SCATTER_CLUSTER_COUNT } from '@/lib/scatter-clustering';
import { ChartData, ChartDataPointStyle, ChartFunctionPlot, ChartMarker, ChartMarkerType, ChartOptions, ChartSeriesRole, ChartSubType, ChartType } from '@/types';
import { DataImportModal } from './DataImportModal';

interface DataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChartData;
  onChange: (data: ChartData) => void;
  options: ChartOptions;
  onOptionsChange: (opts: ChartOptions) => void;
  chartType: ChartType;
  subType?: ChartSubType;
  defaultBarWidth: number;
  defaultLineWidth: number;
  title: string;
  subtitle: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
}

const SERIES_ROLE_OPTIONS: { value: ChartSeriesRole; label: string }[] = [
  { value: 'normal', label: '独立显示' },
  { value: 'stack', label: '堆叠显示' },
  { value: 'positive', label: '正向堆叠' },
  { value: 'negative', label: '负向堆叠' },
];

const MARKER_TYPE_OPTIONS: { value: ChartMarkerType; label: string }[] = [
  { value: 'max', label: '最大值' },
  { value: 'min', label: '最小值' },
  { value: 'average', label: '平均值' },
  { value: 'custom', label: '自定义值' },
];

type SeriesStyleKey = 'color' | 'areaColor' | 'areaGradientStart' | 'areaGradientEnd';
type SeriesNumericStyleKey = 'barWidth' | 'lineWidth';
type ScatterColorStyleKey = 'clusterColors' | 'singleAxisColors';
type DataPointStyleKey = keyof ChartDataPointStyle;

const FALLBACK_SERIES_COLORS = ['#2563eb', '#ef4444', '#60a5fa', '#a78bfa', '#22c55e', '#f59e0b'];
const BAR_POINT_STYLE_UNSUPPORTED_SUBTYPES: ChartSubType[] = [
  'waterfall',
  'negative-staggered',
  'negative-bar',
  'broken-axis',
  'rounded-stacked',
  'stacked',
  'stacked-horizontal',
  'polar-label',
];

function getSecondaryCategoryFallback(category: string, index: number) {
  return `${category}-对比${index + 1}`;
}

function getFallbackSeriesColor(index: number) {
  return FALLBACK_SERIES_COLORS[index % FALLBACK_SERIES_COLORS.length];
}

function getColorInputValue(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function hasDataPointStyle(style: ChartDataPointStyle | undefined) {
  return Boolean(style?.color || style?.barWidth);
}

function shiftDataPointStylesOnRemove(styles: Record<number, ChartDataPointStyle> | undefined, removeIndex: number) {
  if (!styles) return undefined;

  const nextStyles: Record<number, ChartDataPointStyle> = {};
  Object.entries(styles).forEach(([rawIndex, style]) => {
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index === removeIndex || !hasDataPointStyle(style)) return;
    nextStyles[index > removeIndex ? index - 1 : index] = style;
  });

  return Object.keys(nextStyles).length ? nextStyles : undefined;
}

export function DataDrawer({
  isOpen,
  onClose,
  data,
  onChange,
  options,
  onOptionsChange,
  chartType,
  subType,
  defaultBarWidth,
  defaultLineWidth,
  title,
  subtitle,
  onTitleChange,
  onSubtitleChange,
}: DataDrawerProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [importTable, setImportTable] = useState<ImportedTable | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeBarPointStyle, setActiveBarPointStyle] = useState<{ seriesIndex: number; categoryIndex: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFunctionPlot = chartType === 'line' && subType === 'function-plot';
  const showSecondaryXAxis = chartType === 'line' && subType === 'multi-x';
  const secondaryCategories = data.secondaryCategories || data.categories.map(getSecondaryCategoryFallback);
  const supportsMarkers = (chartType === 'bar' || chartType === 'line') && !isFunctionPlot;
  const supportsLineSeriesStyle = chartType === 'line' && !isFunctionPlot;
  const supportsBarSeriesStyle = chartType === 'bar' && !isFunctionPlot;
  const supportsBarPointStyle = supportsBarSeriesStyle && (!subType || !BAR_POINT_STYLE_UNSUPPORTED_SUBTYPES.includes(subType));
  const barPointStyleEnabled = supportsBarPointStyle && data.barItemStyle?.enabled === true;
  const supportsSeriesStyle = supportsLineSeriesStyle || supportsBarSeriesStyle;
  const isScatter = chartType === 'scatter';
  const supportsBasicScatterStyle = isScatter && subType !== 'clustered' && subType !== 'single-axis';
  const supportsClusteredScatterStyle = isScatter && subType === 'clustered';
  const supportsSingleAxisScatterStyle = isScatter && subType === 'single-axis';
  const supportsScatterColorStyle = supportsBasicScatterStyle || supportsClusteredScatterStyle || supportsSingleAxisScatterStyle;
  const singleAxisColorLabels = data.singleAxisScatterData?.days || data.categories;
  const supportsAreaSeriesStyle = supportsLineSeriesStyle && (
    subType === 'area' ||
    subType === 'stacked-area' ||
    subType === 'gradient-stacked-area'
  );
  const supportsGradientSeriesStyle = subType === 'gradient-stacked-area';
  const functionPlot = normalizeFunctionPlot(data.functionPlot);
  const mapVisualMap = options.mapVisualMap || {
    min: 0,
    max: 120,
    isPiecewise: false,
    splitNumber: 5,
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setIsFullScreen(false), 300);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;

    setImportError(null);

    if (file.size > 50 * 1024 * 1024) {
      setImportError('文件超过 50MB，请拆分后再导入。');
      return;
    }

    try {
      const table = await parseImportFile(file);
      setImportFileName(file.name);
      setImportTable(table);
      setIsImportModalOpen(true);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '文件解析失败。');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
  };

  const updateCategory = (idx: number, val: string) => {
    const newCategories = [...data.categories];
    newCategories[idx] = val;
    onChange({ ...data, categories: newCategories });
  };

  const updateSecondaryCategory = (idx: number, val: string) => {
    const newCategories = [...secondaryCategories];
    newCategories[idx] = val;
    onChange({ ...data, secondaryCategories: newCategories });
  };

  const updateSeriesName = (sIdx: number, val: string) => {
    const newSeries = [...data.series];
    newSeries[sIdx] = { ...newSeries[sIdx], name: val };
    onChange({ ...data, series: newSeries });
  };

  const updateSeriesRole = (sIdx: number, role: ChartSeriesRole) => {
    const newSeries = [...data.series];
    newSeries[sIdx] = { ...newSeries[sIdx], role };
    onChange({ ...data, series: newSeries });
  };

  const updateSeriesCustomStyle = (sIdx: number, useCustomStyle: boolean) => {
    const newSeries = [...data.series];
    newSeries[sIdx] = { ...newSeries[sIdx], useCustomStyle };
    onChange({ ...data, series: newSeries });
  };

  const updateMapOption = <K extends keyof ChartOptions>(key: K, value: ChartOptions[K]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const updateMapVisualMapOption = <K extends keyof ChartOptions['mapVisualMap']>(key: K, value: ChartOptions['mapVisualMap'][K]) => {
    onOptionsChange({
      ...options,
      mapVisualMap: {
        ...mapVisualMap,
        [key]: value,
      },
    });
  };

  const updateSeriesStyle = (sIdx: number, key: SeriesStyleKey, value: string) => {
    const newSeries = [...data.series];
    newSeries[sIdx] = {
      ...newSeries[sIdx],
      [key]: value.trim() || undefined,
    };
    onChange({ ...data, series: newSeries });
  };

  const updateSeriesNumericStyle = (sIdx: number, key: SeriesNumericStyleKey, value: number) => {
    const newSeries = [...data.series];
    newSeries[sIdx] = {
      ...newSeries[sIdx],
      [key]: Number.isFinite(value) && value > 0 ? value : undefined,
    };
    onChange({ ...data, series: newSeries });
  };

  const updateBarPointStyleEnabled = (enabled: boolean) => {
    if (!enabled) {
      setActiveBarPointStyle(null);
    }

    onChange({
      ...data,
      barItemStyle: {
        ...data.barItemStyle,
        enabled,
      },
    });
  };

  const updateDataPointStyle = (
    sIdx: number,
    cIdx: number,
    key: DataPointStyleKey,
    value: string | number
  ) => {
    const newSeries = [...data.series];
    const series = newSeries[sIdx];
    if (!series) return;

    const pointStyles = { ...(series.dataPointStyles || {}) };
    const currentStyle = { ...(pointStyles[cIdx] || {}) };
    if (key === 'color') {
      currentStyle.color = String(value).trim() || undefined;
    } else {
      const numericValue = Number(value);
      currentStyle.barWidth = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
    }

    if (hasDataPointStyle(currentStyle)) {
      pointStyles[cIdx] = currentStyle;
    } else {
      delete pointStyles[cIdx];
    }

    newSeries[sIdx] = {
      ...series,
      dataPointStyles: Object.keys(pointStyles).length ? pointStyles : undefined,
    };
    onChange({ ...data, series: newSeries });
  };

  const resetDataPointStyle = (sIdx: number, cIdx: number) => {
    const newSeries = [...data.series];
    const series = newSeries[sIdx];
    if (!series?.dataPointStyles) return;

    const pointStyles = { ...series.dataPointStyles };
    delete pointStyles[cIdx];
    newSeries[sIdx] = {
      ...series,
      dataPointStyles: Object.keys(pointStyles).length ? pointStyles : undefined,
    };
    onChange({ ...data, series: newSeries });
  };

  const updateScatterColorStyle = (key: ScatterColorStyleKey, index: number, value: string) => {
    const colors = [...(data.scatterStyle?.[key] || [])];
    colors[index] = value.trim();

    onChange({
      ...data,
      scatterStyle: {
        ...data.scatterStyle,
        [key]: colors,
      },
    });
  };

  const updateDataPoint = (sIdx: number, cIdx: number, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const newSeries = [...data.series];
    const newData = [...newSeries[sIdx].data];
    newData[cIdx] = num;
    newSeries[sIdx] = { ...newSeries[sIdx], data: newData };
    onChange({ ...data, series: newSeries });
  };

  const updateFunctionPlot = <K extends keyof ChartFunctionPlot>(key: K, value: ChartFunctionPlot[K]) => {
    onChange({
      ...data,
      functionPlot: {
        ...functionPlot,
        [key]: value,
      },
    });
  };

  const addRow = () => {
    onChange({
      ...data,
      categories: [...data.categories, `分类${data.categories.length + 1}`],
      secondaryCategories: showSecondaryXAxis
        ? [...secondaryCategories, getSecondaryCategoryFallback(`分类${data.categories.length + 1}`, data.categories.length)]
        : data.secondaryCategories,
      series: data.series.map(s => ({
        ...s,
        data: [...s.data, 0]
      }))
    });
  };

  const addColumn = () => {
    onChange({
      ...data,
      series: [...data.series, {
        name: `系列${data.series.length + 1}`,
        role: chartType === 'bar' ? 'normal' : undefined,
        data: Array(data.categories.length).fill(0)
      }]
    });
  };

  const removeColumn = (sIdx: number) => {
    if (data.series.length <= 1) return;
    setActiveBarPointStyle((current) => {
      if (!current) return current;
      if (current.seriesIndex === sIdx) return null;
      if (current.seriesIndex > sIdx) return { ...current, seriesIndex: current.seriesIndex - 1 };
      return current;
    });
    onChange({
      ...data,
      series: data.series.filter((_, idx) => idx !== sIdx)
    });
  };

  const removeRow = (cIdx: number) => {
    if (data.categories.length <= 1) return;
    setActiveBarPointStyle((current) => {
      if (!current) return current;
      if (current.categoryIndex === cIdx) return null;
      if (current.categoryIndex > cIdx) return { ...current, categoryIndex: current.categoryIndex - 1 };
      return current;
    });
    onChange({
      ...data,
      categories: data.categories.filter((_, idx) => idx !== cIdx),
      secondaryCategories: data.secondaryCategories?.filter((_, idx) => idx !== cIdx),
      series: data.series.map(s => ({
        ...s,
        data: s.data.filter((_, idx) => idx !== cIdx),
        dataPointStyles: shiftDataPointStylesOnRemove(s.dataPointStyles, cIdx)
      }))
    });
  };

  const addMarkLine = () => {
    const marker: ChartMarker = {
      id: `mark-line-${Date.now()}`,
      name: '平均线',
      type: 'average',
    };

    onChange({ ...data, markLines: [...(data.markLines || []), marker] });
  };

  const addMarkPoint = () => {
    const marker: ChartMarker = {
      id: `mark-point-${Date.now()}`,
      name: '最大值',
      type: 'max',
      seriesIndex: 0,
      categoryIndex: 0,
    };

    onChange({ ...data, markPoints: [...(data.markPoints || []), marker] });
  };

  const updateMarkLine = (idx: number, patch: Partial<ChartMarker>) => {
    const markers = [...(data.markLines || [])];
    markers[idx] = { ...markers[idx], ...patch };
    onChange({ ...data, markLines: markers });
  };

  const updateMarkPoint = (idx: number, patch: Partial<ChartMarker>) => {
    const markers = [...(data.markPoints || [])];
    markers[idx] = { ...markers[idx], ...patch };
    onChange({ ...data, markPoints: markers });
  };

  const removeMarkLine = (idx: number) => {
    onChange({ ...data, markLines: (data.markLines || []).filter((_, markerIndex) => markerIndex !== idx) });
  };

  const removeMarkPoint = (idx: number) => {
    onChange({ ...data, markPoints: (data.markPoints || []).filter((_, markerIndex) => markerIndex !== idx) });
  };

  return (
    <>
    <div
      className={cn(
        "fixed inset-y-0 right-0 bg-surface-container-lowest shadow-xl border-l border-outline-variant/30 z-[70] flex flex-col transform transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        isFullScreen ? "w-full" : "w-full sm:w-[600px]"
      )}
    >
      {/* Expand Button */}
      {!isFullScreen && (
        <button 
          className="absolute -left-[24px] top-1/2 -translate-y-1/2 w-[24px] h-[48px] bg-surface-container-lowest border-y border-l border-outline-variant/50 rounded-r-none rounded-l-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors group shadow-sm z-50 cursor-pointer"
          onClick={() => setIsFullScreen(true)}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div className="flex justify-between items-center p-md border-b border-outline-variant/30 bg-surface-container-low">
        <h3 className="text-headline-sm font-headline-sm text-on-surface">数据源配置</h3>
        <div className="flex items-center gap-sm">
          {isFullScreen && (
            <button 
              className="p-xs text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-full transition-colors flex items-center justify-center cursor-pointer" 
              onClick={() => setIsFullScreen(false)}
              title="还原大小"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}
          <button 
            className="p-xs text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-full transition-colors flex items-center justify-center cursor-pointer" 
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-lg custom-scrollbar">
        <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
          <h4 className="font-label-md text-label-md text-on-surface font-semibold">图表内容</h4>
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">主标题内容</label>
            <input
              className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-body-md outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">副标题内容</label>
            <input
              className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-body-md outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              type="text"
              value={subtitle}
              onChange={(event) => onSubtitleChange(event.target.value)}
            />
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-outline-variant/60 rounded-md p-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary-fixed hover:border-primary transition-colors group bg-surface"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            void handleImportFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={(event) => void handleImportFile(event.target.files?.[0])}
          />
          <UploadCloud className="text-outline w-12 h-12 group-hover:text-primary mb-sm transition-colors" />
          <p className="text-body-lg font-body-lg text-on-surface mb-xs font-medium">拖拽/点击导入数据文件</p>
          <p className="text-body-md font-body-md text-on-surface-variant">支持 .xlsx, .xls, .csv, .tsv, .txt，单文件最大 50MB</p>
          {importError && (
            <p className="mt-sm text-body-md font-body-md text-on-error-container bg-error-container border border-error/30 rounded-md px-sm py-xs">
              {importError}
            </p>
          )}
        </div>

        {chartType === 'map' && (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold">地图映射</h4>
            {subType === 'province' && (
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">省份区域</label>
                <Select value={options.mapRegion || 'guangdong'} onValueChange={(value) => updateMapOption('mapRegion', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择省份" />
                  </SelectTrigger>
                  <SelectContent className="z-[90]">
                    {MAP_PROVINCES.map((province) => (
                      <SelectItem key={province.value} value={province.value}>{province.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between gap-md rounded-md border border-outline-variant/30 bg-surface-container-low px-sm py-sm">
              <div className="text-label-md font-label-md text-on-surface font-medium">分段 VisualMap</div>
              <Switch
                checked={mapVisualMap.isPiecewise}
                onCheckedChange={(value) => updateMapVisualMapOption('isPiecewise', value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">最小值</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  value={mapVisualMap.min}
                  onChange={(event) => updateMapVisualMapOption('min', Number(event.target.value))}
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">最大值</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  value={mapVisualMap.max}
                  onChange={(event) => updateMapVisualMapOption('max', Number(event.target.value))}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-sm">
                <label className="text-label-md font-label-md text-on-surface font-medium">分段数量</label>
                <span className="text-body-md text-on-surface-variant font-code-sm">{mapVisualMap.splitNumber}</span>
              </div>
              <Slider
                min={2}
                max={8}
                step={1}
                value={[mapVisualMap.splitNumber]}
                onValueChange={(value) => updateMapVisualMapOption('splitNumber', value[0])}
              />
            </div>
          </div>
        )}

        {isFunctionPlot && (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold">函数配置</h4>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">函数表达式</label>
              <input
                className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={functionPlot.expression}
                onChange={(event) => updateFunctionPlot('expression', event.target.value)}
                placeholder={DEFAULT_FUNCTION_PLOT.expression}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">X 最小值</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  value={functionPlot.xMin}
                  onChange={(event) => updateFunctionPlot('xMin', Number(event.target.value))}
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">X 最大值</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  value={functionPlot.xMax}
                  onChange={(event) => updateFunctionPlot('xMax', Number(event.target.value))}
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">采样步长</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  min="0.01"
                  step="0.1"
                  value={functionPlot.step}
                  onChange={(event) => updateFunctionPlot('step', Number(event.target.value))}
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">Y 最小值</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  value={functionPlot.yMin}
                  onChange={(event) => updateFunctionPlot('yMin', Number(event.target.value))}
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">Y 最大值</label>
                <input
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  type="number"
                  value={functionPlot.yMax}
                  onChange={(event) => updateFunctionPlot('yMax', Number(event.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Grid Preview */}
        {!isFunctionPlot && (
        <div className="flex flex-col gap-sm">
          <div className="flex flex-wrap justify-between items-end gap-sm">
            <div className="flex flex-col gap-xs">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">数据编辑</h4>
              {supportsBarPointStyle && (
                <label className="flex items-center gap-sm text-body-sm text-on-surface-variant">
                  <Switch
                    checked={barPointStyleEnabled}
                    onCheckedChange={updateBarPointStyleEnabled}
                  />
                  <span>启用单柱样式</span>
                </label>
              )}
            </div>
            <div className="flex gap-sm">
              <button onClick={addRow} className="flex items-center gap-xs px-sm py-xs bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-md text-label-md font-label-md transition-colors shadow-sm cursor-pointer">
                <PlusSquare className="w-4 h-4" />
                添加行
              </button>
              <button onClick={addColumn} className="flex items-center gap-xs px-sm py-xs bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-md text-label-md font-label-md transition-colors shadow-sm cursor-pointer">
                <Columns className="w-4 h-4" />
                添加列
              </button>
            </div>
          </div>
          <div className="border border-outline-variant/50 rounded-md overflow-x-auto shadow-sm pb-2">
            <table className="w-full text-left border-collapse text-body-md font-body-md whitespace-nowrap min-w-max">
              <thead className="bg-surface-container-low text-on-surface font-medium border-b border-outline-variant/50">
                <tr>
                  <th className="w-10 border-r border-outline-variant/50"></th>
                  <th className="py-sm px-sm border-r border-outline-variant/50 w-32 sticky left-0 bg-surface-container-low z-10">类别 \ 系列</th>
                  {showSecondaryXAxis && (
                    <th className="py-sm px-sm border-r border-outline-variant/50 w-36 bg-surface-container-low">第二 X 轴</th>
                  )}
                  {data.series.map((s, idx) => (
                    <th key={idx} className="py-xs px-xs border-r border-outline-variant/50 relative group min-w-[140px]">
                      <div className="flex flex-col gap-xs pr-6">
                        <input
                          className="w-full bg-transparent p-1 outline-none focus:ring-1 focus:ring-primary rounded hover:bg-surface-variant"
                          value={s.name}
                          onChange={(e) => updateSeriesName(idx, e.target.value)}
                        />
                        {chartType === 'bar' && (
                          <Select
                            value={s.role || 'normal'}
                            onValueChange={(value) => updateSeriesRole(idx, value as ChartSeriesRole)}
                          >
                            <SelectTrigger
                              aria-label={`${s.name}处理方式`}
                              title="系列处理方式"
                              className="h-[30px] px-xs py-1 text-[12px] font-label-md text-on-surface-variant shadow-none"
                            >
                              <SelectValue placeholder="处理方式" />
                            </SelectTrigger>
                            <SelectContent className="z-[90]">
                              {SERIES_ROLE_OPTIONS.map(option => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="text-[12px]"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <button onClick={() => removeColumn(idx)} className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all absolute right-1 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-on-surface-variant bg-surface-container-lowest">
                {data.categories.map((cat, cIdx) => (
                  <tr key={cIdx} className="border-b border-outline-variant/30 hover:bg-surface-container transition-colors group">
                    <td className="w-10 border-r border-outline-variant/30 text-center">
                       <button onClick={() => removeRow(cIdx)} className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                    </td>
                    <td className="py-xs px-xs border-r border-outline-variant/30 sticky left-0 bg-surface-container-lowest z-10 font-medium">
                      <input
                          className="w-full bg-transparent p-1 outline-none focus:ring-1 focus:ring-primary rounded hover:bg-surface-variant text-on-surface"
                          value={cat}
                          onChange={(e) => updateCategory(cIdx, e.target.value)}
                        />
                    </td>
                    {showSecondaryXAxis && (
                      <td className="py-xs px-xs border-r border-outline-variant/30 bg-surface-container-lowest">
                        <input
                          className="w-full bg-transparent p-1 outline-none focus:ring-1 focus:ring-primary rounded hover:bg-surface-variant text-on-surface"
                          value={secondaryCategories[cIdx] || ''}
                          onChange={(e) => updateSecondaryCategory(cIdx, e.target.value)}
                        />
                      </td>
                    )}
                    {data.series.map((s, sIdx) => {
                      const pointStyle = s.dataPointStyles?.[cIdx];
                      const hasPointOverride = hasDataPointStyle(pointStyle);
                      const isActivePoint = activeBarPointStyle?.seriesIndex === sIdx && activeBarPointStyle.categoryIndex === cIdx;

                      return (
                        <td key={sIdx} className="py-xs px-xs border-r border-outline-variant/30">
                          <div className="flex items-center gap-xs">
                            <input
                              className="min-w-[72px] flex-1 bg-transparent p-1 outline-none focus:ring-1 focus:ring-primary rounded hover:bg-surface-variant text-on-surface numbers font-code-sm"
                              type="number"
                              value={s.data[cIdx] ?? 0}
                              onChange={(e) => updateDataPoint(sIdx, cIdx, e.target.value)}
                            />
                            {barPointStyleEnabled && (
                              <button
                                className={cn(
                                  "h-8 w-8 shrink-0 rounded-md border border-outline-variant/40 flex items-center justify-center transition-colors cursor-pointer",
                                  isActivePoint
                                    ? "bg-primary-container text-white border-primary-container"
                                    : hasPointOverride
                                      ? "bg-primary-fixed text-on-primary-fixed border-primary/40"
                                      : "bg-surface text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                                )}
                                title={`${s.name} / ${cat} 单柱样式`}
                                onClick={() => setActiveBarPointStyle(isActivePoint ? null : { seriesIndex: sIdx, categoryIndex: cIdx })}
                              >
                                {pointStyle?.color ? (
                                  <span className="h-3.5 w-3.5 rounded-full border border-outline-variant/50" style={{ backgroundColor: pointStyle.color }} />
                                ) : (
                                  <Palette className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {barPointStyleEnabled && activeBarPointStyle && (() => {
            const series = data.series[activeBarPointStyle.seriesIndex];
            const category = data.categories[activeBarPointStyle.categoryIndex];
            if (!series || category == null) return null;

            const pointStyle = series.dataPointStyles?.[activeBarPointStyle.categoryIndex];
            const fallbackColor = series.color || getFallbackSeriesColor(activeBarPointStyle.seriesIndex);
            const barWidth = pointStyle?.barWidth ?? defaultBarWidth;

            return (
              <div className="rounded-md border border-outline-variant/40 bg-surface-container-lowest shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-sm px-md py-sm border-b border-outline-variant/30 bg-surface-container-low">
                  <div className="min-w-0">
                    <div className="text-label-md font-label-md text-on-surface font-semibold">单柱样式</div>
                    <div className="mt-xs text-body-sm text-on-surface-variant truncate">
                      {series.name} / {category}
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-xs px-sm py-xs rounded-md border border-outline-variant/40 bg-surface hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-label-md font-label-md transition-colors cursor-pointer"
                    onClick={() => resetDataPointStyle(activeBarPointStyle.seriesIndex, activeBarPointStyle.categoryIndex)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    重置
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md p-md">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">柱体颜色</label>
                    <div className="flex items-center gap-xs">
                      <input
                        className="h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer"
                        type="color"
                        value={getColorInputValue(pointStyle?.color, fallbackColor)}
                        onChange={(event) => updateDataPointStyle(activeBarPointStyle.seriesIndex, activeBarPointStyle.categoryIndex, 'color', event.target.value)}
                      />
                      <input
                        className="min-w-0 flex-1 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={pointStyle?.color || ''}
                        onChange={(event) => updateDataPointStyle(activeBarPointStyle.seriesIndex, activeBarPointStyle.categoryIndex, 'color', event.target.value)}
                        placeholder="跟随系列"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">柱体宽度</label>
                    <div className="flex items-center gap-xs">
                      <input
                        className="w-28 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        type="number"
                        min={5}
                        max={100}
                        step={5}
                        value={barWidth}
                        onChange={(event) => updateDataPointStyle(activeBarPointStyle.seriesIndex, activeBarPointStyle.categoryIndex, 'barWidth', Number(event.target.value))}
                      />
                      <span className="text-body-sm text-on-surface-variant">%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        )}

        {supportsSeriesStyle && (
          <div className="flex flex-col gap-sm">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold">系列外观</h4>
            <div className="border border-outline-variant/50 rounded-md overflow-x-auto shadow-sm pb-2">
              <table className="w-full text-left border-collapse text-body-md font-body-md whitespace-nowrap min-w-max">
                <thead className="bg-surface-container-low text-on-surface font-medium border-b border-outline-variant/50">
                  <tr>
                    <th className="py-sm px-sm border-r border-outline-variant/50 min-w-[140px]">系列</th>
                    <th className="py-sm px-sm border-r border-outline-variant/50 min-w-[120px]">单独配置</th>
                    <th className="py-sm px-sm border-r border-outline-variant/50 min-w-[190px]">
                      {supportsBarSeriesStyle ? '柱体颜色' : '线条颜色'}
                    </th>
                    <th className="py-sm px-sm border-r border-outline-variant/50 min-w-[150px]">
                      {supportsBarSeriesStyle ? '柱体宽度' : '线条宽度'}
                    </th>
                    {supportsAreaSeriesStyle && (
                      <th className="py-sm px-sm border-r border-outline-variant/50 min-w-[190px]">
                        {supportsGradientSeriesStyle ? '渐变起始色' : '面积颜色'}
                      </th>
                    )}
                    {supportsGradientSeriesStyle && (
                      <th className="py-sm px-sm border-r border-outline-variant/50 min-w-[190px]">渐变结束色</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-on-surface-variant bg-surface-container-lowest">
                  {data.series.map((series, seriesIndex) => {
                    const fallbackColor = getFallbackSeriesColor(seriesIndex);
                    const areaFallback = series.color || fallbackColor;
                    const gradientEndFallback = series.areaColor || '#dbeafe';
                    const widthKey = supportsBarSeriesStyle ? 'barWidth' : 'lineWidth';
                    const widthValue = supportsBarSeriesStyle
                      ? series.barWidth ?? defaultBarWidth
                      : series.lineWidth ?? defaultLineWidth;
                    const customStyleEnabled = series.useCustomStyle === true;

                    return (
                      <tr key={seriesIndex} className="border-b border-outline-variant/30 hover:bg-surface-container transition-colors">
                        <td className="py-xs px-sm border-r border-outline-variant/30 text-on-surface font-medium">
                          <span className="block max-w-[180px] truncate" title={series.name}>{series.name}</span>
                        </td>
                        <td className="py-xs px-sm border-r border-outline-variant/30">
                          <Switch
                            checked={customStyleEnabled}
                            onCheckedChange={(checked) => updateSeriesCustomStyle(seriesIndex, checked)}
                          />
                        </td>
                        <td className="py-xs px-sm border-r border-outline-variant/30">
                          <div className="flex items-center gap-xs">
                            <input
                              className={cn(
                                "h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer",
                                !customStyleEnabled && "opacity-50 cursor-not-allowed"
                              )}
                              type="color"
                              value={getColorInputValue(series.color, fallbackColor)}
                              disabled={!customStyleEnabled}
                              onChange={(event) => updateSeriesStyle(seriesIndex, 'color', event.target.value)}
                            />
                            <input
                              className={cn(
                                "min-w-0 w-28 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                                !customStyleEnabled && "opacity-60 cursor-not-allowed"
                              )}
                              value={series.color || ''}
                              disabled={!customStyleEnabled}
                              onChange={(event) => updateSeriesStyle(seriesIndex, 'color', event.target.value)}
                              placeholder="跟随主题"
                            />
                          </div>
                        </td>
                        <td className="py-xs px-sm border-r border-outline-variant/30">
                          <input
                            className={cn(
                              "w-24 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                              !customStyleEnabled && "opacity-60 cursor-not-allowed"
                            )}
                            type="number"
                            min={supportsBarSeriesStyle ? 5 : 1}
                            max={supportsBarSeriesStyle ? 100 : 10}
                            step={supportsBarSeriesStyle ? 5 : 1}
                            value={widthValue}
                            disabled={!customStyleEnabled}
                            onChange={(event) => updateSeriesNumericStyle(seriesIndex, widthKey, Number(event.target.value))}
                          />
                          <span className="ml-xs text-body-sm text-on-surface-variant">{supportsBarSeriesStyle ? '%' : 'px'}</span>
                        </td>
                        {supportsAreaSeriesStyle && (
                          <td className="py-xs px-sm border-r border-outline-variant/30">
                            <div className="flex items-center gap-xs">
                              <input
                                className={cn(
                                  "h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer",
                                  !customStyleEnabled && "opacity-50 cursor-not-allowed"
                                )}
                                type="color"
                                value={getColorInputValue(supportsGradientSeriesStyle ? series.areaGradientStart : series.areaColor, areaFallback)}
                                disabled={!customStyleEnabled}
                                onChange={(event) => updateSeriesStyle(seriesIndex, supportsGradientSeriesStyle ? 'areaGradientStart' : 'areaColor', event.target.value)}
                              />
                              <input
                                className={cn(
                                  "min-w-0 w-28 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                                  !customStyleEnabled && "opacity-60 cursor-not-allowed"
                                )}
                                value={(supportsGradientSeriesStyle ? series.areaGradientStart : series.areaColor) || ''}
                                disabled={!customStyleEnabled}
                                onChange={(event) => updateSeriesStyle(seriesIndex, supportsGradientSeriesStyle ? 'areaGradientStart' : 'areaColor', event.target.value)}
                                placeholder="跟随主题"
                              />
                            </div>
                          </td>
                        )}
                        {supportsGradientSeriesStyle && (
                          <td className="py-xs px-sm border-r border-outline-variant/30">
                            <div className="flex items-center gap-xs">
                              <input
                                className={cn(
                                  "h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer",
                                  !customStyleEnabled && "opacity-50 cursor-not-allowed"
                                )}
                                type="color"
                                value={getColorInputValue(series.areaGradientEnd, gradientEndFallback)}
                                disabled={!customStyleEnabled}
                                onChange={(event) => updateSeriesStyle(seriesIndex, 'areaGradientEnd', event.target.value)}
                              />
                              <input
                                className={cn(
                                  "min-w-0 w-28 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                                  !customStyleEnabled && "opacity-60 cursor-not-allowed"
                                )}
                                value={series.areaGradientEnd || ''}
                                disabled={!customStyleEnabled}
                                onChange={(event) => updateSeriesStyle(seriesIndex, 'areaGradientEnd', event.target.value)}
                                placeholder="跟随主题"
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {supportsScatterColorStyle && (
          <div className="flex flex-col gap-sm">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold">散点颜色</h4>
            <div className="border border-outline-variant/50 rounded-md overflow-hidden shadow-sm">
              {supportsBasicScatterStyle && data.series[0] && (() => {
                const series = data.series[0];
                const fallbackColor = getFallbackSeriesColor(0);
                const customStyleEnabled = series.useCustomStyle === true;

                return (
                  <div className="grid grid-cols-[minmax(120px,1fr)_120px_minmax(190px,auto)] items-center border-b border-outline-variant/30 bg-surface-container-lowest">
                    <div className="py-xs px-sm border-r border-outline-variant/30 text-on-surface font-medium">
                      {series.name || '散点'}
                    </div>
                    <div className="py-xs px-sm border-r border-outline-variant/30">
                      <Switch
                        checked={customStyleEnabled}
                        onCheckedChange={(checked) => updateSeriesCustomStyle(0, checked)}
                      />
                    </div>
                    <div className="py-xs px-sm">
                      <div className="flex items-center gap-xs">
                        <input
                          className={cn(
                            "h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer",
                            !customStyleEnabled && "opacity-50 cursor-not-allowed"
                          )}
                          type="color"
                          value={getColorInputValue(series.color, fallbackColor)}
                          disabled={!customStyleEnabled}
                          onChange={(event) => updateSeriesStyle(0, 'color', event.target.value)}
                        />
                        <input
                          className={cn(
                            "min-w-0 w-32 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                            !customStyleEnabled && "opacity-60 cursor-not-allowed"
                          )}
                          value={series.color || ''}
                          disabled={!customStyleEnabled}
                          onChange={(event) => updateSeriesStyle(0, 'color', event.target.value)}
                          placeholder="跟随主题"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {supportsClusteredScatterStyle && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 bg-surface-container-lowest">
                  {Array.from({ length: SCATTER_CLUSTER_COUNT }, (_, index) => {
                    const fallbackColor = SCATTER_CLUSTER_COLORS[index % SCATTER_CLUSTER_COLORS.length];
                    const color = data.scatterStyle?.clusterColors?.[index] || '';

                    return (
                      <div key={index} className="flex items-center justify-between gap-sm py-xs px-sm border-b border-r border-outline-variant/30">
                        <span className="text-body-md text-on-surface font-medium">cluster {index}</span>
                        <div className="flex items-center gap-xs">
                          <input
                            className="h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer"
                            type="color"
                            value={getColorInputValue(color, fallbackColor)}
                            onChange={(event) => updateScatterColorStyle('clusterColors', index, event.target.value)}
                          />
                          <input
                            className="min-w-0 w-28 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={color}
                            onChange={(event) => updateScatterColorStyle('clusterColors', index, event.target.value)}
                            placeholder={fallbackColor}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {supportsSingleAxisScatterStyle && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 bg-surface-container-lowest">
                  {singleAxisColorLabels.map((label, index) => {
                    const fallbackColor = SCATTER_CLUSTER_COLORS[index % SCATTER_CLUSTER_COLORS.length];
                    const color = data.scatterStyle?.singleAxisColors?.[index] || '';

                    return (
                      <div key={`${label}-${index}`} className="flex items-center justify-between gap-sm py-xs px-sm border-b border-r border-outline-variant/30">
                        <span className="text-body-md text-on-surface font-medium truncate" title={label}>{label}</span>
                        <div className="flex items-center gap-xs">
                          <input
                            className="h-9 w-10 rounded border border-outline-variant/50 bg-transparent cursor-pointer"
                            type="color"
                            value={getColorInputValue(color, fallbackColor)}
                            onChange={(event) => updateScatterColorStyle('singleAxisColors', index, event.target.value)}
                          />
                          <input
                            className="min-w-0 w-28 h-9 px-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            value={color}
                            onChange={(event) => updateScatterColorStyle('singleAxisColors', index, event.target.value)}
                            placeholder={fallbackColor}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {supportsMarkers && (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">标记数据</h4>
              <div className="flex gap-sm">
                <button onClick={addMarkLine} className="flex items-center gap-xs px-sm py-xs bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-md text-label-md font-label-md transition-colors shadow-sm cursor-pointer">
                  <PlusSquare className="w-4 h-4" />
                  添加标记线
                </button>
                <button onClick={addMarkPoint} className="flex items-center gap-xs px-sm py-xs bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-md text-label-md font-label-md transition-colors shadow-sm cursor-pointer">
                  <PlusSquare className="w-4 h-4" />
                  添加标记点
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
              <div className="rounded-md border border-outline-variant/30 overflow-hidden">
                <div className="px-sm py-xs bg-surface-container-low text-label-md font-label-md text-on-surface font-semibold">标记线</div>
                <div className="p-sm flex flex-col gap-sm">
                  {(data.markLines || []).length === 0 ? (
                    <div className="text-body-sm text-on-surface-variant py-sm">暂无标记线</div>
                  ) : (
                    (data.markLines || []).map((marker, idx) => (
                      <div key={marker.id} className="grid grid-cols-12 gap-xs items-center">
                        <input
                          className="col-span-3 p-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm outline-none focus:ring-1 focus:ring-primary"
                          value={marker.name}
                          onChange={(event) => updateMarkLine(idx, { name: event.target.value })}
                          placeholder="名称"
                        />
                        <Select value={marker.type} onValueChange={(value) => updateMarkLine(idx, { type: value as ChartMarkerType })}>
                          <SelectTrigger className="col-span-3 h-[32px] text-body-sm px-xs">
                            <SelectValue placeholder="类型" />
                          </SelectTrigger>
                          <SelectContent className="z-[90]">
                            {MARKER_TYPE_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={marker.seriesIndex == null ? 'all' : String(marker.seriesIndex)}
                          onValueChange={(value) => updateMarkLine(idx, { seriesIndex: value === 'all' ? undefined : Number(value) })}
                        >
                          <SelectTrigger className="col-span-3 h-[32px] text-body-sm px-xs">
                            <SelectValue placeholder="系列" />
                          </SelectTrigger>
                          <SelectContent className="z-[90]">
                            <SelectItem value="all">全部系列</SelectItem>
                            {data.series.map((series, seriesIndex) => (
                              <SelectItem key={seriesIndex} value={String(seriesIndex)}>{series.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {marker.type === 'custom' ? (
                          <input
                            className="col-span-2 p-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm outline-none focus:ring-1 focus:ring-primary"
                            type="number"
                            value={marker.value ?? 0}
                            onChange={(event) => updateMarkLine(idx, { value: Number(event.target.value) })}
                          />
                        ) : (
                          <div className="col-span-2 text-body-sm text-on-surface-variant">自动</div>
                        )}
                        <button onClick={() => removeMarkLine(idx)} className="col-span-1 p-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-md border border-outline-variant/30 overflow-hidden">
                <div className="px-sm py-xs bg-surface-container-low text-label-md font-label-md text-on-surface font-semibold">标记点</div>
                <div className="p-sm flex flex-col gap-sm">
                  {(data.markPoints || []).length === 0 ? (
                    <div className="text-body-sm text-on-surface-variant py-sm">暂无标记点</div>
                  ) : (
                    (data.markPoints || []).map((marker, idx) => (
                      <div key={marker.id} className="grid grid-cols-12 gap-xs items-center">
                        <input
                          className="col-span-2 p-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm outline-none focus:ring-1 focus:ring-primary"
                          value={marker.name}
                          onChange={(event) => updateMarkPoint(idx, { name: event.target.value })}
                          placeholder="名称"
                        />
                        <Select value={marker.type} onValueChange={(value) => updateMarkPoint(idx, { type: value as ChartMarkerType })}>
                          <SelectTrigger className="col-span-2 h-[32px] text-body-sm px-xs">
                            <SelectValue placeholder="类型" />
                          </SelectTrigger>
                          <SelectContent className="z-[90]">
                            {MARKER_TYPE_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={marker.seriesIndex == null ? '0' : String(marker.seriesIndex)}
                          onValueChange={(value) => updateMarkPoint(idx, { seriesIndex: Number(value) })}
                        >
                          <SelectTrigger className="col-span-2 h-[32px] text-body-sm px-xs">
                            <SelectValue placeholder="系列" />
                          </SelectTrigger>
                          <SelectContent className="z-[90]">
                            {data.series.map((series, seriesIndex) => (
                              <SelectItem key={seriesIndex} value={String(seriesIndex)}>{series.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {marker.type === 'custom' ? (
                          <>
                            <Select
                              value={String(marker.categoryIndex ?? 0)}
                              onValueChange={(value) => updateMarkPoint(idx, { categoryIndex: Number(value) })}
                            >
                              <SelectTrigger className="col-span-3 h-[32px] text-body-sm px-xs">
                                <SelectValue placeholder="类别" />
                              </SelectTrigger>
                              <SelectContent className="z-[90]">
                                {data.categories.map((category, categoryIndex) => (
                                  <SelectItem key={categoryIndex} value={String(categoryIndex)}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <input
                              className="col-span-2 p-xs border border-outline-variant/50 rounded-md bg-surface text-body-sm font-code-sm outline-none focus:ring-1 focus:ring-primary"
                              type="number"
                              value={marker.value ?? 0}
                              onChange={(event) => updateMarkPoint(idx, { value: Number(event.target.value) })}
                            />
                          </>
                        ) : (
                          <div className="col-span-5 text-body-sm text-on-surface-variant">自动</div>
                        )}
                        <button onClick={() => removeMarkPoint(idx)} className="col-span-1 p-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-md border-t border-outline-variant/30 bg-surface-container-low flex justify-end gap-sm">
        <button 
          className="px-md py-sm bg-primary !text-white rounded-md hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
          onClick={onClose}
        >
          完成
        </button>
      </div>
    </div>
    <DataImportModal
      isOpen={isImportModalOpen}
      fileName={importFileName}
      table={importTable}
      chartType={chartType}
      subType={subType}
      onClose={closeImportModal}
      onApply={(importedData) => {
        onChange(importedData);
        setIsImportModalOpen(false);
      }}
    />
    </>
  );
}
