"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, UploadCloud, PlusSquare, Columns, Trash2, ChevronLeft, Minimize2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ChartData, ChartSeriesRole, ChartType } from '@/types';

interface DataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChartData;
  onChange: (data: ChartData) => void;
  chartType: ChartType;
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

export function DataDrawer({
  isOpen,
  onClose,
  data,
  onChange,
  chartType,
  title,
  subtitle,
  onTitleChange,
  onSubtitleChange,
}: DataDrawerProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => setIsFullScreen(false), 300);
  };

  const updateCategory = (idx: number, val: string) => {
    const newCategories = [...data.categories];
    newCategories[idx] = val;
    onChange({ ...data, categories: newCategories });
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

  const updateDataPoint = (sIdx: number, cIdx: number, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const newSeries = [...data.series];
    const newData = [...newSeries[sIdx].data];
    newData[cIdx] = num;
    newSeries[sIdx] = { ...newSeries[sIdx], data: newData };
    onChange({ ...data, series: newSeries });
  };

  const addRow = () => {
    onChange({
      categories: [...data.categories, `分类${data.categories.length + 1}`],
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
    onChange({
      ...data,
      series: data.series.filter((_, idx) => idx !== sIdx)
    });
  };

  const removeRow = (cIdx: number) => {
    if (data.categories.length <= 1) return;
    onChange({
      categories: data.categories.filter((_, idx) => idx !== cIdx),
      series: data.series.map(s => ({
        ...s,
        data: s.data.filter((_, idx) => idx !== cIdx)
      }))
    });
  };

  return (
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
        <div className="border-2 border-dashed border-outline-variant/60 rounded-md p-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary-fixed hover:border-primary transition-colors group bg-surface">
          <UploadCloud className="text-outline w-12 h-12 group-hover:text-primary mb-sm transition-colors" />
          <p className="text-body-lg font-body-lg text-on-surface mb-xs font-medium">拖拽/点击导入 Excel/CSV</p>
          <p className="text-body-md font-body-md text-on-surface-variant">支持 .xlsx, .xls, .csv 格式，单文件最大 50MB</p>
        </div>

        {/* Data Grid Preview */}
        <div className="flex flex-col gap-sm">
          <div className="flex justify-between items-end">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold">数据编辑</h4>
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
                    {data.series.map((s, sIdx) => (
                      <td key={sIdx} className="py-xs px-xs border-r border-outline-variant/30">
                        <input
                          className="w-full bg-transparent p-1 outline-none focus:ring-1 focus:ring-primary rounded hover:bg-surface-variant text-on-surface numbers font-code-sm"
                          type="number"
                          value={s.data[cIdx] ?? 0}
                          onChange={(e) => updateDataPoint(sIdx, cIdx, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-md border-t border-outline-variant/30 bg-surface-container-low flex justify-end gap-sm">
        <button 
          className="px-md py-sm bg-primary text-on-primary rounded-md hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
          onClick={onClose}
        >
          完成
        </button>
      </div>
    </div>
  );
}
