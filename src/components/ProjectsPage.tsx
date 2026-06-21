"use client";

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  deleteLocalProject,
  formatProjectSize,
  getLocalProjects,
  getProjectSizeBytes,
  type SavedChartProject,
} from '@/lib/local-projects';

const CHART_TYPE_LABELS: Record<SavedChartProject['chartType'], string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  scatter: '散点图',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知时间';

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadProject(project: SavedChartProject) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name || 'easychart-project'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<SavedChartProject[]>([]);
  const totalSize = useMemo(() => (
    projects.reduce((sum, project) => sum + getProjectSizeBytes(project), 0)
  ), [projects]);

  useEffect(() => {
    setProjects(getLocalProjects());
  }, []);

  const handleDelete = (projectId: string) => {
    deleteLocalProject(projectId);
    setProjects(getLocalProjects());
  };

  return (
    <div className="min-h-screen w-full bg-surface-container-low text-on-surface flex flex-col">
      <header className="h-16 px-lg flex items-center justify-between border-b border-outline-variant/30 bg-surface">
        <a href="/" className="flex items-center gap-sm">
          <img src="/easychart.svg" alt="EasyChart" className="h-8 w-8" />
          <span className="text-headline-sm font-headline-sm font-bold text-primary">EasyChart</span>
        </a>
        <a
          href="/"
          className="flex items-center gap-xs px-md py-sm bg-primary !text-white rounded-md hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          新建图表
        </a>
      </header>

      <main className="flex-1 p-xl overflow-y-auto">
        <div className="mx-auto max-w-6xl flex flex-col gap-lg">
          <section className="flex flex-wrap items-end justify-between gap-md">
            <div>
              <h1 className="text-headline-md font-headline-md font-semibold text-on-surface">我的项目</h1>
              <p className="mt-xs text-body-md text-on-surface-variant">
                已保存 {projects.length} 个项目，占用约 {formatProjectSize(totalSize)}。
              </p>
            </div>
          </section>

          {projects.length === 0 ? (
            <div className="min-h-[360px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest flex flex-col items-center justify-center text-center p-xl">
              <FolderOpen className="w-12 h-12 text-outline mb-md" />
              <h2 className="text-headline-sm font-headline-sm font-semibold text-on-surface">还没有保存项目</h2>
              <p className="mt-xs text-body-md text-on-surface-variant">回到工作台配置图表后，点击“保存项目”即可在这里查看。</p>
            </div>
          ) : (
            <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest overflow-hidden shadow-sm">
              <div className="grid grid-cols-[minmax(240px,1fr)_120px_180px_120px_260px] gap-0 bg-surface-container-low text-label-md font-label-md text-on-surface font-semibold border-b border-outline-variant/40">
                <div className="px-md py-sm">项目名称</div>
                <div className="px-md py-sm">图表类型</div>
                <div className="px-md py-sm">更新时间</div>
                <div className="px-md py-sm">大小</div>
                <div className="px-md py-sm text-right">操作</div>
              </div>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-[minmax(240px,1fr)_120px_180px_120px_260px] items-center border-b border-outline-variant/20 hover:bg-surface-container transition-colors"
                >
                  <div className="px-md py-sm min-w-0">
                    <div className="flex items-center gap-sm min-w-0">
                      <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-body-md font-medium text-on-surface" title={project.name}>{project.name}</div>
                        <div className="truncate text-body-sm text-on-surface-variant" title={project.chartOptions.title}>{project.chartOptions.title}</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-md py-sm text-body-md text-on-surface-variant">{CHART_TYPE_LABELS[project.chartType]}</div>
                  <div className="px-md py-sm text-body-md text-on-surface-variant">{formatDate(project.updatedAt)}</div>
                  <div className="px-md py-sm text-body-md text-on-surface-variant">{formatProjectSize(getProjectSizeBytes(project))}</div>
                  <div className="px-md py-sm">
                    <div className="flex justify-end gap-xs">
                      <a
                        href={`/?projectId=${encodeURIComponent(project.id)}`}
                        className={cn(
                          "flex items-center gap-xs px-sm py-xs rounded-md bg-primary !text-white hover:bg-primary-container",
                          "font-label-md text-label-md transition-colors shadow-sm"
                        )}
                      >
                        <FolderOpen className="w-4 h-4 text-white" />
                        打开
                      </a>
                      <button
                        className="flex items-center gap-xs px-sm py-xs rounded-md border border-outline-variant/40 bg-surface hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                        onClick={() => downloadProject(project)}
                      >
                        <Download className="w-4 h-4" />
                        备份
                      </button>
                      <button
                        className="flex items-center gap-xs px-sm py-xs rounded-md border border-outline-variant/40 bg-surface hover:bg-error-container hover:text-on-error-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                        onClick={() => handleDelete(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
