export type ChartSeriesRole = 'normal' | 'stack' | 'positive' | 'negative';

export interface ChartSeries {
  name: string;
  data: number[];
  role?: ChartSeriesRole;
}

export interface ChartData {
  categories: string[];
  series: ChartSeries[];
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
  | 'log';

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

  // Global modifiers
  subType?: ChartSubType;
}
