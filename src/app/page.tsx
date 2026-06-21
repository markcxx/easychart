import { redirect } from 'next/navigation';
import { getChartRoute } from '@/lib/chart-routes';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }

    if (value != null) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  redirect(`${getChartRoute('bar')}${queryString ? `?${queryString}` : ''}`);
}
