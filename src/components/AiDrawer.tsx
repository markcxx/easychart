"use client";

import { cn } from '@/lib/utils';
import { X, Sparkles, History, Bot, User, Paperclip, Send, Loader2 } from 'lucide-react';

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiDrawer({ isOpen, onClose }: AiDrawerProps) {
  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[450px] bg-surface-container-lowest shadow-xl border-l border-outline-variant/30 z-[70] flex flex-col transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex justify-between items-center p-md border-b border-outline-variant/30 bg-surface-container-low">
        <div className="flex items-center gap-sm">
          <Sparkles className="text-primary w-5 h-5" />
          <h3 className="text-headline-sm font-headline-sm text-on-surface">AI 数据助手</h3>
        </div>
        <div className="flex items-center gap-sm">
          <button className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-md transition-colors" title="历史记录">
            <History className="w-5 h-5" />
          </button>
          <button 
            className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-md transition-colors" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-lg bg-surface">
        <div className="flex gap-sm items-start">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            <Bot className="text-on-primary-container w-4 h-4" />
          </div>
          <div className="bg-surface-container-lowest rounded-xl rounded-tl-none p-md border border-outline-variant/30 shadow-sm max-w-[85%]">
            <p className="font-body-md text-body-md text-on-surface">
              您好！我是 EasyChart AI 助手。请告诉我您想分析什么样的数据？例如：<br/><br/>
              <span className="text-primary bg-surface-container-high px-1 rounded">"帮我生成一个展示近半年各地区销售额趋势的折线图，包含北京、上海、广州三个城市。"</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-sm items-start flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center flex-shrink-0">
            <User className="text-on-surface-variant w-4 h-4" />
          </div>
          <div className="bg-primary text-on-primary rounded-xl rounded-tr-none p-md max-w-[85%] shadow-sm">
            <p className="font-body-md text-body-md">我想分析一下2023年度各产品线的季度营收对比情况，数据大概是：企业服务版块Q1-Q4分别是120, 150, 180, 210；个人订阅版块分别是80, 95, 110, 130。用比较现代的风格展示。</p>
          </div>
        </div>
        
        <div className="flex gap-sm items-start">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            <Bot className="text-on-primary-container w-4 h-4" />
          </div>
          <div className="bg-surface-container-lowest rounded-xl rounded-tl-none p-md border border-outline-variant/30 shadow-sm max-w-[85%]">
            <p className="font-body-md text-body-md text-on-surface flex items-center gap-sm">
              <Loader2 className="animate-spin text-primary w-4 h-4" />
              正在解析数据并生成高级图表配置...
            </p>
          </div>
        </div>
      </div>
      
      {/* Chat Input */}
      <div className="p-md bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="relative bg-surface rounded-xl border border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-shadow">
          <textarea 
            className="w-full bg-transparent border-none rounded-xl p-md pr-12 resize-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder-on-surface-variant outline-none" 
            placeholder="在此输入您的数据描述或图表需求..." 
            rows={3}
          ></textarea>
          <div className="absolute bottom-sm right-sm flex gap-xs">
            <button className="p-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors" title="上传数据文件">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm" title="发送">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
