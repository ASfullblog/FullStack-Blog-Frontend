/**
 * 国家经纬度常量表（本地常量，不请求任何外网 GeoJSON / 贴图）
 * key 与后端 visit_logs.country / province 的中文国名一致（见 backend/src/services/ipLocation.ts 的 EN_COUNTRY_MAP）
 * 数值为各国地理中心/首都近似坐标，精度到小数点后 2~3 位足够做球面打点
 */
export interface CountryCoord {
  name: string
  lat: number
  lng: number
}

/** 海外国家中文名 → 坐标。只有被 EN_COUNTRY_MAP 归一化过的国名才会落到这里 */
export const COUNTRY_COORDS: Record<string, CountryCoord> = {
  美国: { name: '美国', lat: 39.83, lng: -98.58 },
  日本: { name: '日本', lat: 36.20, lng: 138.25 },
  韩国: { name: '韩国', lat: 36.50, lng: 127.98 },
  新加坡: { name: '新加坡', lat: 1.35, lng: 103.82 },
  英国: { name: '英国', lat: 51.51, lng: -0.13 },
  德国: { name: '德国', lat: 51.16, lng: 10.45 },
  法国: { name: '法国', lat: 46.23, lng: 2.21 },
  加拿大: { name: '加拿大', lat: 56.13, lng: -106.35 },
  澳大利亚: { name: '澳大利亚', lat: -25.27, lng: 133.78 },
  俄罗斯: { name: '俄罗斯', lat: 61.52, lng: 105.32 },
  印度: { name: '印度', lat: 20.59, lng: 78.96 },
  巴西: { name: '巴西', lat: -14.24, lng: -51.93 },
  泰国: { name: '泰国', lat: 15.87, lng: 100.99 },
  越南: { name: '越南', lat: 14.06, lng: 108.28 },
  马来西亚: { name: '马来西亚', lat: 4.21, lng: 101.98 },
  意大利: { name: '意大利', lat: 41.87, lng: 12.57 },
  西班牙: { name: '西班牙', lat: 40.46, lng: -3.75 },
  荷兰: { name: '荷兰', lat: 52.13, lng: 5.29 },
  瑞士: { name: '瑞士', lat: 46.82, lng: 8.23 },
  瑞典: { name: '瑞典', lat: 60.13, lng: 18.64 },
  挪威: { name: '挪威', lat: 60.47, lng: 8.47 },
  丹麦: { name: '丹麦', lat: 56.26, lng: 9.50 },
  芬兰: { name: '芬兰', lat: 61.92, lng: 25.75 },
  波兰: { name: '波兰', lat: 51.92, lng: 19.15 },
  土耳其: { name: '土耳其', lat: 38.96, lng: 35.24 },
  墨西哥: { name: '墨西哥', lat: 23.63, lng: -102.55 },
  阿根廷: { name: '阿根廷', lat: -38.42, lng: -63.62 }
};

/** 取国家坐标；识别不到返回 null */
export const getCountryCoord = (raw: string): CountryCoord | null => {
  const s = (raw || '').trim();
  return COUNTRY_COORDS[s] ?? null;
};

export default COUNTRY_COORDS;
