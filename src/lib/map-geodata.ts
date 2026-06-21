import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { MapPoint } from '@/types';
import chinaGeoJson from 'china-geojson/src/geojson/china.json';
import anhuiGeoJson from 'china-geojson/src/geojson/an_hui_geo.json';
import beijingGeoJson from 'china-geojson/src/geojson/bei_jing_geo.json';
import chongqingGeoJson from 'china-geojson/src/geojson/chong_qing_geo.json';
import fujianGeoJson from 'china-geojson/src/geojson/fu_jian_geo.json';
import gansuGeoJson from 'china-geojson/src/geojson/gan_su_geo.json';
import guangdongGeoJson from 'china-geojson/src/geojson/guang_dong_geo.json';
import guangxiGeoJson from 'china-geojson/src/geojson/guang_xi_geo.json';
import guizhouGeoJson from 'china-geojson/src/geojson/gui_zhou_geo.json';
import hainanGeoJson from 'china-geojson/src/geojson/hai_nan_geo.json';
import hebeiGeoJson from 'china-geojson/src/geojson/he_bei_geo.json';
import heilongjiangGeoJson from 'china-geojson/src/geojson/hei_long_jiang_geo.json';
import henanGeoJson from 'china-geojson/src/geojson/he_nan_geo.json';
import hubeiGeoJson from 'china-geojson/src/geojson/hu_bei_geo.json';
import hunanGeoJson from 'china-geojson/src/geojson/hu_nan_geo.json';
import jiangsuGeoJson from 'china-geojson/src/geojson/jiang_su_geo.json';
import jiangxiGeoJson from 'china-geojson/src/geojson/jiang_xi_geo.json';
import jilinGeoJson from 'china-geojson/src/geojson/ji_lin_geo.json';
import liaoningGeoJson from 'china-geojson/src/geojson/liao_ning_geo.json';
import neimengguGeoJson from 'china-geojson/src/geojson/nei_meng_gu_geo.json';
import ningxiaGeoJson from 'china-geojson/src/geojson/ning_xia_geo.json';
import qinghaiGeoJson from 'china-geojson/src/geojson/qing_hai_geo.json';
import shandongGeoJson from 'china-geojson/src/geojson/shan_dong_geo.json';
import shanghaiGeoJson from 'china-geojson/src/geojson/shang_hai_geo.json';
import shanxiGeoJson from 'china-geojson/src/geojson/shan_xi_1_geo.json';
import shaanxiGeoJson from 'china-geojson/src/geojson/shan_xi_2_geo.json';
import sichuanGeoJson from 'china-geojson/src/geojson/si_chuan_geo.json';
import tianjinGeoJson from 'china-geojson/src/geojson/tian_jin_geo.json';
import xinjiangGeoJson from 'china-geojson/src/geojson/xin_jiang_geo.json';
import xizangGeoJson from 'china-geojson/src/geojson/xi_zang_geo.json';
import yunnanGeoJson from 'china-geojson/src/geojson/yun_nan_geo.json';
import zhejiangGeoJson from 'china-geojson/src/geojson/zhe_jiang_geo.json';
import worldAtlas from 'world-atlas/countries-110m.json';

type GeoFeatureCollection = FeatureCollection<Geometry, { name?: string }>;

export const MAP_NAMES = {
  china: 'easychart-china',
  world: 'easychart-world',
} as const;

export const MAP_PROVINCES = [
  { value: 'anhui', label: '安徽', geoJson: anhuiGeoJson },
  { value: 'beijing', label: '北京', geoJson: beijingGeoJson },
  { value: 'chongqing', label: '重庆', geoJson: chongqingGeoJson },
  { value: 'fujian', label: '福建', geoJson: fujianGeoJson },
  { value: 'gansu', label: '甘肃', geoJson: gansuGeoJson },
  { value: 'guangdong', label: '广东', geoJson: guangdongGeoJson },
  { value: 'guangxi', label: '广西', geoJson: guangxiGeoJson },
  { value: 'guizhou', label: '贵州', geoJson: guizhouGeoJson },
  { value: 'hainan', label: '海南', geoJson: hainanGeoJson },
  { value: 'hebei', label: '河北', geoJson: hebeiGeoJson },
  { value: 'heilongjiang', label: '黑龙江', geoJson: heilongjiangGeoJson },
  { value: 'henan', label: '河南', geoJson: henanGeoJson },
  { value: 'hubei', label: '湖北', geoJson: hubeiGeoJson },
  { value: 'hunan', label: '湖南', geoJson: hunanGeoJson },
  { value: 'jiangsu', label: '江苏', geoJson: jiangsuGeoJson },
  { value: 'jiangxi', label: '江西', geoJson: jiangxiGeoJson },
  { value: 'jilin', label: '吉林', geoJson: jilinGeoJson },
  { value: 'liaoning', label: '辽宁', geoJson: liaoningGeoJson },
  { value: 'neimenggu', label: '内蒙古', geoJson: neimengguGeoJson },
  { value: 'ningxia', label: '宁夏', geoJson: ningxiaGeoJson },
  { value: 'qinghai', label: '青海', geoJson: qinghaiGeoJson },
  { value: 'shandong', label: '山东', geoJson: shandongGeoJson },
  { value: 'shanghai', label: '上海', geoJson: shanghaiGeoJson },
  { value: 'shanxi', label: '山西', geoJson: shanxiGeoJson },
  { value: 'shaanxi', label: '陕西', geoJson: shaanxiGeoJson },
  { value: 'sichuan', label: '四川', geoJson: sichuanGeoJson },
  { value: 'tianjin', label: '天津', geoJson: tianjinGeoJson },
  { value: 'xinjiang', label: '新疆', geoJson: xinjiangGeoJson },
  { value: 'xizang', label: '西藏', geoJson: xizangGeoJson },
  { value: 'yunnan', label: '云南', geoJson: yunnanGeoJson },
  { value: 'zhejiang', label: '浙江', geoJson: zhejiangGeoJson },
].map((province) => ({
  ...province,
  mapName: `easychart-province-${province.value}`,
}));

export const CHINA_CITY_POINTS: MapPoint[] = [
  { name: '北京', value: 95, coord: [116.4, 39.9] },
  { name: '上海', value: 88, coord: [121.47, 31.23] },
  { name: '广州', value: 82, coord: [113.26, 23.13] },
  { name: '深圳', value: 78, coord: [114.05, 22.55] },
  { name: '成都', value: 72, coord: [104.06, 30.67] },
  { name: '武汉', value: 68, coord: [114.31, 30.52] },
  { name: '西安', value: 60, coord: [108.94, 34.34] },
  { name: '杭州', value: 58, coord: [120.16, 30.25] },
  { name: '重庆', value: 56, coord: [106.55, 29.57] },
  { name: '南京', value: 52, coord: [118.8, 32.06] },
];

export const WORLD_REGIONS = [
  'China',
  'United States of America',
  'Canada',
  'Brazil',
  'United Kingdom',
  'France',
  'Germany',
  'Russia',
  'India',
  'Japan',
  'Australia',
  'South Africa',
];

function getFeatureNames(geoJson: GeoFeatureCollection) {
  return geoJson.features
    .map((item) => item.properties?.name)
    .filter((name): name is string => Boolean(name));
}

function normalizeChinaFeatureNames(geoJson: GeoFeatureCollection) {
  return {
    ...geoJson,
    features: geoJson.features.map((item) => {
      const properties = item.properties || {};
      const name = properties.name?.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '') || properties.name;
      return {
        ...item,
        properties: {
          ...properties,
          name,
        },
      } as Feature<Geometry, { name?: string }>;
    }),
  };
}

const chinaMap = normalizeChinaFeatureNames(chinaGeoJson as GeoFeatureCollection);
const provinceMaps = MAP_PROVINCES.map((province) => ({
  ...province,
  geoJson: normalizeChinaFeatureNames(province.geoJson as GeoFeatureCollection),
}));
const worldMap = feature(
  worldAtlas as never,
  (worldAtlas as unknown as { objects: { countries: never } }).objects.countries
) as unknown as GeoFeatureCollection;

export const CHINA_REGIONS = getFeatureNames(chinaMap);

function getProvinceConfig(region?: string) {
  return provinceMaps.find((province) => province.value === region) || provinceMaps.find((province) => province.value === 'guangdong') || provinceMaps[0];
}

export function getMapName(subType: string | undefined, region?: string) {
  if (subType === 'world') return MAP_NAMES.world;
  if (subType === 'province') return getProvinceConfig(region)?.mapName || MAP_NAMES.china;
  return MAP_NAMES.china;
}

export function getMapRegions(subType: string | undefined, region?: string) {
  if (subType === 'world') return WORLD_REGIONS;
  if (subType === 'province') {
    const province = getProvinceConfig(region);
    return province ? getFeatureNames(province.geoJson) : [];
  }
  if (subType === 'china-cities') return CHINA_CITY_POINTS.map((point) => point.name);
  return CHINA_REGIONS;
}

export function registerBuiltinMaps(echarts: {
  // ECharts accepts standard GeoJSON at runtime, but its compressed-map type is narrower.
  registerMap: (name: string, geoJson: any) => void;
}) {
  echarts.registerMap(MAP_NAMES.china, chinaMap);
  provinceMaps.forEach((province) => {
    echarts.registerMap(province.mapName, province.geoJson);
  });
  echarts.registerMap(MAP_NAMES.world, worldMap);
}
