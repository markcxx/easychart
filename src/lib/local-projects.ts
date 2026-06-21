import type { ChartData, ChartOptions, ChartType } from '@/types';

export interface ChartProjectSnapshot {
  chartType: ChartType;
  chartTheme: string;
  chartTitle: string;
  chartData: ChartData;
  chartOptions: ChartOptions;
}

export interface SavedChartProject extends ChartProjectSnapshot {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: 1;
}

const PROJECTS_STORAGE_KEY = 'easychart.projects.v1';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeParseProjects(raw: string | null): SavedChartProject[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedChartProject) : [];
  } catch {
    return [];
  }
}

function isSavedChartProject(project: unknown): project is SavedChartProject {
  if (!project || typeof project !== 'object') return false;

  const value = project as Partial<SavedChartProject>;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.chartType === 'string' &&
    typeof value.chartTheme === 'string' &&
    typeof value.chartTitle === 'string' &&
    Boolean(value.chartData) &&
    Boolean(value.chartOptions)
  );
}

export function getLocalProjects() {
  if (!canUseStorage()) return [];
  return safeParseProjects(window.localStorage.getItem(PROJECTS_STORAGE_KEY))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalProject(projectId: string) {
  return getLocalProjects().find((project) => project.id === projectId) || null;
}

export function saveLocalProject(
  snapshot: ChartProjectSnapshot,
  name: string,
  projectId?: string | null
) {
  if (!canUseStorage()) {
    throw new Error('当前环境不支持保存项目。');
  }

  const projects = getLocalProjects();
  const existingProject = projectId
    ? projects.find((project) => project.id === projectId)
    : undefined;
  const now = new Date().toISOString();
  const project: SavedChartProject = {
    ...snapshot,
    id: existingProject?.id || createId(),
    name: name.trim() || snapshot.chartTitle || '未命名项目',
    chartTitle: snapshot.chartTitle.trim() || name.trim() || '未命名项目',
    createdAt: existingProject?.createdAt || now,
    updatedAt: now,
    version: 1,
  };
  const nextProjects = [
    project,
    ...projects.filter((item) => item.id !== project.id),
  ];

  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nextProjects));

  return project;
}

export function deleteLocalProject(projectId: string) {
  if (!canUseStorage()) return;
  const projects = getLocalProjects().filter((project) => project.id !== projectId);
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function createProjectSnapshotKey(snapshot: ChartProjectSnapshot) {
  return JSON.stringify(snapshot);
}

export function getProjectSizeBytes(project: SavedChartProject) {
  const source = JSON.stringify(project);

  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(source).length;
  }

  return source.length * 2;
}

export function formatProjectSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
