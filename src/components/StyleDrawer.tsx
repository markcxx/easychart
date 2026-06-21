"use client";

import { type ReactNode, useState } from 'react';
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

type PaneType = 'main' | 'canvas' | 'titles' | 'legend' | 'axis' | 'series' | 'labels' | 'markers';

const PANE_TITLES: Record<string, string> = {
  'canvas': '画布配置',
  'titles': '标题与文本',
  'legend': '图例与提示',
  'axis': '坐标系',
  'series': '图形样式',
  'labels': '数据标签',
  'markers': '标记配置'
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

function getLabelPositionOptions(chartType: ChartType) {
  if (chartType === 'line' || chartType === 'scatter') return POINT_LABEL_POSITION_OPTIONS;
  if (chartType === 'pie') return PIE_LABEL_POSITION_OPTIONS;
  return BAR_LABEL_POSITION_OPTIONS;
}

function ConfigSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-md border border-outline-variant/30 p-md shadow-sm flex flex-col gap-md">
      <h4 className="text-label-md font-label-md text-on-surface font-semibold">{title}</h4>
      {children}
    </section>
  );
}

function ColorField({ label, value, onChange, fallback = '#2563eb' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
}) {
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;

  return (
    <div>
      <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">{label}</label>
      <div className="flex items-center gap-sm">
        <div className="relative w-10 h-10 rounded border border-outline-variant/50 overflow-hidden shadow-sm">
          <input className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" type="color" value={pickerValue} onChange={(e) => onChange(e.target.value)} />
        </div>
        <input className="flex-1 p-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-code-sm uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary" type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
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

  const updateLinePaletteOption = <K extends 'lineColor' | 'secondaryLineColor' | 'areaColor' | 'areaGradientStart' | 'areaGradientEnd'>(key: K, value: ChartOptions[K]) => {
    onOptionsChange({ ...options, useCustomLinePalette: true, [key]: value });
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
                <Select value={options.titleAlign} onValueChange={(value) => updateOption('titleAlign', value as ChartOptions['titleAlign'])}>
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
              <Select value={options.legendType} onValueChange={(value) => updateOption('legendType', value as ChartOptions['legendType'])}>
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
              <Select value={options.legendLayout} onValueChange={(value) => updateOption('legendLayout', value as ChartOptions['legendLayout'])}>
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
          <div className="flex flex-col gap-md">
            {chartType === 'pie' || chartType === 'map' || chartType === 'radar' ? (
              <ConfigSection title="坐标系">
                <span className="text-body-md text-on-surface-variant">
                  {chartType === 'pie' ? '饼图不使用坐标轴。' : `${chartType === 'map' ? '地图' : '雷达图'}不使用直角坐标轴。`}
                </span>
              </ConfigSection>
            ) : (
              <>
                <ConfigSection title="坐标轴">
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">显示坐标轴</label>
                    <Switch checked={options.showXAxis} onCheckedChange={(v) => updateOption('showXAxis', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">显示轴标签</label>
                    <Switch checked={options.showAxisLabels ?? options.showXAxis} onCheckedChange={(v) => updateOption('showAxisLabels', v)} />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">X 轴标签倾斜度</label>
                    <Select value={options.xLabelRotate.toString()} onValueChange={(v) => updateOption('xLabelRotate', parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="倾斜度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0°</SelectItem>
                        <SelectItem value="30">30°</SelectItem>
                        <SelectItem value="45">45°</SelectItem>
                        <SelectItem value="90">90°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ConfigSection>
                <ConfigSection title="网格线">
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">显示网格</label>
                    <Switch checked={options.showGrid} onCheckedChange={(v) => updateOption('showGrid', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">显示分割线</label>
                    <Switch checked={options.showYSplitLine} onCheckedChange={(v) => updateOption('showYSplitLine', v)} />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">分割线样式</label>
                    <Select value={options.ySplitLineType} onValueChange={(value) => updateOption('ySplitLineType', value as ChartOptions['ySplitLineType'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="线条样式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashed">虚线</SelectItem>
                        <SelectItem value="solid">实线</SelectItem>
                        <SelectItem value="dotted">点线</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ConfigSection>
              </>
            )}
          </div>
        );
      case 'series':
        return (
          <div className="flex flex-col gap-md">
            {chartType === 'bar' && (
              <ConfigSection title="柱形外观">
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="text-label-md font-label-md text-on-surface font-medium">柱形宽度</label>
                    <span className="text-body-md text-on-surface-variant font-code-sm">{options.barWidth}%</span>
                  </div>
                  <Slider
                    min={10} max={100} step={5} value={[options.barWidth]}
                    onValueChange={(v) => updateOption('barWidth', v[0])}
                  />
                </div>
              </ConfigSection>
            )}
            {chartType === 'line' && (
              <>
                <ConfigSection title="线条外观">
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">使用全局线条配色</label>
                    <Switch checked={options.useCustomLinePalette} onCheckedChange={(v) => updateOption('useCustomLinePalette', v)} />
                  </div>
                  <ColorField label="主线颜色" value={options.lineColor} onChange={(value) => updateLinePaletteOption('lineColor', value)} />
                  <ColorField label="辅助线颜色" value={options.secondaryLineColor} fallback="#ef4444" onChange={(value) => updateLinePaletteOption('secondaryLineColor', value)} />
                  <div>
                    <div className="flex justify-between mb-sm">
                      <label className="text-label-md font-label-md text-on-surface font-medium">线条粗细</label>
                      <span className="text-body-md text-on-surface-variant font-code-sm">{options.lineWidth}px</span>
                    </div>
                    <Slider
                      min={1} max={10} step={1} value={[options.lineWidth]}
                      onValueChange={(v) => updateOption('lineWidth', v[0])}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">平滑曲线</label>
                    <Switch checked={options.smoothLine} onCheckedChange={(v) => updateOption('smoothLine', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">阶梯线</label>
                    <Switch checked={options.stepLine} onCheckedChange={(v) => updateOption('stepLine', v)} />
                  </div>
                </ConfigSection>
                <ConfigSection title="面积填充">
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">填充面积</label>
                    <Switch checked={options.fillArea} onCheckedChange={(v) => updateOption('fillArea', v)} />
                  </div>
                  <ColorField label="填充颜色" value={options.areaColor} fallback="#93c5fd" onChange={(value) => updateLinePaletteOption('areaColor', value)} />
                  <div>
                    <div className="flex justify-between mb-sm">
                      <label className="text-label-md font-label-md text-on-surface font-medium">填充透明度</label>
                      <span className="text-body-md text-on-surface-variant font-code-sm">{Math.round(options.areaOpacity * 100)}%</span>
                    </div>
                    <Slider
                      min={0.05} max={1} step={0.05} value={[options.areaOpacity]}
                      onValueChange={(v) => updateOption('areaOpacity', v[0])}
                    />
                  </div>
                  <ColorField label="渐变起始色" value={options.areaGradientStart} onChange={(value) => updateLinePaletteOption('areaGradientStart', value)} />
                  <ColorField label="渐变结束色" value={options.areaGradientEnd} fallback="#dbeafe" onChange={(value) => updateLinePaletteOption('areaGradientEnd', value)} />
                </ConfigSection>
                <ConfigSection title="节点样式">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">节点形状</label>
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
                      <label className="text-label-md font-label-md text-on-surface font-medium">节点大小</label>
                      <span className="text-body-md text-on-surface-variant font-code-sm">{options.lineSymbolSize}px</span>
                    </div>
                    <Slider
                      min={4} max={24} step={1} value={[options.lineSymbolSize]}
                      onValueChange={(v) => updateOption('lineSymbolSize', v[0])}
                    />
                  </div>
                </ConfigSection>
              </>
            )}
            {chartType === 'scatter' && (
              <ConfigSection title="散点外观">
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="text-label-md font-label-md text-on-surface font-medium">散点大小</label>
                    <span className="text-body-md text-on-surface-variant font-code-sm">{options.scatterSize}px</span>
                  </div>
                  <Slider
                    min={4} max={48} step={1} value={[options.scatterSize]}
                    onValueChange={(v) => updateOption('scatterSize', v[0])}
                  />
                </div>
              </ConfigSection>
            )}
            {chartType === 'pie' && (
              <ConfigSection title="扇区外观">
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="text-label-md font-label-md text-on-surface font-medium">外径</label>
                    <span className="text-body-md text-on-surface-variant font-code-sm">{options.pieOuterRadius}%</span>
                  </div>
                  <Slider
                    min={20} max={100} step={1} value={[options.pieOuterRadius]}
                    onValueChange={(v) => updateOption('pieOuterRadius', Math.max(v[0], options.pieInnerRadius + 5))}
                  />
                </div>
                {options.subType !== 'basic' && (
                  <div>
                    <div className="flex justify-between mb-sm">
                      <label className="text-label-md font-label-md text-on-surface font-medium">内径</label>
                      <span className="text-body-md text-on-surface-variant font-code-sm">{options.pieInnerRadius}%</span>
                    </div>
                    <Slider
                      min={0} max={90} step={1} value={[options.pieInnerRadius]}
                      onValueChange={(v) => updateOption('pieInnerRadius', Math.min(v[0], options.pieOuterRadius - 5))}
                    />
                  </div>
                )}
                {options.subType === 'gap-donut' && (
                  <div>
                    <div className="flex justify-between mb-sm">
                      <label className="text-label-md font-label-md text-on-surface font-medium">扇区间隙</label>
                      <span className="text-body-md text-on-surface-variant font-code-sm">{options.piePadAngle}°</span>
                    </div>
                    <Slider
                      min={0} max={20} step={1} value={[options.piePadAngle]}
                      onValueChange={(v) => updateOption('piePadAngle', v[0])}
                    />
                  </div>
                )}
              </ConfigSection>
            )}
          </div>
        );
      case 'labels':
        return (
          <div className="flex flex-col gap-md">
            <ConfigSection title="数值标签">
              <div className="flex items-center justify-between">
                <label className="text-label-md font-label-md text-on-surface font-medium">显示数值标签</label>
                <Switch checked={options.showDataLabels} onCheckedChange={(v) => updateOption('showDataLabels', v)} />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">标签位置</label>
                <Select value={options.labelPosition} onValueChange={(value) => updateOption('labelPosition', value as ChartOptions['labelPosition'])}>
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
            </ConfigSection>
          </div>
        );
      case 'markers':
        return (
          <div className="flex flex-col gap-md">
            {(chartType === 'bar' || chartType === 'line') && (
              <>
                <ConfigSection title="标记线">
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">显示标记线</label>
                    <Switch checked={options.showMarkLine} onCheckedChange={(v) => updateOption('showMarkLine', v)} />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">线型</label>
                    <Select value={options.markLineType} onValueChange={(value) => updateOption('markLineType', value as ChartOptions['markLineType'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="线型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">实线</SelectItem>
                        <SelectItem value="dashed">虚线</SelectItem>
                        <SelectItem value="dotted">点线</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <ColorField label="颜色" value={options.markLineColor} fallback="#ef4444" onChange={(value) => updateOption('markLineColor', value)} />
                </ConfigSection>
                <ConfigSection title="标记点">
                  <div className="flex items-center justify-between">
                    <label className="text-label-md font-label-md text-on-surface font-medium">显示标记点</label>
                    <Switch checked={options.showMarkPoint} onCheckedChange={(v) => updateOption('showMarkPoint', v)} />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-sm font-medium">形状</label>
                    <Select value={options.markPointSymbol} onValueChange={(v) => updateOption('markPointSymbol', v as ChartSymbolType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="形状" />
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
                      <label className="text-label-md font-label-md text-on-surface font-medium">大小</label>
                      <span className="text-body-md text-on-surface-variant font-code-sm">{options.markPointSymbolSize}px</span>
                    </div>
                    <Slider
                      min={24} max={80} step={2} value={[options.markPointSymbolSize]}
                      onValueChange={(v) => updateOption('markPointSymbolSize', v[0])}
                    />
                  </div>
                  <ColorField label="颜色" value={options.markPointColor} fallback="#ef4444" onChange={(value) => updateOption('markPointColor', value)} />
                </ConfigSection>
              </>
            )}
            {chartType !== 'bar' && chartType !== 'line' && (
              <ConfigSection title="标记配置">
                <span className="text-body-md text-on-surface-variant">当前图表不使用标记线或标记点。</span>
              </ConfigSection>
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
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={() => setActivePane('series')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">图形样式</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={() => setActivePane('labels')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">数据标签</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="w-full flex justify-between items-center p-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => setActivePane('markers')}>
                <span className="font-label-md text-label-md font-semibold text-on-surface">标记配置</span>
                <ChevronRight className="text-on-surface-variant w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-md border-t border-outline-variant/30 bg-surface-container-low flex justify-end gap-sm mt-auto">
            <button className="px-md py-sm bg-primary !text-white rounded-md hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer" onClick={handleClose}>完成</button>
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
