"use client";

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { getInstanceByDom } from 'echarts/core';
import { cn } from '@/lib/utils';
import { createSampleChart, createSampleSeed, createScatterTemplateData } from '@/lib/chart-samples';
import { DEFAULT_FUNCTION_PLOT } from '@/lib/function-plot';
import {
  createProjectSnapshotKey,
  getLocalProject,
  saveLocalProject,
  type ChartProjectSnapshot,
  type SavedChartProject,
} from '@/lib/local-projects';
import { Database, Palette, Save, Download, Code, Edit2, LayoutTemplate } from 'lucide-react';
import { TopNavBar } from './TopNavBar';
import { Sidebar } from './Sidebar';
import { Chart } from './Chart';
import { ChartData, ChartType, ChartOptions, ChartSeriesRole, ChartSubType } from '@/types';

const AiDrawer = dynamic(() => import('./AiDrawer').then((mod) => mod.AiDrawer), { ssr: false });
const DataDrawer = dynamic(() => import('./DataDrawer').then((mod) => mod.DataDrawer), { ssr: false });
const StyleDrawer = dynamic(() => import('./StyleDrawer').then((mod) => mod.StyleDrawer), { ssr: false });
const ChartTemplateModal = dynamic(
  () => import('./ChartTemplateModal').then((mod) => mod.ChartTemplateModal),
  { ssr: false }
);

type DrawerType = 'ai' | 'data' | 'style' | null;
type PendingAction = { type: 'chart'; chartType: ChartType } | { type: 'projects' };

const DEFAULT_SAMPLE = createSampleChart('bar');

const BASE_OPTIONS: ChartOptions = {
  animationDuration: 1600,
  showGrid: true,
  showTitle: true,
  title: DEFAULT_SAMPLE.title,
  subtitle: DEFAULT_SAMPLE.subtitle,
  titleAlign: 'center',
  titleSize: 20,
  titleBold: true,
  showLegend: true,
  legendLayout: 'horizontal',
  legendType: 'plain',
  showTooltip: true,
  tooltipAlpha: 0.95,
  showXAxis: true,
  showAxisLabels: true,
  xLabelRotate: 0,
  showYSplitLine: true,
  ySplitLineType: 'dashed',
  barWidth: 20,
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
  lineSymbol: 'emptyCircle',
  lineSymbolSize: 8,
  useCustomLinePalette: false,
  lineColor: '#2563eb',
  secondaryLineColor: '#ef4444',
  areaColor: '#93c5fd',
  areaOpacity: 0.35,
  areaGradientStart: '#2563eb',
  areaGradientEnd: '#dbeafe',
  showMarkLine: true,
  markLineType: 'dashed',
  markLineColor: '#ef4444',
  showMarkPoint: true,
  markPointSymbol: 'pin',
  markPointSymbolSize: 48,
  markPointColor: '#ef4444',
  subType: 'basic'
};

function createDefaultOptions(type: ChartType, sample = createSampleChart(type)): ChartOptions {
  return {
    ...BASE_OPTIONS,
    title: sample.title,
    subtitle: sample.subtitle,
    subType: 'basic',
    showGrid: type !== 'pie',
    showXAxis: type !== 'pie',
    showAxisLabels: type !== 'pie',
    labelPosition: type === 'pie' ? 'outside' : 'top',
    barWidth: type === 'bar' ? 20 : BASE_OPTIONS.barWidth,
    lineWidth: 2,
    scatterSize: 14,
    smoothLine: false,
    fillArea: false,
    stepLine: false,
    lineSymbol: 'emptyCircle',
    lineSymbolSize: 8,
    useCustomLinePalette: false,
    showDataLabels: false,
  };
}

const DEFAULT_OPTIONS = createDefaultOptions('bar', DEFAULT_SAMPLE);

function getTemplateSeriesRole(subType: ChartSubType, seriesIndex: number, seriesCount: number): ChartSeriesRole {
  if (subType === 'stacked' || subType === 'rounded-stacked' || subType === 'stacked-horizontal') {
    return 'stack';
  }

  if (subType === 'negative-bar') {
    if (seriesCount === 1) return 'normal';
    if (seriesCount === 2) return seriesIndex === 1 ? 'negative' : 'positive';
    if (seriesIndex === 1) return 'positive';
    if (seriesIndex === 2) return 'negative';
  }

  return 'normal';
}

function applyBarTemplateRoles(data: ChartData, subType: ChartSubType): ChartData {
  return {
    ...data,
    series: data.series.map((series, seriesIndex) => ({
      ...series,
      role: getTemplateSeriesRole(subType, seriesIndex, data.series.length),
    })),
  };
}

function withSecondaryCategories(data: ChartData): ChartData {
  if (data.secondaryCategories?.length === data.categories.length) return data;

  return {
    ...data,
    secondaryCategories: data.categories.map((category, index) => `${category}-对比${index + 1}`),
  };
}

function withFunctionPlot(data: ChartData): ChartData {
  return {
    ...data,
    functionPlot: data.functionPlot || DEFAULT_FUNCTION_PLOT,
  };
}

function snapshotFromProject(project: SavedChartProject): ChartProjectSnapshot {
  return {
    chartType: project.chartType,
    chartTheme: project.chartTheme,
    chartTitle: project.chartTitle,
    chartData: project.chartData,
    chartOptions: project.chartOptions,
  };
}

function SaveProjectDialog({
  isOpen,
  name,
  error,
  onNameChange,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  name: string;
  error: string | null;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-surface-container-highest/60 backdrop-blur-sm p-md">
      <div className="w-full max-w-[520px] min-h-[340px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
        <div className="px-lg py-md border-b border-outline-variant/30 bg-surface">
          <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold">保存项目</h3>
          <p className="mt-xs text-body-md text-on-surface-variant">保存后可在“我的项目”中重新打开。</p>
        </div>
        <div className="p-lg flex-1 flex flex-col justify-center gap-md bg-surface-container-lowest">
          <label className="flex flex-col gap-xs">
            <span className="text-label-md font-label-md text-on-surface font-medium">项目名称</span>
            <input
              autoFocus
              className="w-full h-11 px-sm border border-outline-variant/50 rounded-md bg-surface text-body-md font-body-md outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onConfirm();
              }}
            />
          </label>
          {error && (
            <div className="rounded-md border border-error/30 bg-error-container px-sm py-xs text-body-md text-on-error-container">
              {error}
            </div>
          )}
        </div>
        <div className="p-md border-t border-outline-variant/30 bg-surface-container-low grid grid-cols-2 gap-sm">
          <button
            className="w-full px-md py-sm rounded-md bg-error text-on-error hover:bg-on-error-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="w-full px-md py-sm rounded-md bg-primary text-white hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
            onClick={onConfirm}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}: {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-surface-container-highest/60 backdrop-blur-sm p-md">
      <div className="w-full max-w-[520px] min-h-[340px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col">
        <div className="px-lg py-md border-b border-outline-variant/30 bg-surface">
          <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold">当前项目尚未保存</h3>
          <p className="mt-xs text-body-md text-on-surface-variant">你正在离开当前图表配置。</p>
        </div>
        <div className="p-lg flex-1 bg-surface-container-lowest flex items-center">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            当前数据、模板或样式存在未保存的修改。你可以先保存项目，或放弃这些修改后继续。
          </p>
        </div>
        <div className="p-md border-t border-outline-variant/30 bg-surface-container-low grid grid-cols-1 sm:grid-cols-3 gap-sm">
          <button
            className="w-full px-md py-sm rounded-md bg-error text-on-error hover:bg-on-error-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="w-full px-md py-sm rounded-md border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-variant font-label-md text-label-md transition-colors cursor-pointer"
            onClick={onDiscard}
          >
            不保存
          </button>
          <button
            className="w-full px-md py-sm rounded-md bg-primary text-white hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
            onClick={onSave}
          >
            保存后继续
          </button>
        </div>
      </div>
    </div>
  );
}

export function EasyChartApp() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [chartTheme, setChartTheme] = useState('default');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<ChartData>(DEFAULT_SAMPLE.data);
  const [chartOptions, setChartOptions] = useState<ChartOptions>(DEFAULT_OPTIONS);
  const [chartTitle, setChartTitle] = useState('未命名图表_01');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('未命名图表_01');
  const [lastSavedSnapshotKey, setLastSavedSnapshotKey] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('未命名图表_01');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);

  const currentSnapshot = useMemo<ChartProjectSnapshot>(() => ({
    chartType,
    chartTheme,
    chartTitle,
    chartData,
    chartOptions,
  }), [chartData, chartOptions, chartTheme, chartTitle, chartType]);
  const currentSnapshotKey = useMemo(() => createProjectSnapshotKey(currentSnapshot), [currentSnapshot]);
  const hasUnsavedChanges = Boolean(lastSavedSnapshotKey) && currentSnapshotKey !== lastSavedSnapshotKey;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleDrawer = (drawer: DrawerType) => {
    setActiveDrawer(current => current === drawer ? null : drawer);
  };

  const markCleanSnapshot = (snapshot: ChartProjectSnapshot) => {
    setLastSavedSnapshotKey(createProjectSnapshotKey(snapshot));
  };

  const switchToNewChart = (type: ChartType) => {
    const sample = createSampleChart(type, createSampleSeed());
    const options = createDefaultOptions(type, sample);
    const title = '未命名图表_01';
    const snapshot: ChartProjectSnapshot = {
      chartType: type,
      chartTheme: 'default',
      chartTitle: title,
      chartData: sample.data,
      chartOptions: options,
    };

    setChartType(type);
    setChartData(sample.data);
    setChartTheme('default');
    setChartOptions(options);
    setChartTitle(title);
    setProjectName(title);
    setCurrentProjectId(null);
    markCleanSnapshot(snapshot);
  };

  const runPendingAction = (action: PendingAction | null) => {
    if (!action) return;
    if (action.type === 'chart') {
      switchToNewChart(action.chartType);
      return;
    }

    window.location.href = '/projects';
  };

  const requestActionWithUnsavedCheck = (action: PendingAction) => {
    if (hasUnsavedChanges) {
      setPendingAction(action);
      setIsUnsavedDialogOpen(true);
      return;
    }

    runPendingAction(action);
  };

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('projectId');

    if (projectId) {
      const project = getLocalProject(projectId);
      if (project) {
        const snapshot = snapshotFromProject(project);
        setChartType(project.chartType);
        setChartTheme(project.chartTheme);
        setChartTitle(project.chartTitle || project.name);
        setChartData(project.chartData);
        setChartOptions(project.chartOptions);
        setCurrentProjectId(project.id);
        setProjectName(project.name);
        setSaveName(project.name);
        markCleanSnapshot(snapshot);
        showToast('已打开项目');
        return;
      }

      showToast('没有找到这个项目');
    }

    const sample = createSampleChart('bar', createSampleSeed());
    const options = createDefaultOptions('bar', sample);
    const title = '未命名图表_01';
    const snapshot: ChartProjectSnapshot = {
      chartType: 'bar',
      chartTheme: 'default',
      chartTitle: title,
      chartData: sample.data,
      chartOptions: options,
    };

    setChartData(sample.data);
    setChartOptions(options);
    setProjectName(title);
    setSaveName(title);
    markCleanSnapshot(snapshot);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const openSaveDialog = () => {
    setSaveError(null);
    setSaveName(projectName || chartTitle || '未命名项目');
    setIsSaveDialogOpen(true);
  };

  const saveCurrentProject = () => {
    const normalizedName = saveName.trim() || chartTitle.trim() || '未命名项目';
    const normalizedTitle = chartTitle.trim() || normalizedName;
    const snapshot: ChartProjectSnapshot = {
      ...currentSnapshot,
      chartTitle: normalizedTitle,
    };

    try {
      const savedProject = saveLocalProject(snapshot, normalizedName, currentProjectId);
      setCurrentProjectId(savedProject.id);
      setProjectName(savedProject.name);
      setChartTitle(savedProject.chartTitle);
      setSaveName(savedProject.name);
      markCleanSnapshot(snapshotFromProject(savedProject));
      setIsSaveDialogOpen(false);
      setSaveError(null);
      showToast('项目已保存');
      runPendingAction(pendingAction);
      setPendingAction(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存失败，存储空间可能不足。');
    }
  };

  const handleChartSelect = (type: ChartType) => {
    if (type === chartType) return;
    requestActionWithUnsavedCheck({ type: 'chart', chartType: type });
  };

  const handleOpenProjects = () => {
    requestActionWithUnsavedCheck({ type: 'projects' });
  };

  const handleDownloadImage = () => {
    showToast('正在生成图片，请稍候...');
    setTimeout(() => {
      const dom = document.getElementById('main-chart');
      if (!dom) return;
      const instance = getInstanceByDom(dom);
      if (!instance) return;
      const url = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: chartTheme === 'dark' ? '#333333' : '#ffffff'
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chartTitle}.png`;
      a.click();
      showToast('图片下载成功！');
    }, 500);
  };

  const handleExportCode = () => {
    showToast('正在生成配置代码...');
    setTimeout(() => {
      const ExportPayload = {
        title: chartTitle,
        type: chartType,
        theme: chartTheme,
        data: chartData,
        options: chartOptions
      };
      const code = JSON.stringify(ExportPayload, null, 2);
      const blob = new Blob([code], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chartTitle}_config.json`;
      a.click();
      showToast('代码导出成功！');
    }, 500);
  };

  const activeChartName = {
    'bar': '柱状图',
    'line': '折线图',
    'pie': '饼图',
    'scatter': '散点图'
  }[chartType];

  return (
    <div className="flex flex-col h-screen w-full bg-surface-container-low text-on-surface">
      <TopNavBar onToggleAiDrawer={() => toggleDrawer('ai')} onOpenProjects={handleOpenProjects} />
      
      <div className="flex flex-1 overflow-hidden relative p-sm pt-0 gap-sm">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeChart={chartType}
          onChartSelect={handleChartSelect}
        />
        
        {/* Main Canvas Area */}
        <main className="flex-1 bg-surface rounded-2xl shadow-sm p-lg overflow-y-auto relative h-full flex flex-col">
          {/* Compact Header & Toolbar */}
          <div className="flex flex-wrap items-center justify-between mb-md bg-surface-container-lowest rounded-xl p-sm border border-outline-variant/30 gap-sm">
            {/* Left: Title & Name */}
            <div className="flex items-center gap-md pl-sm">
              <h1 className="text-title-md font-title-md text-on-surface font-semibold flex items-center gap-xs">
                <img src="/easychart.svg" alt="" className="h-5 w-5" /> 工作台 - {activeChartName}
              </h1>
              <div className="w-px h-4 bg-outline-variant/50"></div>
              <div className="group flex items-center">
                {isEditingTitle ? (
                  <input 
                    autoFocus
                    className="text-on-surface text-body-md font-body-md bg-surface-variant/50 px-sm py-1 rounded outline-none w-48 focus:ring-1 focus:ring-primary"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  />
                ) : (
                  <div 
                    className="text-on-surface-variant text-body-md font-body-md cursor-pointer hover:text-on-surface flex items-center px-sm py-1 -ml-sm rounded hover:bg-surface-variant/30 transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {chartTitle}
                    <Edit2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
              <span className={cn(
                "text-[11px] font-label-md px-xs py-1 rounded border",
                hasUnsavedChanges
                  ? "text-on-error-container bg-error-container border-error/30"
                  : "text-on-surface-variant bg-surface-container-low border-outline-variant/30"
              )}>
                {hasUnsavedChanges ? '未保存' : currentProjectId ? '已保存' : '草稿'}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-sm">
              <div className="flex items-center gap-xs">
                <button 
                  className="flex items-center gap-xs px-md py-sm hover:bg-surface-variant text-on-surface rounded-md transition-colors font-label-md text-label-md cursor-pointer"
                  onClick={openSaveDialog}
                >
                  <Save className="w-[16px] h-[16px]" />
                  保存项目
                </button>
                <div className="w-px h-4 bg-outline-variant/50 mx-xs"></div>
                <button onClick={handleDownloadImage} className="flex items-center gap-xs px-md py-sm hover:bg-surface-variant text-on-surface rounded-md transition-colors font-label-md text-label-md cursor-pointer">
                  <Download className="w-[16px] h-[16px]" />
                  下载图片
                </button>
                <button onClick={handleExportCode} className="flex items-center gap-xs px-md py-sm hover:bg-surface-variant text-on-surface rounded-md transition-colors font-label-md text-label-md cursor-pointer">
                  <Code className="w-[16px] h-[16px]" />
                  导出代码
                </button>
              </div>
              
              <div className="w-px h-6 bg-outline-variant/50 mx-xs"></div>

              <div className="flex items-center gap-sm">
                <button 
                  className={cn(
                    "flex items-center gap-xs px-md py-sm hover:bg-surface-variant text-on-surface hover:text-primary rounded-md border border-outline-variant/30 transition-colors font-label-md text-label-md shadow-sm cursor-pointer"
                  )}
                  onClick={() => setIsTemplateModalOpen(true)}
                  title="选择预设图表模板"
                >
                  <LayoutTemplate className="w-[16px] h-[16px]" />
                  预览或切换模板
                </button>
                <div className="w-px h-4 bg-outline-variant/50 mx-xs"></div>
                <button 
                  className={cn(
                    "flex items-center gap-xs px-md py-sm hover:bg-surface-variant text-on-surface rounded-md border transition-colors font-label-md text-label-md shadow-sm cursor-pointer",
                    activeDrawer === 'data' ? "bg-surface-variant border-outline-variant" : "bg-surface border-outline-variant/30"
                  )}
                  onClick={() => toggleDrawer('data')}
                >
                  <Database className="w-[16px] h-[16px]" />
                  配置数据
                </button>
                <button 
                  className={cn(
                    "flex items-center gap-xs px-md py-sm hover:bg-surface-variant text-on-surface rounded-md border transition-colors font-label-md text-label-md shadow-sm cursor-pointer",
                    activeDrawer === 'style' ? "bg-surface-variant border-outline-variant" : "bg-surface border-outline-variant/30"
                  )}
                  onClick={() => toggleDrawer('style')}
                >
                  <Palette className="w-[16px] h-[16px]" />
                  图表样式
                </button>
              </div>
            </div>
          </div>
          
          <div 
            className={cn(
              "rounded-xl border border-outline-variant/30 w-full flex-1 relative flex flex-col overflow-hidden transition-colors min-h-[500px]",
              chartTheme === 'dark' ? "bg-[#333333]" : "bg-surface-container-lowest"
            )}
           >
            <Chart 
              id="main-chart"
              className={cn("w-full flex-1", chartTheme === 'dark' ? "p-lg" : "p-lg")} 
              isSidebarCollapsed={isSidebarCollapsed}
              theme={chartTheme}
              data={chartData}
              options={chartOptions}
              chartType={chartType}
            />
          </div>
        </main>

        {/* Drawer Backdrop */}
        {activeDrawer && (
          <div 
            className="fixed inset-0 z-[60] bg-on-background/20 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveDrawer(null)}
          />
        )}
      </div>

      <AiDrawer 
        isOpen={activeDrawer === 'ai'} 
        onClose={() => setActiveDrawer(null)} 
      />
      <DataDrawer 
        isOpen={activeDrawer === 'data'} 
        onClose={() => setActiveDrawer(null)} 
        data={chartData}
        onChange={setChartData}
        chartType={chartType}
        subType={chartOptions.subType}
        defaultBarWidth={chartOptions.barWidth}
        defaultLineWidth={chartOptions.lineWidth}
        title={chartOptions.title}
        subtitle={chartOptions.subtitle}
        onTitleChange={(title) => setChartOptions(prev => ({ ...prev, title }))}
        onSubtitleChange={(subtitle) => setChartOptions(prev => ({ ...prev, subtitle }))}
      />
      <StyleDrawer 
        isOpen={activeDrawer === 'style'} 
        onClose={() => setActiveDrawer(null)}
        chartTheme={chartTheme}
        onThemeChange={setChartTheme}
        options={chartOptions}
        onOptionsChange={setChartOptions}
        chartType={chartType}
      />
      
      <ChartTemplateModal 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        chartType={chartType}
        currentSubType={chartOptions.subType}
        onSelect={(subType, templateOptions) => {
          setChartOptions(prev => ({ ...prev, ...templateOptions, subType }));
          if (chartType === 'bar') {
            setChartData(prev => applyBarTemplateRoles(prev, subType));
          }
          if (chartType === 'line' && subType === 'multi-x') {
            setChartData(prev => withSecondaryCategories(prev));
          }
          if (chartType === 'line' && subType === 'function-plot') {
            setChartData(prev => withFunctionPlot(prev));
          }
          if (chartType === 'scatter') {
            setChartData(createScatterTemplateData(subType));
          }
          setIsTemplateModalOpen(false);
          showToast('已切换图表模板！');
        }}
      />

      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onCancel={() => {
          setIsUnsavedDialogOpen(false);
          setPendingAction(null);
        }}
        onDiscard={() => {
          const action = pendingAction;
          setIsUnsavedDialogOpen(false);
          setPendingAction(null);
          runPendingAction(action);
        }}
        onSave={() => {
          setIsUnsavedDialogOpen(false);
          openSaveDialog();
        }}
      />

      <SaveProjectDialog
        isOpen={isSaveDialogOpen}
        name={saveName}
        error={saveError}
        onNameChange={setSaveName}
        onCancel={() => {
          setIsSaveDialogOpen(false);
          setSaveError(null);
          if (pendingAction) {
            setPendingAction(null);
          }
        }}
        onConfirm={saveCurrentProject}
      />
      
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[140] w-[min(360px,calc(100vw-32px))] rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-md py-sm shadow-2xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-sm">
            <div className="mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_rgba(0,74,198,0.12)]" />
            <div className="min-w-0">
              <div className="text-label-md font-label-md font-semibold text-on-surface">提示</div>
              <div className="mt-xs text-body-md font-body-md text-on-surface-variant">{toastMessage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
