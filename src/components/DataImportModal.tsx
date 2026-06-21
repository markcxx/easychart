"use client";

import { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Table2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import {
  buildChartDataFromImport,
  getNumericColumns,
  inferImportMapping,
  type ImportedTable,
  type ImportBuildResult,
  type ImportMapping,
} from '@/lib/import-data';
import type { ChartData, ChartSubType, ChartType } from '@/types';

interface DataImportModalProps {
  isOpen: boolean;
  fileName: string;
  table: ImportedTable | null;
  chartType: ChartType;
  subType?: ChartSubType;
  onClose: () => void;
  onApply: (data: ChartData) => void;
}

const NONE_VALUE = '__none__';

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  scatter: '散点图',
};

function ColumnSelect({
  label,
  columns,
  value,
  allowNone = false,
  onChange,
}: {
  label: string;
  columns: string[];
  value?: string;
  allowNone?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const selectValue = value || (allowNone ? NONE_VALUE : columns[0] || NONE_VALUE);

  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-md font-label-md text-on-surface font-medium">{label}</span>
      <Select
        value={selectValue}
        onValueChange={(nextValue) => onChange(nextValue === NONE_VALUE ? undefined : nextValue)}
      >
        <SelectTrigger className="h-[36px]">
          <SelectValue placeholder="选择列" />
        </SelectTrigger>
        <SelectContent className="z-[140] min-w-[320px]">
          {allowNone && <SelectItem value={NONE_VALUE}>不使用</SelectItem>}
          {columns.map((column) => (
            <SelectItem key={column} value={column} title={column}>{column}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function updateValueColumns(current: string[], column: string, checked: boolean) {
  if (checked) return current.includes(column) ? current : [...current, column];
  return current.filter((item) => item !== column);
}

export function DataImportModal({
  isOpen,
  fileName,
  table,
  chartType,
  subType,
  onClose,
  onApply,
}: DataImportModalProps) {
  const [mapping, setMapping] = useState<ImportMapping>({ valueColumns: [] });

  useEffect(() => {
    if (!table || !isOpen) return;
    setMapping(inferImportMapping(table, chartType, subType));
  }, [chartType, isOpen, subType, table]);

  const numericColumns = useMemo(() => table ? getNumericColumns(table) : [], [table]);
  const buildResult = useMemo<ImportBuildResult>(() => {
    if (!table) return { data: undefined, errors: ['没有可导入的数据。'], warnings: [] };
    return buildChartDataFromImport(table, mapping, chartType, subType);
  }, [chartType, mapping, subType, table]);

  if (!isOpen || !table) return null;

  const previewRows = table.rows.slice(0, 12);
  const canApply = Boolean(buildResult.data) && buildResult.errors.length === 0;

  const resetMapping = () => {
    setMapping(inferImportMapping(table, chartType, subType));
  };

  const renderValueColumnPicker = () => {
    const orderedColumns = [
      ...numericColumns,
      ...table.columns.filter((column) => !numericColumns.includes(column)),
    ];

    return (
      <div className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface font-medium">Y 数据列</span>
        <div className="flex flex-col gap-xs rounded-md border border-outline-variant/40 bg-surface-container-lowest p-xs max-h-72 overflow-y-auto">
          {orderedColumns.map((column) => {
            const checked = mapping.valueColumns.includes(column);
            const numeric = numericColumns.includes(column);

            return (
              <label
                key={column}
                title={column}
                className={cn(
                  "flex min-h-10 items-center gap-sm rounded px-sm py-xs text-body-md cursor-pointer hover:bg-surface-container transition-colors",
                  checked && "bg-primary-fixed text-on-primary-fixed"
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-primary"
                  checked={checked}
                  onChange={(event) => setMapping((current) => ({
                    ...current,
                    valueColumns: updateValueColumns(current.valueColumns, column, event.target.checked),
                  }))}
                />
                <span className="min-w-0 flex-1 break-all leading-snug">{column}</span>
                {numeric && <span className="shrink-0 rounded bg-surface-container-high px-xs py-[2px] text-[11px] text-on-surface-variant font-code-sm">num</span>}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMappingControls = () => {
    if (chartType === 'line' && subType === 'function-plot') {
      return (
        <div className="rounded-md border border-error/30 bg-error-container px-sm py-xs text-body-md text-on-error-container">
          函数绘图不支持表格导入。
        </div>
      );
    }

    if (chartType === 'scatter' && subType === 'single-axis') {
      return (
        <div className="grid grid-cols-1 gap-md">
          <ColumnSelect label="行 / 日期列" columns={table.columns} value={mapping.dayColumn} onChange={(value) => setMapping((current) => ({ ...current, dayColumn: value }))} />
          <ColumnSelect label="单轴分类列" columns={table.columns} value={mapping.hourColumn} onChange={(value) => setMapping((current) => ({ ...current, hourColumn: value }))} />
          <ColumnSelect label="数值列" columns={table.columns} value={mapping.valueColumn} onChange={(value) => setMapping((current) => ({ ...current, valueColumn: value, valueColumns: value ? [value] : [] }))} />
        </div>
      );
    }

    if (chartType === 'scatter') {
      return (
        <div className="grid grid-cols-1 gap-md">
          <ColumnSelect label="X 轴列" columns={table.columns} value={mapping.xColumn} onChange={(value) => setMapping((current) => ({ ...current, xColumn: value }))} />
          <ColumnSelect label="Y 数据列" columns={table.columns} value={mapping.yColumn} onChange={(value) => setMapping((current) => ({ ...current, yColumn: value, valueColumns: value ? [value] : [] }))} />
          <ColumnSelect label="标签列" columns={table.columns} value={mapping.categoryColumn} allowNone onChange={(value) => setMapping((current) => ({ ...current, categoryColumn: value }))} />
        </div>
      );
    }

    if (chartType === 'pie') {
      return (
        <div className="grid grid-cols-1 gap-md">
          <ColumnSelect label="分类列" columns={table.columns} value={mapping.categoryColumn} onChange={(value) => setMapping((current) => ({ ...current, categoryColumn: value }))} />
          <ColumnSelect label="数值列" columns={table.columns} value={mapping.valueColumns[0]} onChange={(value) => setMapping((current) => ({ ...current, valueColumns: value ? [value] : [] }))} />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-md">
        <ColumnSelect label="分类 / X 轴列" columns={table.columns} value={mapping.categoryColumn} onChange={(value) => setMapping((current) => ({ ...current, categoryColumn: value }))} />
        {renderValueColumnPicker()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-surface-container-highest/60 backdrop-blur-sm p-md">
      <div className="w-full max-w-[1280px] h-[min(88vh,820px)] bg-surface-container-lowest border border-outline-variant/40 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-lg border-b border-outline-variant/30 bg-surface">
          <div className="flex items-center gap-sm min-w-0">
            <Table2 className="w-6 h-6 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold truncate">导入预览</h3>
              <div className="text-body-md text-on-surface-variant truncate">
                {fileName} · {CHART_TYPE_LABELS[chartType]} · {table.rows.length} 行 · {table.columns.length} 列
              </div>
            </div>
          </div>
          <button
            className="p-xs text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="关闭导入预览"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(420px,480px)_1fr]">
          <div className="border-r border-outline-variant/30 bg-surface-container-low p-md overflow-y-auto flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">字段映射</h4>
              <button
                className="flex items-center gap-xs px-sm py-xs rounded-md border border-outline-variant/40 bg-surface hover:bg-surface-variant text-on-surface text-label-md font-label-md transition-colors cursor-pointer"
                onClick={resetMapping}
              >
                <RotateCcw className="w-4 h-4" />
                自动推断
              </button>
            </div>

            {renderMappingControls()}

            {(buildResult.errors.length > 0 || buildResult.warnings.length > 0) && (
              <div className="flex flex-col gap-xs">
                {buildResult.errors.map((error) => (
                  <div key={error} className="rounded-md border border-error/30 bg-error-container px-sm py-xs text-body-md text-on-error-container">
                    {error}
                  </div>
                ))}
                {buildResult.warnings.map((warning) => (
                  <div key={warning} className="rounded-md border border-outline-variant/40 bg-surface px-sm py-xs text-body-md text-on-surface-variant">
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col overflow-hidden bg-surface">
            <div className="px-md py-sm border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">文件预览</h4>
              <span className="text-body-sm text-on-surface-variant">显示前 {previewRows.length} 行</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max border-collapse text-body-sm font-body-md">
                <thead className="sticky top-0 z-10 bg-surface-container-low text-on-surface border-b border-outline-variant/50">
                  <tr>
                    <th className="w-12 px-xs py-sm border-r border-outline-variant/40 text-right text-on-surface-variant">#</th>
                    {table.columns.map((column) => (
                      <th key={column} className="px-sm py-sm border-r border-outline-variant/40 text-left font-medium">
                        <span className="block max-w-[220px] truncate" title={column}>{column}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-surface-container-lowest text-on-surface-variant">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-outline-variant/20 hover:bg-surface-container transition-colors">
                      <td className="px-xs py-xs border-r border-outline-variant/30 text-right text-on-surface-variant font-code-sm">{rowIndex + 1}</td>
                      {table.columns.map((column, columnIndex) => (
                        <td key={`${column}-${columnIndex}`} className="px-sm py-xs border-r border-outline-variant/30 max-w-[260px]">
                          <span className="block truncate" title={row[columnIndex]}>{row[columnIndex]}</span>
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
            className="px-md py-sm rounded-md border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-variant font-label-md text-label-md transition-colors cursor-pointer"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className={cn(
              "flex items-center gap-xs px-md py-sm rounded-md bg-primary text-white font-label-md text-label-md transition-colors shadow-sm",
              canApply ? "hover:bg-primary-container cursor-pointer" : "opacity-50 cursor-not-allowed"
            )}
            disabled={!canApply}
            onClick={() => buildResult.data && onApply(buildResult.data)}
          >
            <Check className="w-4 h-4" />
            应用导入
          </button>
        </div>
      </div>
    </div>
  );
}
