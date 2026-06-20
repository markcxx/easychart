import { ChartData, ChartType } from '@/types';

interface SampleChart {
  data: ChartData;
  title: string;
  subtitle: string;
}

const CATEGORY_POOLS = [
  {
    title: '城市市场表现',
    subtitle: '自动生成的城市维度样例数据',
    categories: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '厦门', '青岛', '长沙', '重庆'],
  },
  {
    title: '产品线收入对比',
    subtitle: '自动生成的产品样例数据',
    categories: ['基础版', '专业版', '团队版', '企业版', '旗舰版', '开放平台', '数据服务', '自动化套件', '分析模块', '协作空间'],
  },
  {
    title: '客户行业分布',
    subtitle: '自动生成的行业维度样例数据',
    categories: ['金融', '制造', '零售', '教育', '医疗', '物流', '文娱', '政企', '能源', '地产', '餐饮', '旅游'],
  },
  {
    title: '季度运营概览',
    subtitle: '自动生成的周期样例数据',
    categories: ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', '春节档', '暑期档', '双十一', '年终季'],
  },
  {
    title: '团队交付效率',
    subtitle: '自动生成的团队样例数据',
    categories: ['增长组', '平台组', '设计组', '数据组', '移动组', '商业化组', '客户成功组', '基础架构组', '运营组'],
  },
  {
    title: '门店经营对比',
    subtitle: '自动生成的门店维度样例数据',
    categories: ['旗舰店A', '旗舰店B', '快闪店', '社区店', '机场店', '商圈店', '校园店', '奥莱店', '体验店', '会员店'],
  },
  {
    title: '项目阶段表现',
    subtitle: '自动生成的阶段维度样例数据',
    categories: ['立项', '调研', '设计', '开发', '测试', '试点', '发布', '复盘', '扩展', '归档'],
  },
];

const SERIES_POOLS = [
  ['销售额', '利润', '客户数'],
  ['新增用户', '活跃用户', '付费用户'],
  ['计划值', '实际值', '预测值'],
  ['企业服务', '个人订阅', '生态合作'],
  ['北区', '东区', '南区', '西区'],
  ['直营', '代理', '联营'],
  ['新客', '老客', '会员'],
  ['预算', '消耗', '回收'],
  ['高优先级', '中优先级', '低优先级'],
];

function createRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function seriesData(random: () => number, count: number, min: number, max: number) {
  return Array.from({ length: count }, () => Math.round(min + random() * (max - min)));
}

function pick<T>(random: () => number, values: T[]) {
  return values[Math.floor(random() * values.length)];
}

function sampleItems<T>(random: () => number, values: T[], count: number) {
  const copy = [...values];
  return Array.from({ length: Math.min(count, copy.length) }, () => {
    const index = Math.floor(random() * copy.length);
    const [item] = copy.splice(index, 1);
    return item;
  });
}

function createMultiSeries(random: () => number, categories: string[], min: number, max: number, maxSeries = 3) {
  const seriesNames = sampleItems(random, pick(random, SERIES_POOLS), Math.max(2, Math.min(maxSeries, 4)));

  return seriesNames.map(name => ({
    name,
    data: seriesData(random, categories.length, min, max),
  }));
}

export function createSampleSeed() {
  return Date.now() + Math.floor(Math.random() * 100000);
}

export function createSampleChart(type: ChartType, seed = 20240620): SampleChart {
  const random = createRandom(seed + type.charCodeAt(0) * 997);
  const categoryPool = pick(random, CATEGORY_POOLS);
  const categoryCount = type === 'line'
    ? 8 + Math.floor(random() * 4)
    : type === 'pie'
      ? 5 + Math.floor(random() * 2)
      : type === 'scatter'
        ? 8 + Math.floor(random() * 5)
        : 6 + Math.floor(random() * 3);
  const categories = sampleItems(random, categoryPool.categories, categoryCount);

  if (type === 'line') {
    return {
      title: categoryPool.title,
      subtitle: categoryPool.subtitle,
      data: {
        categories,
        series: createMultiSeries(random, categories, 60, 360, 4),
      },
    };
  }

  if (type === 'pie') {
    return {
      title: categoryPool.title,
      subtitle: categoryPool.subtitle,
      data: {
        categories,
        series: [{ name: pick(random, pick(random, SERIES_POOLS)), data: seriesData(random, categories.length, 80, 360) }],
      },
    };
  }

  if (type === 'scatter') {
    const seriesNames = sampleItems(random, pick(random, SERIES_POOLS), 2);
    return {
      title: categoryPool.title,
      subtitle: categoryPool.subtitle,
      data: {
        categories,
        series: seriesNames.map(name => ({
          name,
          data: seriesData(random, categories.length, 30, 280),
        })),
      },
    };
  }

  return {
    title: categoryPool.title,
    subtitle: categoryPool.subtitle,
    data: {
      categories,
        series: createMultiSeries(random, categories, 60, 420, 4),
    },
  };
}
