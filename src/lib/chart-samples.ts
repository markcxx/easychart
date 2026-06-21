import { ChartData, ChartSubType, ChartType, ScatterPoint, SingleAxisScatterPoint } from '@/types';
import { CHINA_CITY_POINTS, getMapRegions } from '@/lib/map-geodata';

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

const BASIC_SCATTER_POINTS: ScatterPoint[] = [
  [10.0, 8.04],
  [8.07, 6.95],
  [13.0, 7.58],
  [9.05, 8.81],
  [11.0, 8.33],
  [14.0, 7.66],
  [13.4, 6.81],
  [10.0, 6.33],
  [14.0, 8.96],
  [12.5, 6.82],
  [9.15, 7.2],
  [11.5, 7.2],
  [3.03, 4.23],
  [12.2, 7.83],
  [2.02, 4.47],
  [1.05, 3.33],
  [4.05, 4.96],
  [6.03, 7.24],
  [12.0, 6.26],
  [12.0, 8.84],
  [7.08, 5.82],
  [5.02, 5.68],
];

const CLUSTER_SCATTER_POINTS: ScatterPoint[] = [
  [3.275154, 2.957587],
  [-3.344465, 2.603513],
  [0.355083, -3.376585],
  [1.852435, 3.547351],
  [-2.078973, 2.552013],
  [-0.993756, -0.884433],
  [2.682252, 4.007573],
  [-3.087776, 2.878713],
  [-1.565978, -1.256985],
  [2.441611, 0.444826],
  [-0.659487, 3.111284],
  [-0.459601, -2.618005],
  [2.17768, 2.387793],
  [-2.920969, 2.917485],
  [-0.028814, -4.168078],
  [3.625746, 2.119041],
  [-3.912363, 1.325108],
  [-0.551694, -2.814223],
  [2.855808, 3.483301],
  [-3.594448, 2.856651],
  [0.421993, -2.372646],
  [1.650821, 3.407572],
  [-2.082902, 3.384412],
  [-0.718809, -2.492514],
  [4.513623, 3.841029],
  [-4.822011, 4.607049],
  [-0.656297, -1.449872],
  [1.919901, 4.439368],
  [-3.287749, 3.918836],
  [-1.576936, -2.977622],
  [3.598143, 1.97597],
  [-3.977329, 4.900932],
  [-1.79108, -2.184517],
  [3.914654, 3.559303],
  [-1.910108, 4.166946],
  [-1.226597, -3.317889],
  [1.148946, 3.345138],
  [-2.113864, 3.548172],
  [0.845762, -3.589788],
  [2.629062, 3.535831],
  [-1.640717, 2.990517],
  [-1.881012, -2.485405],
  [4.606999, 3.510312],
  [-4.366462, 4.023316],
  [0.765015, -3.00127],
  [3.121904, 2.173988],
  [-4.025139, 4.65231],
  [-0.559558, -3.840539],
  [4.376754, 4.863579],
  [-1.874308, 4.032237],
  [-0.089337, -3.026809],
  [3.997787, 2.518662],
  [-3.082978, 2.884822],
  [0.845235, -3.454465],
  [1.327224, 3.358778],
  [-2.889949, 3.596178],
  [-0.966018, -2.839827],
  [2.960769, 3.079555],
  [-3.275518, 1.577068],
  [0.639276, -3.41284],
];

const SINGLE_AXIS_HOURS = [
  '12a', '1a', '2a', '3a', '4a', '5a', '6a',
  '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p',
  '6p', '7p', '8p', '9p', '10p', '11p',
];

const SINGLE_AXIS_DAYS = [
  'Saturday', 'Friday', 'Thursday',
  'Wednesday', 'Tuesday', 'Monday', 'Sunday',
];

const SINGLE_AXIS_POINTS: SingleAxisScatterPoint[] = [
  [0, 0, 5], [0, 1, 1], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 6, 0], [0, 7, 0], [0, 8, 0], [0, 9, 0], [0, 10, 0], [0, 11, 2], [0, 12, 4], [0, 13, 1], [0, 14, 1], [0, 15, 3], [0, 16, 4], [0, 17, 6], [0, 18, 4], [0, 19, 4], [0, 20, 3], [0, 21, 3], [0, 22, 2], [0, 23, 5],
  [1, 0, 7], [1, 1, 0], [1, 2, 0], [1, 3, 0], [1, 4, 0], [1, 5, 0], [1, 6, 0], [1, 7, 0], [1, 8, 0], [1, 9, 0], [1, 10, 5], [1, 11, 2], [1, 12, 2], [1, 13, 6], [1, 14, 9], [1, 15, 11], [1, 16, 6], [1, 17, 7], [1, 18, 8], [1, 19, 12], [1, 20, 5], [1, 21, 5], [1, 22, 7], [1, 23, 2],
  [2, 0, 1], [2, 1, 1], [2, 2, 0], [2, 3, 0], [2, 4, 0], [2, 5, 0], [2, 6, 0], [2, 7, 0], [2, 8, 0], [2, 9, 0], [2, 10, 3], [2, 11, 2], [2, 12, 1], [2, 13, 9], [2, 14, 8], [2, 15, 10], [2, 16, 6], [2, 17, 5], [2, 18, 5], [2, 19, 5], [2, 20, 7], [2, 21, 4], [2, 22, 2], [2, 23, 4],
  [3, 0, 7], [3, 1, 3], [3, 2, 0], [3, 3, 0], [3, 4, 0], [3, 5, 0], [3, 6, 0], [3, 7, 0], [3, 8, 1], [3, 9, 0], [3, 10, 5], [3, 11, 4], [3, 12, 7], [3, 13, 14], [3, 14, 13], [3, 15, 12], [3, 16, 9], [3, 17, 5], [3, 18, 5], [3, 19, 10], [3, 20, 6], [3, 21, 4], [3, 22, 4], [3, 23, 1],
  [4, 0, 1], [4, 1, 3], [4, 2, 0], [4, 3, 0], [4, 4, 0], [4, 5, 1], [4, 6, 0], [4, 7, 0], [4, 8, 0], [4, 9, 2], [4, 10, 4], [4, 11, 4], [4, 12, 2], [4, 13, 4], [4, 14, 4], [4, 15, 14], [4, 16, 12], [4, 17, 1], [4, 18, 8], [4, 19, 5], [4, 20, 3], [4, 21, 7], [4, 22, 3], [4, 23, 0],
  [5, 0, 2], [5, 1, 1], [5, 2, 0], [5, 3, 3], [5, 4, 0], [5, 5, 0], [5, 6, 0], [5, 7, 0], [5, 8, 2], [5, 9, 0], [5, 10, 4], [5, 11, 1], [5, 12, 5], [5, 13, 10], [5, 14, 5], [5, 15, 7], [5, 16, 11], [5, 17, 6], [5, 18, 0], [5, 19, 5], [5, 20, 3], [5, 21, 4], [5, 22, 2], [5, 23, 0],
  [6, 0, 1], [6, 1, 0], [6, 2, 0], [6, 3, 0], [6, 4, 0], [6, 5, 0], [6, 6, 0], [6, 7, 0], [6, 8, 0], [6, 9, 0], [6, 10, 1], [6, 11, 0], [6, 12, 2], [6, 13, 1], [6, 14, 3], [6, 15, 4], [6, 16, 0], [6, 17, 0], [6, 18, 0], [6, 19, 0], [6, 20, 1], [6, 21, 2], [6, 22, 2], [6, 23, 6],
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

function createScatterDataFromPoints(points: ScatterPoint[], seriesName: string): ChartData {
  return {
    categories: points.map((_, index) => `点${index + 1}`),
    series: [
      {
        name: seriesName,
        data: points.map((point) => point[1]),
      },
    ],
    scatterData: points,
  };
}

function createSingleAxisScatterData(): ChartData {
  return {
    categories: SINGLE_AXIS_DAYS,
    series: [
      {
        name: '活跃度',
        data: SINGLE_AXIS_DAYS.map((_, dayIndex) => (
          SINGLE_AXIS_POINTS
            .filter((point) => point[0] === dayIndex)
            .reduce((sum, point) => sum + point[2], 0)
        )),
      },
    ],
    singleAxisScatterData: {
      hours: SINGLE_AXIS_HOURS,
      days: SINGLE_AXIS_DAYS,
      data: SINGLE_AXIS_POINTS,
    },
  };
}

export function createScatterTemplateData(subType: ChartSubType = 'basic'): ChartData {
  if (subType === 'clustered') {
    return createScatterDataFromPoints(CLUSTER_SCATTER_POINTS, '聚合点');
  }

  if (subType === 'single-axis') {
    return createSingleAxisScatterData();
  }

  return createScatterDataFromPoints(BASIC_SCATTER_POINTS, '散点');
}

export function createMapTemplateData(subType: ChartSubType = 'china', region?: string): ChartData {
  if (subType === 'china-cities') {
    return {
      categories: CHINA_CITY_POINTS.map((point) => point.name),
      series: [{
        name: '城市热度',
        data: CHINA_CITY_POINTS.map((point) => point.value),
      }],
      mapPoints: CHINA_CITY_POINTS,
      mapStyle: { region: 'china' },
    };
  }

  const normalizedRegion = subType === 'province' ? region || 'guangdong' : subType;
  const regions = getMapRegions(subType, normalizedRegion);
  const baseValue = subType === 'world' ? 40 : subType === 'province' ? 25 : 50;

  return {
    categories: regions,
    series: [{
      name: subType === 'world' ? '国家数据' : subType === 'province' ? '城市数据' : '区域数据',
      data: regions.map((_, index) => baseValue + ((index * 17) % 75)),
    }],
    mapStyle: { region: normalizedRegion },
  };
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
    return {
      title: '基础散点图',
      subtitle: '二维数值点分布样例',
      data: createScatterTemplateData('basic'),
    };
  }

  if (type === 'map') {
    return {
      title: '中国地图',
      subtitle: '区域数据分布样例',
      data: createMapTemplateData('china'),
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
