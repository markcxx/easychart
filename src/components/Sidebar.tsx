"use client";

import { cn } from '@/lib/utils';
import { ChartType } from '@/types';
import { 
  BarChart3, LineChart, PieChart, ScatterChart, Radar, Filter, 
  Map, Grid, Share2, Waves, CandlestickChart, Gauge,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeChart: ChartType;
  onChartSelect: (type: ChartType) => void;
}

export function Sidebar({ isCollapsed, onToggle, activeChart, onChartSelect }: SidebarProps) {
  const navItems1: { icon: any; label: string; type: ChartType }[] = [
    { icon: BarChart3, label: '柱状图', type: 'bar' },
    { icon: LineChart, label: '折线图', type: 'line' },
    { icon: PieChart, label: '饼图', type: 'pie' },
    { icon: ScatterChart, label: '散点图', type: 'scatter' },
  ];

  const navItems2 = [
    { icon: Radar, label: '雷达图' },
    { icon: Filter, label: '漏斗图' },
    { icon: Map, label: '地图' },
    { icon: Grid, label: '热力图' },
    { icon: Share2, label: '关系图' },
    { icon: Waves, label: '桑基图' },
    { icon: CandlestickChart, label: '箱线图' },
    { icon: Gauge, label: '仪表盘' },
  ];

  return (
    <aside 
      className={cn(
        "flex flex-col bg-surface z-40 rounded-2xl shadow-sm transition-all duration-300 ease-in-out relative flex-shrink-0",
        isCollapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Toggle Button - Vertically centered, right edge, rounded right only */}
      <button 
        className="absolute -right-[24px] top-1/2 -translate-y-1/2 w-[24px] h-[48px] bg-surface border-y border-r border-outline-variant/30 rounded-l-none rounded-r-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors group shadow-sm z-50 cursor-pointer"
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <div className={cn("p-md border-b border-outline-variant/50 flex items-center justify-between flex-shrink-0 h-[72px]", isCollapsed ? "justify-center" : "")}>
        {!isCollapsed && (
          <div className="sidebar-header-text truncate">
            <h2 className="text-headline-sm font-headline-sm text-on-surface">图表类型</h2>
            <p className="text-body-md font-body-md text-on-surface-variant mt-xs">选择可视化方案</p>
          </div>
        )}
        {isCollapsed && (
           <h2 className="text-headline-sm font-headline-sm text-on-surface w-full text-center">图</h2>
        )}
      </div>

      <nav className="flex flex-col gap-xs flex-1 overflow-y-auto p-md no-scrollbar overflow-x-hidden">
        {navItems1.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => onChartSelect(item.type)}
            className={cn(
              "nav-btn group relative flex items-center px-md py-sm rounded-md font-label-md text-label-md transition-all flex-shrink-0 cursor-pointer",
              activeChart === item.type 
                ? "bg-primary-container text-on-primary-container shadow-sm" 
                : "text-on-surface-variant hover:bg-surface-variant",
              isCollapsed ? "justify-center px-0" : "gap-md"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={cn("w-5 h-5 flex-shrink-0", activeChart === item.type && "fill-current/20")} />
            {!isCollapsed && <span className="menu-text whitespace-nowrap">{item.label}</span>}
          </button>
        ))}

        <div className="h-px bg-outline-variant/30 my-xs flex-shrink-0"></div>

        {navItems2.map((item, idx) => (
          <button 
            key={idx}
            className={cn(
              "nav-btn group relative flex items-center px-md py-sm rounded-md font-label-md text-label-md transition-all text-on-surface-variant hover:bg-surface-variant flex-shrink-0 cursor-pointer opacity-50",
              isCollapsed ? "justify-center px-0" : "gap-md"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="menu-text whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
