export type ChartSeriesRole = 'normal' | 'stack' | 'positive' | 'negative';
export type ChartSymbolType = 'emptyCircle' | 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'none';
export type ChartMarkerType = 'max' | 'min' | 'average' | 'custom';

export interface ChartSeries {
  name: string;
  data: number[];
  role?: ChartSeriesRole;
}

export interface ChartMarker {
  id: string;
  name: string;
  type: ChartMarkerType;
  seriesIndex?: number;
  categoryIndex?: number;
  value?: number;
}

export interface ChartData {
  categories: string[];
  secondaryCategories?: string[];
  series: ChartSeries[];
  markLines?: ChartMarker[];
  markPoints?: ChartMarker[];
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';
export type ChartSubType = 
  | 'basic' 
  | 'stacked' 
  | 'horizontal' 
  | 'waterfall' 
  | 'rounded'
  | 'rounded-stacked'
  | 'broken-axis'
  | 'negative-staggered'
  | 'polar-label'
  | 'negative-bar'
  | 'stacked-horizontal'
  | 'smooth'
  | 'area'
  | 'stacked-area'
  | 'gradient-stacked-area'
  | 'bump'
  | 'step'
  | 'log'
  | 'multi-x'
  | 'function-plot';

export interface ChartOptions {
  // Canvas
  animationDuration: number;
  backgroundColor?: string;
  showGrid: boolean;
  
  // Titles
  showTitle: boolean;
  title: string;
  subtitle: string;
  titleAlign: 'left' | 'center' | 'right';
  titleSize: number;
  titleBold: boolean;

  // Legend & Tooltip
  showLegend: boolean;
  legendLayout: 'horizontal' | 'vertical';
  legendType: 'plain' | 'scroll';
  showTooltip: boolean;
  tooltipAlpha: number;

  // Axis
  showXAxis: boolean;
  xLabelRotate: number;
  showYSplitLine: boolean;
  ySplitLineType: 'solid' | 'dashed' | 'dotted';

  // Series options
  barWidth: number;
  showDataLabels: boolean;
  labelPosition:
    | 'none'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'inside'
    | 'insideTop'
    | 'insideBottom'
    | 'insideLeft'
    | 'insideRight'
    | 'outside';
  
  // Line specific
  smoothLine: boolean;
  fillArea: boolean;
  stepLine: boolean;
  lineSymbol: ChartSymbolType;
  lineSymbolSize: number;

  // Markers
  showMarkLine: boolean;
  markLineType: 'solid' | 'dashed' | 'dotted';
  markLineColor: string;
  showMarkPoint: boolean;
  markPointSymbol: ChartSymbolType;
  markPointSymbolSize: number;
  markPointColor: string;

  // Global modifiers
  subType?: ChartSubType;
}
