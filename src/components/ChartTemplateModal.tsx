"use client";

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, LayoutTemplate } from 'lucide-react';
import { ChartType, ChartSubType, ChartOptions, ChartData } from '@/types';
import { createSampleChart, createScatterTemplateData } from '@/lib/chart-samples';
import { Chart } from './Chart';

interface Template {
  id: ChartSubType;
  name: string;
  desc: string;
  type: ChartType;
  getOptions?: Partial<ChartOptions>;
}

const TEMPLATES: Template[] = [
  // BAR CHARTS
  { 
    id: 'basic', name: '基础柱状图', desc: '标准的分类数据比较', type: 'bar',
    getOptions: { subType: 'basic' }
  },
  { 
    id: 'stacked', name: '堆叠型柱状图', desc: '展现总量和各分量的构成情况', type: 'bar',
    getOptions: { subType: 'stacked', showLegend: true }
  },
  { 
    id: 'horizontal', name: '横向柱状图', desc: '适合分类名称较长的数据', type: 'bar',
    getOptions: { subType: 'horizontal' }
  },
  { 
    id: 'rounded-stacked', name: '带圆角的堆积柱状图', desc: '边缘圆滑，视觉效果更柔和', type: 'bar',
    getOptions: { subType: 'rounded-stacked', showLegend: true }
  },
  { 
    id: 'waterfall', name: '阶梯瀑布图', desc: '展示数据的累计增减过程', type: 'bar',
    getOptions: { subType: 'waterfall', showDataLabels: true, labelPosition: 'inside' }
  },
  { 
    id: 'broken-axis', name: '断轴上的柱状图', desc: '适合真实数据跨度很大的场景', type: 'bar',
    getOptions: { subType: 'broken-axis', showLegend: true }
  },
  { 
    id: 'negative-staggered', name: '交错正负轴标签', desc: '正负向数据交错对比', type: 'bar',
    getOptions: { subType: 'negative-staggered', showDataLabels: true, labelPosition: 'inside' }
  },
  { 
    id: 'polar-label', name: '极坐标柱状图', desc: '环形的柱状展现形式', type: 'bar',
    getOptions: { subType: 'polar-label' }
  },
  { 
    id: 'negative-bar', name: '正负条形图', desc: '横向展示正负背离的数据', type: 'bar',
    getOptions: { subType: 'negative-bar', showLegend: true, showDataLabels: true, labelPosition: 'inside' }
  },
  { 
    id: 'stacked-horizontal', name: '堆叠条形图', desc: '横向堆叠展示多个系列总量', type: 'bar',
    getOptions: { subType: 'stacked-horizontal', showLegend: true, showDataLabels: true, labelPosition: 'inside' }
  },

  // PIE CHARTS
  {
    id: 'basic', name: '基础饼图', desc: '标准占比结构展示', type: 'pie',
    getOptions: { subType: 'basic', showLegend: true, showDataLabels: true, labelPosition: 'outside', pieInnerRadius: 0, pieOuterRadius: 70 }
  },
  {
    id: 'donut', name: '环形图', desc: '以内外半径呈现占比结构', type: 'pie',
    getOptions: { subType: 'donut', showLegend: true, showDataLabels: false, labelPosition: 'inside', pieInnerRadius: 40, pieOuterRadius: 70 }
  },
  {
    id: 'rounded-donut', name: '圆角环形图', desc: '带圆角和分隔描边的环形图', type: 'pie',
    getOptions: { subType: 'rounded-donut', showLegend: true, showDataLabels: false, labelPosition: 'inside', pieInnerRadius: 40, pieOuterRadius: 70 }
  },
  {
    id: 'gap-donut', name: '扇区间隙环形图', desc: '环形扇区之间保留可调间隙', type: 'pie',
    getOptions: { subType: 'gap-donut', showLegend: true, showDataLabels: false, labelPosition: 'inside', pieInnerRadius: 40, pieOuterRadius: 70, piePadAngle: 5 }
  },
  {
    id: 'nightingale', name: '南丁格尔玫瑰图', desc: '左右对比半径与面积两种玫瑰模式', type: 'pie',
    getOptions: { subType: 'nightingale', showLegend: true, showDataLabels: false, labelPosition: 'outside', pieInnerRadius: 12, pieOuterRadius: 72 }
  },
  {
    id: 'nightingale-basic', name: '基础南丁格尔玫瑰图', desc: '单组面积模式玫瑰图', type: 'pie',
    getOptions: { subType: 'nightingale-basic', showLegend: true, showDataLabels: true, labelPosition: 'outside', pieInnerRadius: 20, pieOuterRadius: 78 }
  },
  {
    id: 'nested-donut', name: '嵌套环形图', desc: '内外两层环形结构展示层级占比', type: 'pie',
    getOptions: { subType: 'nested-donut', showLegend: true, showDataLabels: true, labelPosition: 'outside', pieInnerRadius: 45, pieOuterRadius: 64 }
  },

  // LINE CHARTS
  { 
    id: 'basic', name: '基础折线图', desc: '展示数据的变化趋势', type: 'line',
    getOptions: { subType: 'basic', smoothLine: false, fillArea: false, stepLine: false }
  },
  { 
    id: 'smooth', name: '基础平滑折线图', desc: '平滑曲线连接各数据点', type: 'line',
    getOptions: { subType: 'smooth', smoothLine: true, fillArea: false, stepLine: false }
  },
  { 
    id: 'area', name: '基础面积图', desc: '填充线下方区域', type: 'line',
    getOptions: { subType: 'area', fillArea: true, smoothLine: false, stepLine: false }
  },
  { 
    id: 'stacked', name: '堆叠折线图', desc: '多系列折线堆叠显示', type: 'line',
    getOptions: { subType: 'stacked', smoothLine: false, fillArea: false, stepLine: false }
  },
  { 
    id: 'stacked-area', name: '堆叠面积图', desc: '多系列面积堆叠显示', type: 'line',
    getOptions: { subType: 'stacked-area', fillArea: true }
  },
  { 
    id: 'gradient-stacked-area', name: '渐变堆叠面积图', desc: '面积填充使用渐变色彩', type: 'line',
    getOptions: { subType: 'gradient-stacked-area', fillArea: true }
  },
  { 
    id: 'bump', name: '凹凸图', desc: '展示排名的随时间变化', type: 'line',
    getOptions: { subType: 'bump', showYSplitLine: false }
  },
  { 
    id: 'step', name: '阶梯折线图', desc: '状态突变时使用', type: 'line',
    getOptions: { subType: 'step', stepLine: true, smoothLine: false, fillArea: false }
  },
  { 
    id: 'log', name: '对数轴示例', desc: '展示跨度极大的数据差异', type: 'line',
    getOptions: { subType: 'log', smoothLine: false, fillArea: false, stepLine: false }
  },
  {
    id: 'multi-x', name: '多 X 轴折线图', desc: '使用上下两组 X 轴对比多个系列', type: 'line',
    getOptions: { subType: 'multi-x', smoothLine: true, fillArea: false, stepLine: false, showLegend: true }
  },
  {
    id: 'function-plot', name: '函数绘图', desc: '绘制连续函数曲线并支持缩放', type: 'line',
    getOptions: { subType: 'function-plot', smoothLine: false, fillArea: false, stepLine: false, showLegend: false, showDataLabels: false }
  },

  // SCATTER CHARTS
  {
    id: 'basic', name: '基础散点图', desc: '二维数值点分布', type: 'scatter',
    getOptions: { subType: 'basic', scatterSize: 20, showLegend: false, showGrid: true }
  },
  {
    id: 'clustered', name: '数据聚合', desc: '按坐标距离聚合分簇', type: 'scatter',
    getOptions: { subType: 'clustered', scatterSize: 15, showLegend: true, showGrid: true }
  },
  {
    id: 'single-axis', name: '单轴散点图', desc: '按日期分行展示小时分布', type: 'scatter',
    getOptions: { subType: 'single-axis', scatterSize: 14, showLegend: false, showGrid: false, showDataLabels: false }
  }
];

const THUMBNAIL_BASE_OPTIONS: ChartOptions = {
  animationDuration: 0,
  backgroundColor: undefined,
  showGrid: false,
  showTitle: false,
  title: '',
  subtitle: '',
  titleAlign: 'center',
  titleSize: 20,
  titleBold: true,
  showLegend: false,
  legendLayout: 'horizontal',
  legendType: 'plain',
  showTooltip: false,
  tooltipAlpha: 0.95,
  showXAxis: true,
  showAxisLabels: false,
  xLabelRotate: 0,
  showYSplitLine: false,
  ySplitLineType: 'dashed',
  barWidth: 28,
  lineWidth: 2,
  scatterSize: 14,
  pieInnerRadius: 40,
  pieOuterRadius: 70,
  piePadAngle: 5,
  showDataLabels: false,
  labelPosition: 'top',
  smoothLine: false,
  fillArea: false,
  stepLine: false,
  lineSymbol: 'none',
  lineSymbolSize: 8,
  useCustomLinePalette: false,
  lineColor: '#2563eb',
  secondaryLineColor: '#ef4444',
  areaColor: '#93c5fd',
  areaOpacity: 0.35,
  areaGradientStart: '#2563eb',
  areaGradientEnd: '#dbeafe',
  showMarkLine: false,
  markLineType: 'dashed',
  markLineColor: '#ef4444',
  showMarkPoint: false,
  markPointSymbol: 'pin',
  markPointSymbolSize: 48,
  markPointColor: '#ef4444',
  subType: 'basic',
};

const BROKEN_AXIS_THUMBNAIL_DATA: ChartData = {
  categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    { name: '数据 A', data: [1500, 2032, 2001, 3154, 2190, 4330, 2410] },
    { name: '数据 B', data: [1200, 1320, 1010, 1340, 900, 2300, 2100] },
    { name: '数据 C', data: [103200, 100320, 103010, 102340, 103900, 103300, 103200] },
    { name: '数据 D', data: [3106212, 3102118, 3102643, 3104631, 3106679, 3100130, 3107022] },
  ],
};

function getThumbnailData(chartType: ChartType, subType: ChartSubType, baseData: ChartData): ChartData {
  if (chartType === 'scatter') {
    const scatterData = createScatterTemplateData(subType);

    if (subType === 'clustered') {
      return {
        ...scatterData,
        scatterData: scatterData.scatterData?.filter((_, index) => index % 2 === 0),
      };
    }

    if (subType === 'single-axis' && scatterData.singleAxisScatterData) {
      const source = scatterData.singleAxisScatterData;
      const selectedDayIndexes = [0, 3, 6].filter((index) => index < source.days.length);
      const selectedHourIndexes = source.hours
        .map((_, index) => index)
        .filter((index) => index % 2 === 0);
      const hourIndexMap = new Map(selectedHourIndexes.map((hourIndex, index) => [hourIndex, index]));
      const days = selectedDayIndexes.map((index) => source.days[index]);
      const hours = selectedHourIndexes.map((index) => source.hours[index]);

      return {
        ...scatterData,
        categories: days,
        series: days.map((day, dayIndex) => ({
          name: day,
          data: hours.map((_, hourIndex) => (
            source.data.find((point) => point[0] === selectedDayIndexes[dayIndex] && hourIndexMap.get(point[1]) === hourIndex)?.[2] ?? 0
          )),
        })),
        singleAxisScatterData: {
          days,
          hours,
          data: source.data
            .filter((point) => selectedDayIndexes.includes(point[0]) && hourIndexMap.has(point[1]))
            .map((point) => [
              selectedDayIndexes.indexOf(point[0]),
              hourIndexMap.get(point[1]) ?? 0,
              point[2],
            ]),
        },
      };
    }

    return scatterData;
  }

  if (chartType === 'bar' && subType === 'broken-axis') {
    return BROKEN_AXIS_THUMBNAIL_DATA;
  }

  if (chartType === 'line' && subType === 'multi-x') {
    return {
      ...baseData,
      secondaryCategories: baseData.categories.map((category, index) => `${category}-对比${index + 1}`),
    };
  }

  return baseData;
}

export interface ChartTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: ChartType;
  currentSubType: ChartSubType | undefined;
  onSelect: (subType: ChartSubType, options: Partial<ChartOptions>) => void;
}

export function ChartTemplateModal({ isOpen, onClose, chartType, currentSubType = 'basic', onSelect }: ChartTemplateModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const validTemplates = useMemo(() => TEMPLATES.filter(t => t.type === chartType), [chartType]);
  const thumbnailSample = useMemo(() => createSampleChart(chartType, 20240620), [chartType]);

  useEffect(() => {
    let frame = 0;
    let timeout = 0;

    if (isOpen) {
      setShouldRender(true);
      setIsVisible(false);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeout = window.setTimeout(() => setShouldRender(false), 300);
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-end bg-surface-container-highest/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "bg-surface-container-low w-screen h-screen shadow-2xl border-t border-outline-variant/30 flex flex-col overflow-hidden transform transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex justify-between items-center p-lg border-b border-outline-variant/20 bg-surface">
          <div className="flex items-center gap-sm text-on-surface">
            <LayoutTemplate className="w-6 h-6 text-primary" />
            <div className="flex flex-col">
               <h2 className="text-title-lg font-title-lg font-bold">选择图表模板</h2>
               <span className="text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">{validTemplates.length} 个 {chartType} 类型预设模板</span>
            </div>
          </div>
          <button 
            className="p-sm text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer border border-transparent hover:border-outline-variant/30 shadow-sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-xl bg-surface-container-low">
          {validTemplates.length === 0 ? (
            <div className="text-center text-on-surface-variant p-xl">
              此图表类型暂无预设模板
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-lg pb-xl">
              {validTemplates.map((template) => {
                 const actualSubType = template.getOptions?.subType || template.id;
                 const isActive = currentSubType === actualSubType;
                 const thumbnailOptions = {
                    ...THUMBNAIL_BASE_OPTIONS,
                    ...(template.getOptions || {}),
                    animationDuration: 0,
                    showTitle: false,
                    showLegend: false,
                    showTooltip: false,
                    showXAxis: true,
                    showAxisLabels: false,
                    showGrid: false,
                    showYSplitLine: false,
                    showDataLabels: false,
                    showMarkLine: false,
                    showMarkPoint: false,
                    lineSymbol: 'none',
                    labelPosition: chartType === 'pie' ? 'outside' : 'top',
                    title: '',
                    subtitle: '',
                    subType: actualSubType,
                 } as ChartOptions;
                 const thumbnailData = getThumbnailData(chartType, actualSubType, thumbnailSample.data);

                 return (
                   <div 
                     key={template.id}
                     onClick={() => {
                       onSelect(actualSubType, template.getOptions || {});
                     }}
                     className={cn(
                       "group relative cursor-pointer transition-all duration-300 ease-out flex flex-col gap-sm transform hover:-translate-y-1",
                       isActive ? "text-primary" : "text-on-surface hover:text-primary"
                     )}
                   >
                     <div
                       className={cn(
                          "h-[clamp(150px,11.5vw,220px)] bg-surface flex items-center justify-center p-sm border overflow-hidden shadow-sm transition-all duration-300",
                         isActive ? "border-primary ring-2 ring-primary" : "border-outline-variant/30 group-hover:border-primary/50 group-hover:shadow-md"
                       )}
                     >
                        <div className="w-full h-full transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02] pointer-events-none">
                           <Chart
                              className="w-full h-full"
                              isSidebarCollapsed={true}
                              theme="default"
                              data={thumbnailData}
                              options={thumbnailOptions}
                              chartType={chartType}
                           />
                        </div>
                     </div>
                     <div className="px-xs pb-sm">
                       <h3 className="text-title-sm font-title-sm font-bold transition-colors flex items-center justify-between">
                         {template.name}
                         {isActive && <span className="w-2 h-2 rounded-full bg-primary shadow-sm" />}
                       </h3>
                     </div>
                   </div>
                 );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
