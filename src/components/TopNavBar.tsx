"use client";

import { ChartColumn, Sparkles, BarChart3 } from 'lucide-react';

interface TopNavBarProps {
  onToggleAiDrawer: () => void;
}

export function TopNavBar({ onToggleAiDrawer }: TopNavBarProps) {
  return (
    <nav className="relative w-full z-50 flex justify-between items-center px-lg h-16 bg-transparent flex-shrink-0">
      <div className="flex items-center gap-sm">
        <ChartColumn className="text-primary h-7 w-7" />
        <span className="text-headline-sm font-headline-sm font-bold text-primary">EasyChart</span>
      </div>
      
      <div className="flex items-center gap-lg">
        <div className="hidden md:flex items-center gap-sm">
          <button 
            className="font-label-md text-label-md bg-surface-container-high hover:bg-surface-variant text-on-surface px-md py-sm rounded-md transition-colors flex items-center gap-xs"
            onClick={onToggleAiDrawer}
          >
            <Sparkles className="w-[18px] h-[18px]" />
            智能助手
          </button>
          <button className="font-label-md text-label-md bg-primary hover:bg-primary-container text-on-primary px-md py-sm rounded-md transition-colors flex items-center gap-xs">
            <BarChart3 className="w-[18px] h-[18px]" />
            我的图表
          </button>
        </div>
        
        <div className="flex items-center gap-sm border-l border-outline-variant pl-lg ml-sm">
          <img 
            alt="User Avatar" 
            className="w-8 h-8 rounded-full border border-outline-variant object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa6XX5Vo6P6v0f7DeVRdfjsbeWqij7_Vsu4bAgy5Fcbc6XvjXOeDIDQVLwkIU2Ezdbe6YXy0NuF9Xih3IUqkvMuK9r8zPTDGDNP-LNzTjSDBOCmvC_qdOqyJFWyDMWoQ5KZXHBC6_T26mmVYKsuHyzNibMX7-Grga8USGfuPh6pfbFwnK8boWNsSS2eJ1_V5FquqssF9xOUQyHtE8gUPgoHek7C-orGQSNlteTykwYIx5crXz4LgEWLxOhJzTIm3teNpm7nQ66CgLD"
          />
        </div>
      </div>
    </nav>
  );
}
