import type { ChartData, ChartSubType, ChartType, ScatterPoint, SingleAxisScatterPoint } from '@/types';

export interface ImportedTable {
  columns: string[];
  rows: string[][];
  rawRowCount: number;
  delimiter: string;
  warnings: string[];
}

export interface ImportMapping {
  categoryColumn?: string;
  valueColumns: string[];
  xColumn?: string;
  yColumn?: string;
  dayColumn?: string;
  hourColumn?: string;
  valueColumn?: string;
}

export interface ImportBuildResult {
  data?: ChartData;
  errors: string[];
  warnings: string[];
}

const MAX_PREVIEW_ROWS = 5000;
const EXCEL_EXTENSIONS = new Set(['xlsx', 'xls']);

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function detectDelimiter(text: string) {
  const candidates = [',', '\t', ';'];
  const sample = text.split(/\r?\n/).slice(0, 8).join('\n');

  return candidates
    .map((delimiter) => ({
      delimiter,
      count: countDelimiterOutsideQuotes(sample, delimiter),
    }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ',';
}

function countDelimiterOutsideQuotes(text: string, delimiter: string) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && nextChar === '"') {
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) count += 1;
  }

  return count;
}

function parseDelimitedRows(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      if (char === '\r' && nextChar === '\n') index += 1;
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((items) => items.some((item) => item.trim() !== ''));
}

function makeUniqueColumns(rawColumns: string[]) {
  const used = new Map<string, number>();

  return rawColumns.map((column, index) => {
    const fallback = `列 ${index + 1}`;
    const base = column.trim() || fallback;
    const count = used.get(base) || 0;
    used.set(base, count + 1);

    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

function normalizeRawRows(rawRows: unknown[][]) {
  return rawRows
    .map((row) => row.map((cell) => {
      if (cell instanceof Date) {
        return Number.isNaN(cell.getTime()) ? '' : cell.toISOString().slice(0, 10);
      }

      if (cell == null) return '';
      return String(cell).trim();
    }))
    .filter((row) => row.some((cell) => cell !== ''));
}

function buildImportedTableFromRows(rawRows: unknown[][], delimiter: string, baseWarnings: string[] = []): ImportedTable {
  const parsedRows = normalizeRawRows(rawRows);

  if (parsedRows.length < 2) {
    throw new Error('文件中没有可导入的数据行。');
  }

  const columns = makeUniqueColumns(parsedRows[0]);
  const bodyRows = parsedRows.slice(1);
  const normalizedRows = bodyRows
    .slice(0, MAX_PREVIEW_ROWS)
    .map((row) => columns.map((_, index) => row[index] || ''));
  const warnings = [...baseWarnings];

  if (bodyRows.length > MAX_PREVIEW_ROWS) {
    warnings.push(`文件有 ${bodyRows.length} 行，当前导入前 ${MAX_PREVIEW_ROWS} 行。`);
  }

  return {
    columns,
    rows: normalizedRows,
    rawRowCount: bodyRows.length,
    delimiter,
    warnings,
  };
}

async function parseExcelFile(file: File): Promise<ImportedTable> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
  });
  const sheetName = workbook.SheetNames.find((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return false;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
      raw: false,
    }) as unknown[][];

    return normalizeRawRows(rows).length >= 2;
  });

  if (!sheetName) {
    throw new Error('Excel 文件中没有找到包含表头和数据行的工作表。');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  }) as unknown[][];
  const warnings = [
    `已读取工作表：${sheetName}`,
    ...(workbook.SheetNames.length > 1 ? ['当前版本默认导入第一个包含数据的工作表。'] : []),
  ];

  return buildImportedTableFromRows(rawRows, 'excel', warnings);
}

export async function parseImportFile(file: File): Promise<ImportedTable> {
  const extension = getFileExtension(file.name);

  if (EXCEL_EXTENSIONS.has(extension)) {
    return parseExcelFile(file);
  }

  const text = await file.text();
  const source = text.replace(/^\uFEFF/, '');
  const delimiter = extension === 'tsv' ? '\t' : detectDelimiter(source);
  const parsedRows = parseDelimitedRows(source, delimiter);

  return buildImportedTableFromRows(parsedRows, delimiter);
}

function getColumnIndex(table: ImportedTable, column?: string) {
  if (!column) return -1;
  return table.columns.indexOf(column);
}

function toNumber(value: string) {
  const normalized = value.trim().replace(/[,\s￥¥$]/g, '').replace(/%$/, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getColumnValues(table: ImportedTable, column: string) {
  const index = getColumnIndex(table, column);
  if (index < 0) return [];
  return table.rows.map((row) => row[index] || '');
}

function getNumericRatio(table: ImportedTable, column: string) {
  const values = getColumnValues(table, column).filter((value) => value.trim() !== '');
  if (!values.length) return 0;
  return values.filter((value) => toNumber(value) != null).length / values.length;
}

export function getNumericColumns(table: ImportedTable) {
  return table.columns.filter((column) => getNumericRatio(table, column) >= 0.6);
}

function findColumn(columns: string[], patterns: RegExp[]) {
  return columns.find((column) => patterns.some((pattern) => pattern.test(column)));
}

function firstDifferent(values: string[], excluded: Array<string | undefined>) {
  return values.find((value) => !excluded.includes(value));
}

export function inferImportMapping(table: ImportedTable, chartType: ChartType, subType?: ChartSubType): ImportMapping {
  const numericColumns = getNumericColumns(table);
  const textColumns = table.columns.filter((column) => !numericColumns.includes(column));
  const categoryColumn = findColumn(table.columns, [/日期|时间|类别|分类|名称|城市|产品|项目|月份|季度|date|time|name|category|label/i])
    || textColumns[0]
    || table.columns[0];

  if (chartType === 'scatter' && subType === 'single-axis') {
    const dayColumn = findColumn(table.columns, [/星期|周|日期|day|week/i]) || textColumns[0] || table.columns[0];
    const hourColumn = findColumn(table.columns, [/小时|时段|时间|hour|time/i])
      || firstDifferent(textColumns, [dayColumn])
      || table.columns[1]
      || table.columns[0];
    const valueColumn = findColumn(numericColumns, [/值|数量|次数|value|count|amount|total/i])
      || firstDifferent(numericColumns, [dayColumn, hourColumn])
      || numericColumns[0]
      || table.columns[0];

    return {
      valueColumns: valueColumn ? [valueColumn] : [],
      dayColumn,
      hourColumn,
      valueColumn,
    };
  }

  if (chartType === 'scatter') {
    const xColumn = findColumn(numericColumns, [/^x$|x轴|横轴|longitude|经度|x value/i])
      || numericColumns[0]
      || table.columns[0];
    const yColumn = findColumn(numericColumns, [/^y$|y轴|纵轴|latitude|纬度|y value/i])
      || firstDifferent(numericColumns, [xColumn])
      || numericColumns[0]
      || table.columns[1]
      || table.columns[0];

    return {
      categoryColumn,
      valueColumns: yColumn ? [yColumn] : [],
      xColumn,
      yColumn,
    };
  }

  const valueColumns = numericColumns.filter((column) => column !== categoryColumn);

  return {
    categoryColumn,
    valueColumns: chartType === 'pie' ? valueColumns.slice(0, 1) : valueColumns,
  };
}

function getRequiredIndex(table: ImportedTable, column: string | undefined, label: string, errors: string[]) {
  const index = getColumnIndex(table, column);
  if (index < 0) errors.push(`请选择${label}`);
  return index;
}

function getCell(row: string[], index: number) {
  return index >= 0 ? row[index] || '' : '';
}

function buildCategorySeriesData(table: ImportedTable, mapping: ImportMapping, chartType: ChartType): ImportBuildResult {
  const errors: string[] = [];
  const warnings = [...table.warnings];
  const categoryIndex = getRequiredIndex(table, mapping.categoryColumn, '分类 / X 轴列', errors);
  const valueColumns = mapping.valueColumns.filter((column) => table.columns.includes(column));

  if (!valueColumns.length) errors.push('请至少选择一个数值列。');
  if (errors.length) return { errors, warnings };

  const categories = table.rows.map((row, index) => getCell(row, categoryIndex).trim() || `第 ${index + 1} 行`);
  const series = valueColumns.map((column) => {
    const valueIndex = getColumnIndex(table, column);

    return {
      name: column,
      data: table.rows.map((row) => toNumber(getCell(row, valueIndex)) ?? 0),
    };
  });

  return {
    data: {
      categories,
      series: chartType === 'pie' ? series.slice(0, 1) : series,
    },
    errors,
    warnings,
  };
}

function buildScatterData(table: ImportedTable, mapping: ImportMapping): ImportBuildResult {
  const errors: string[] = [];
  const warnings = [...table.warnings];
  const xIndex = getRequiredIndex(table, mapping.xColumn, 'X 轴列', errors);
  const yIndex = getRequiredIndex(table, mapping.yColumn, 'Y 数据列', errors);
  const categoryIndex = getColumnIndex(table, mapping.categoryColumn);

  if (errors.length) return { errors, warnings };

  const points: ScatterPoint[] = [];
  const categories: string[] = [];

  table.rows.forEach((row, index) => {
    const x = toNumber(getCell(row, xIndex));
    const y = toNumber(getCell(row, yIndex));
    if (x == null || y == null) return;

    points.push([x, y]);
    categories.push(categoryIndex >= 0 ? getCell(row, categoryIndex).trim() || `点 ${index + 1}` : `点 ${index + 1}`);
  });

  if (!points.length) errors.push('没有找到有效的 X/Y 数值点。');

  return {
    data: points.length ? {
      categories,
      series: [{ name: mapping.yColumn || '散点', data: points.map((point) => point[1]) }],
      scatterData: points,
    } : undefined,
    errors,
    warnings,
  };
}

function sortHourValues(values: string[]) {
  const allNumeric = values.every((value) => Number.isFinite(Number(value)));
  if (!allNumeric) return values;
  return [...values].sort((a, b) => Number(a) - Number(b));
}

function buildSingleAxisScatterData(table: ImportedTable, mapping: ImportMapping): ImportBuildResult {
  const errors: string[] = [];
  const warnings = [...table.warnings];
  const dayIndex = getRequiredIndex(table, mapping.dayColumn, '行 / 日期列', errors);
  const hourIndex = getRequiredIndex(table, mapping.hourColumn, '单轴分类列', errors);
  const valueIndex = getRequiredIndex(table, mapping.valueColumn, '数值列', errors);

  if (errors.length) return { errors, warnings };

  const days: string[] = [];
  const hours: string[] = [];
  const entries: Array<{ day: string; hour: string; value: number }> = [];

  table.rows.forEach((row) => {
    const day = getCell(row, dayIndex).trim();
    const hour = getCell(row, hourIndex).trim();
    const value = toNumber(getCell(row, valueIndex));

    if (!day || !hour || value == null) return;
    if (!days.includes(day)) days.push(day);
    if (!hours.includes(hour)) hours.push(hour);
    entries.push({ day, hour, value });
  });

  const sortedHours = sortHourValues(hours);
  const points: SingleAxisScatterPoint[] = entries.map((entry) => [
    days.indexOf(entry.day),
    sortedHours.indexOf(entry.hour),
    entry.value,
  ]);

  if (!points.length) errors.push('没有找到有效的单轴散点数据。');

  return {
    data: points.length ? {
      categories: days,
      series: days.map((day) => ({
        name: day,
        data: sortedHours.map((hour) => (
          entries.find((entry) => entry.day === day && entry.hour === hour)?.value ?? 0
        )),
      })),
      singleAxisScatterData: {
        days,
        hours: sortedHours,
        data: points,
      },
    } : undefined,
    errors,
    warnings,
  };
}

export function buildChartDataFromImport(
  table: ImportedTable,
  mapping: ImportMapping,
  chartType: ChartType,
  subType?: ChartSubType
): ImportBuildResult {
  if (chartType === 'line' && subType === 'function-plot') {
    return {
      errors: ['函数绘图不支持表格导入，请先切换到普通折线图模板。'],
      warnings: [...table.warnings],
    };
  }

  if (chartType === 'scatter' && subType === 'single-axis') {
    return buildSingleAxisScatterData(table, mapping);
  }

  if (chartType === 'scatter') {
    return buildScatterData(table, mapping);
  }

  return buildCategorySeriesData(table, mapping, chartType);
}
