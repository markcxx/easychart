"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { ChartOptions, ChartSymbolType, ChartType } from '@/types';

interface StyleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chartTheme: string;
  onThemeChange: (theme: string) => void;
  options: ChartOptions;
  onOptionsChange: (opts: ChartOptions) => void;
  chartType: ChartType;
}

type PaneType = 'main' | 'canvas' | 'titles' | 'legend' | 'axis' | 'series';

const PANE_TITLES: Record<string, string> = {
  'canvas': '画布配置',
  'titles': '标题与文本',
  'legend': '图例与提示',
  'axis': '坐标系',
  'series': '图形样式'
};

const THEMES = [
  { value: 'default', label: '默认主题 (Default)' },
  { value: 'dark', label: '暗黑模式 (Dark)' },
  { value: 'macarons', label: '马卡龙 (Macarons)' },
  { value: 'vintage', label: '复古风 (Vintage)' },
  { value: 'roma', label: '罗马风 (Roma)' },
  { value: 'shine', label: '发光 (Shine)' },
  { value: 'infographic', label: '信息图 (Infographic)' },
  { value: 'dark-blue', label: '深蓝 (Dark Blue)' },
  { value: 'green', label: '绿色生态 (Green)' },
  { value: 'red', label: '热情红 (Red)' },
  { value: 'blue', label: '幽玄蓝 (Blue)' },
  { value: 'tech-blue', label: '科技蓝 (Tech Blue)' },
  { value: 'mint', label: '清爽薄荷 (Mint)' },
];

const SYMBOL_OPTIONS: { value: ChartSymbolType; label: string }[] = [
  { value: 'emptyCircle', label: '空心圆' },
  { value: 'circle', label: '实心圆' },
  { value: 'rect', label: '方形' },
  { value: 'roundRect', label: '圆角方形' },
  { value: 'triangle', label: '三角形' },
  { value: 'diamond', label: '菱形' },
  { value: 'pin', label: '气泡图钉' },
  { value: 'arrow', label: '箭头' },
  { value: 'none', label: '不显示' },
];

const BAR_LABEL_POSITION_OPTIONS: { value: ChartOptions['labelPosition']; label: string }[] = [
  { value: 'top', label: '上方' },
  { value: 'inside', label: '内部居中' },
  { value: 'insideTop', label: '内部上方' },
  { value: 'insideBottom', label: '内部下方' },
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
  { value: 'bottom', label: '下方' },
  { value: 'insideLeft', label: '内部左侧' },
  { value: 'insideRight', label: '内部右侧' },
];

const POINT_LABEL_POSITION_OPTIONS: { value: ChartOptions['labelPosition']; label: string }[] = [
  { value: 'top', label: '上方' },
  { value: 'bottom', label: '下方' },
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
];

const PIE_LABEL_POSITION_OPTIONS: { value: ChartOptions['labelPosition']; label: string }[] = [
  { value: 'outside', label: '外侧' },
  { value: 'inside', label: '内部' },
];

function getSeriesSizeLabel(chartType: ChartType) {
  if (chartType === 'bar') return '柱形宽度';
  if (chartType === 'line') return '线条粗细';
  if (chartType === 'scatter') return '散点大小';
  return '图形尺寸';
}

function getLabelPositionOptions(chartType: ChartType) {
  if (chartType === 'line' || chartType === 'scatter') return POINT_LABEL_POSITION_OPTIONS;
  if (chartType === 'pie') return PIE_LABEL_POSITION_OPTIONS;
  return BAR_LABEL_POSITION_OPTIONS;
}

export function StyleDrawer({ isOpen, onClose, chartTheme, onThemeChange, options, onOptionsChange, chartType }: StyleDrawerProps) {
  const [activePane, setActivePane] = useState<PaneType>('main');

  const handleClose = () => {
    onClose();
    setTimeout(() => setActivePane('main'), 300);
  };

  const updateOption = <K extends keyof ChartOptions>(key: K, value: ChartOptions[K]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const renderContent = () => {
    switch (activePane) {
      case 'canvas':
        return (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">背景颜色</label>
              <div className="flex items-center gap-sm">
                <div className="relative w-10 h-10 rounded border border-outline-variant/50 overflow-hidden shadow-sm">
                  <input className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" type="color" value={options.backgroundColor || '#ffffff'} onChange={(e) => updateOption('backgroundColor', e.target.value)} />
                </div>
                <input className="flex-1 p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary" type="text" value={options.backgroundColor || ''} onChange={(e) => updateOption('backgroundColor', e.target.value)} placeholder="默认跟随主题" />
              </div>
            </div>
            {chartType !== 'pie' && (
              <div className="flex items-center justify-between">
                <label className="text-label-md font-label-md text-on-surface font-medium">显示网格 (Grid)</label>
                <Switch checked={options.showGrid} onCheckedChange={(v) => updateOption('showGrid', v)} />
              </div>
            )}
            <div>
              <div className="flex justify-between mb-sm mt-sm">
                <label className="text-label-md font-label-md text-on-surface font-medium">动画时长</label>
                <span className="text-body-md text-on-surface-variant font-code-sm">{options.animationDuration}ms</span>
              </div>
              <Slider 
                min={0} max={3000} step={100} value={[options.animationDuration]} 
                onValueChange={(v) => updateOption('animationDuration', v[0])} 
              />
            </div>
          </div>
        );
      case 'titles':
        return (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <label className="text-label-md font-label-md text-on-surface font-medium">显示主标题</label>
              <Switch checked={options.showTitle} onCheckedChange={(v) => updateOption('showTitle', v)} />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">对齐方式</label>
                <Select value={options.titleAlign} onValueChange={(v: any) => updateOption('titleAlign', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="对齐方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">居左</SelectItem>
                    <SelectItem value="center">居中</SelectItem>
                    <SelectItem value="right">居右</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">主标题字号</label>
                <input 
                  className="w-full p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-body-md outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                  type="number" 
                  value={options.titleSize} 
                  onChange={(e) => updateOption('titleSize', parseInt(e.target.value) || 12)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-sm">
              <label className="text-label-md font-label-md text-on-surface font-medium">主标题加粗</label>
              <Switch checked={options.titleBold} onCheckedChange={(v) => updateOption('titleBold', v)} />
            </div>
          </div>
        );
      case 'legend':
        return (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <label className="text-label-md font-label-md text-on-surface font-medium">显示图例</label>
              <Switch checked={options.showLegend} onCheckedChange={(v) => updateOption('showLegend', v)} />
            </div>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">图例类型</label>
              <Select value={options.legendType} onValueChange={(v: any) => updateOption('legendType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="图例类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">普通图例 (Plain)</SelectItem>
                  <SelectItem value="scroll">可滚动图例 (Scroll)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">图例布局</label>
              <Select value={options.legendLayout} onValueChange={(v: any) => updateOption('legendLayout', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="图例布局" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">水平 (底部)</SelectItem>
                  <SelectItem value="vertical">垂直 (右侧)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <hr className="border-outline-variant/30" />
            <div className="flex items-center justify-between mt-sm">
              <label className="text-label-md font-label-md text-on-surface font-medium">启用提示框悬停效果</label>
              <Switch checked={options.showTooltip} onCheckedChange={(v) => updateOption('showTooltip', v)} />
            </div>
            <div>
              <div className="flex justify-between mb-sm">
                <label className="text-label-md font-label-md text-on-surface font-medium">提示框背景透明度</label>
                <span className="text-body-md text-on-surface-variant font-code-sm">{Math.round(options.tooltipAlpha * 100)}%</span>
              </div>
              <Slider 
                min={0} max={1} step={0.1} value={[options.tooltipAlpha]} 
                onValueChange={(v) => updateOption('tooltipAlpha', v[0])} 
              />
            </div>
          </div>
        );
      case 'axis':
        return (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <label className="text-label-md font-label-md text-on-surface font-medium">显示 X 轴</label>
              <Switch checked={options.showXAxis} onCheckedChange={(v) => updateOption('showXAxis', v)} />
            </div>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">X轴标签倾斜度</label>
              <Select value={options.xLabelRotate.toString()} onValueChange={(v) => updateOption('xLabelRotate', parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="倾斜度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0° (水平)</SelectItem>
                  <SelectItem value="30">30°</SelectItem>
                  <SelectItem value="45">45°</SelectItem>
                  <SelectItem value="90">90° (垂直)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <hr className="border-outline-variant/30" />
            <div className="flex items-center justify-between">
              <label className="text-label-md font-label-md text-on-surface font-medium">显示 Y 轴分割线</label>
              <Switch checked={options.showYSplitLine} onCheckedChange={(v) => updateOption('showYSplitLine', v)} />
            </div>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">Y轴分割线样式</label>
              <Select value={options.ySplitLineType} onValueChange={(v: any) => updateOption('ySplitLineType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="线条样式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashed">虚线 (Dashed)</SelectItem>
                  <SelectItem value="solid">实线 (Solid)</SelectItem>
                  <SelectItem value="dotted">点线 (Dotted)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'series':
        return (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
            <div>
              <div className="flex justify-between mb-sm">
                <label className="text-label-md font-label-md text-on-surface font-medium">{getSeriesSizeLabel(chartType)}</label>
                <span className="text-body-md text-on-surface-variant font-code-sm">{options.barWidth}%</span>
              </div>
              <Slider 
                min={10} max={100} step={5} value={[options.barWidth]} 
                onValueChange={(v) => updateOption('barWidth', v[0])} 
              />
            </div>
            {chartType === 'line' && (
              <>
                <hr className="border-outline-variant/30" />
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">折线节点形状</label>
                  <Select value={options.lineSymbol} onValueChange={(v) => updateOption('lineSymbol', v as ChartSymbolType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="节点形状" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOL_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="text-label-md font-label-md text-on-surface font-medium">折线节点大小</label>
                    <span className="text-body-md text-on-surface-variant font-code-sm">{options.lineSymbolSize}px</span>
                  </div>
                  <Slider
                    min={4} max={24} step={1} value={[options.lineSymbolSize]}
                    onValueChange={(v) => updateOption('lineSymbolSize', v[0])}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">数据标签位置</label>
              <div className="flex items-center justify-between mb-md">
                <span className="text-label-md font-label-md text-on-surface-variant">显示每个图形的数值</span>
                <Switch checked={options.showDataLabels} onCheckedChange={(v) => updateOption('showDataLabels', v)} />
              </div>
              <Select value={options.labelPosition} onValueChange={(v: any) => updateOption('labelPosition', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="位置" />
                </SelectTrigger>
                <SelectContent>
                  {getLabelPositionOptions(chartType).map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(chartType === 'bar' || chartType === 'line') && (
              <>
                <hr className="border-outline-variant/30" />
                <div className="flex items-center justify-between">
                  <label className="text-label-md font-label-md text-on-surface font-medium">显示标记线</label>
                  <Switch checked={options.showMarkLine} onCheckedChange={(v) => updateOption('showMarkLine', v)} />
                </div>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">标记线类型</label>
                  <Select value={options.markLineType} onValueChange={(v: any) => updateOption('markLineType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="标记线类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">实线</SelectItem>
                      <SelectItem value="dashed">虚线</SelectItem>
                      <SelectItem value="dotted">点线</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">标记线颜色</label>
                  <div className="flex items-center gap-sm">
                    <div className="relative w-10 h-10 rounded border border-outline-variant/50 overflow-hidden shadow-sm">
                      <input className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" type="color" value={options.markLineColor} onChange={(e) => updateOption('markLineColor', e.target.value)} />
                    </div>
                    <input className="flex-1 p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary" type="text" value={options.markLineColor} onChange={(e) => updateOption('markLineColor', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-label-md font-label-md text-on-surface font-medium">显示标记点</label>
                  <Switch checked={options.showMarkPoint} onCheckedChange={(v) => updateOption('showMarkPoint', v)} />
                </div>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">标记点形状</label>
                  <Select value={options.markPointSymbol} onValueChange={(v) => updateOption('markPointSymbol', v as ChartSymbolType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="标记点形状" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOL_OPTIONS.filter(option => option.value !== 'none').map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="text-label-md font-label-md text-on-surface font-medium">标记点大小</label>
                    <span className="text-body-md text-on-surface-variant font-code-sm">{options.markPointSymbolSize}px</span>
                  </div>
                  <Slider
                    min={24} max={80} step={2} value={[options.markPointSymbolSize]}
                    onValueChange={(v) => updateOption('markPointSymbolSize', v[0])}
                  />
                </div>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">标记点颜色</label>
                  <div className="flex items-center gap-sm">
                    <div className="relative w-10 h-10 rounded border border-outline-variant/50 overflow-hidden shadow-sm">
                      <input className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" type="color" value={options.markPointColor} onChange={(e) => updateOption('markPointColor', e.target.value)} />
                    </div>
                    <input className="flex-1 p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary" type="text" value={options.markPointColor} onChange={(e) => updateOption('markPointColor', e.target.value)} />
                  </div>
                </div>
              </>
            )}
            {chartType === 'line' && (
              <>
                <hr className="border-outline-variant/30" />
                <div className="flex items-center justify-between">
                  <label className="text-label-md font-label-md text-on-surface font-medium">平滑曲线 (Smooth)</label>
                  <Switch checked={options.smoothLine} onCheckedChange={(v) => updateOption('smoothLine', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-label-md font-label-md text-on-surface font-medium">填充面积 (Area)</label>
                  <Switch checked={options.fillArea} onCheckedChange={(v) => updateOption('fillArea', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-label-md font-label-md text-on-surface font-medium">阶梯线图 (Step)</label>
                  <Switch checked={options.stepLine} onCheckedChange={(v) => updateOption('stepLine', v)} />
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[450px] bg-surface-container-lowest shadow-xl border-l border-outline-variant/30 z-[70] flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className={cn("drilldown-container h-full", activePane !== 'main' && "slide-left")}>
        {/* Main Style List (Pane 1) */}
        <div className="drilldown-pane flex flex-col bg-surface">
          <div className="flex justify-between items-center p-md border-b border-outline-variant/30 bg-surface-container-low w-full">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">图表样式</h3>
            <button 
              className="p-xs text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-full transition-colors flex items-center justify-center" 
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-md flex flex-col gap-sm">
            {/* Theme Selection */}
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm mb-sm">
              <label className="block text-label-md font-label-md text-on-surface font-semibold mb-sm">全局主题配置</label>
              <Select value={chartTheme} onValueChange={onThemeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择主题" />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Navigation List */}
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant/30 overflow-hidden shadow-sm">
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={() => setActivePane('canvas')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">画布配置</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={() => setActivePane('titles')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">标题与文本</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={() => setActivePane('legend')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">图例与提示</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={() => setActivePane('axis')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">坐标系</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => setActivePane('series')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">图形样式</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-md border-t border-outline-variant/30 bg-surface-container-low flex justify-end gap-sm mt-auto">
            <button className="px-md py-sm bg-primary text-on-primary rounded-md hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer" onClick={handleClose}>完成</button>
          </div>
        </div>

        {/* Detail Config (Pane 2) */}
        <div className="drilldown-pane flex flex-col bg-surface">
          <div className="flex items-center p-md border-b border-outline-variant/30 bg-surface-container-low gap-sm">
            <button 
              className="p-xs text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-md transition-colors flex items-center justify-center cursor-pointer" 
              onClick={() => setActivePane('main')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-headline-sm font-headline-sm text-on-surface flex-1">
              {PANE_TITLES[activePane] || '配置详情'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-md custom-scrollbar space-y-md">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
