import { notFound } from 'next/navigation';
import { EasyChartApp } from '@/components/EasyChartApp';
import { isChartType } from '@/lib/chart-routes';

interface ChartWorkbenchPageProps {
  params: Promise<{
    chartType: string;
  }>;
}

export default async function ChartWorkbenchPage({ params }: ChartWorkbenchPageProps) {
  const { chartType } = await params;

  if (!isChartType(chartType)) {
    notFound();
  }

  return <EasyChartApp initialChartType={chartType} />;
}
