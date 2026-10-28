/**
 * 省级行政区经纬度常量表（本地常量，不请求任何外网 GeoJSON / 贴图）
 * key 必须与后端 visit_logs.province 的归一化简称一致（见 backend/src/services/ipLocation.ts）
 * 数值为各省会/首府坐标，精度到小数点后 2~3 位足够做球面打点
 */
export interface ProvinceCoord {
  name: string
  lat: number
  lng: number
}

export const PROVINCE_COORDS: Record<string, ProvinceCoord> = {
  北京: { name: '北京', lat: 39.90, lng: 116.41 },
  天津: { name: '天津', lat: 39.13, lng: 117.19 },
  河北: { name: '河北', lat: 38.05, lng: 114.50 },
  山西: { name: '山西', lat: 37.86, lng: 112.55 },
  内蒙古: { name: '内蒙古', lat: 40.84, lng: 111.75 },
  辽宁: { name: '辽宁', lat: 41.80, lng: 123.43 },
  吉林: { name: '吉林', lat: 43.89, lng: 125.32 },
  黑龙江: { name: '黑龙江', lat: 45.80, lng: 126.54 },
  上海: { name: '上海', lat: 31.23, lng: 121.47 },
  江苏: { name: '江苏', lat: 32.06, lng: 118.80 },
  浙江: { name: '浙江', lat: 30.27, lng: 120.16 },
  安徽: { name: '安徽', lat: 31.86, lng: 117.28 },
  福建: { name: '福建', lat: 26.07, lng: 119.30 },
  江西: { name: '江西', lat: 28.68, lng: 115.89 },
  山东: { name: '山东', lat: 36.68, lng: 117.00 },
  河南: { name: '河南', lat: 34.75, lng: 113.63 },
  湖北: { name: '湖北', lat: 30.59, lng: 114.31 },
  湖南: { name: '湖南', lat: 28.23, lng: 112.94 },
  广东: { name: '广东', lat: 23.13, lng: 113.26 },
  广西: { name: '广西', lat: 22.82, lng: 108.32 },
  海南: { name: '海南', lat: 20.03, lng: 110.33 },
  重庆: { name: '重庆', lat: 29.56, lng: 106.55 },
  四川: { name: '四川', lat: 30.57, lng: 104.07 },
  贵州: { name: '贵州', lat: 26.65, lng: 106.63 },
  云南: { name: '云南', lat: 24.88, lng: 102.83 },
  西藏: { name: '西藏', lat: 29.66, lng: 91.13 },
  陕西: { name: '陕西', lat: 34.26, lng: 108.95 },
  甘肃: { name: '甘肃', lat: 36.06, lng: 103.83 },
  青海: { name: '青海', lat: 36.62, lng: 101.78 },
  宁夏: { name: '宁夏', lat: 38.49, lng: 106.23 },
  新疆: { name: '新疆', lat: 43.79, lng: 87.62 },
  香港: { name: '香港', lat: 22.32, lng: 114.17 },
  澳门: { name: '澳门', lat: 22.20, lng: 113.54 },
  台湾: { name: '台湾', lat: 25.03, lng: 121.57 }
};

/** 全称 → 简称兜底（后端已归一化，这里只是防御历史脏数据） */
const NAME_ALIASES: Record<string, string> = {
  内蒙古自治区: '内蒙古',
  广西壮族自治区: '广西',
  西藏自治区: '西藏',
  宁夏回族自治区: '宁夏',
  新疆维吾尔自治区: '新疆',
  香港特别行政区: '香港',
  '澳门特别行政区': '澳门',
  河北省: '河北',
  山西省: '山西',
  辽宁省: '辽宁',
  吉林省: '吉林',
  黑龙江省: '黑龙江',
  江苏省: '江苏',
  浙江省: '浙江',
  安徽省: '安徽',
  福建省: '福建',
  江西省: '江西',
  山东省: '山东',
  河南省: '河南',
  湖北省: '湖北',
  湖南省: '湖南',
  广东省: '广东',
  海南省: '海南',
  四川省: '四川',
  贵州省: '贵州',
  云南省: '云南',
  陕西省: '陕西',
  甘肃省: '甘肃',
  青海省: '青海',
  台湾省: '台湾'
};

/** 把后端返回的省份名归一化；无法识别（海外国名等）返回 null */
export const normalizeProvinceName = (raw: string): string | null => {
  const s = (raw || '').trim();
  if (!s) return null;
  if (PROVINCE_COORDS[s]) return s;
  if (NAME_ALIASES[s]) return NAME_ALIASES[s];
  const stripped = s.replace(/(壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区|省|市)$/u, '');
  if (PROVINCE_COORDS[stripped]) return stripped;
  return null;
};

/** 取坐标；识别不到返回 null（调用方归入「其他地区」列表，不上球） */
export const getProvinceCoord = (raw: string): ProvinceCoord | null => {
  const key = normalizeProvinceName(raw);
  return key ? PROVINCE_COORDS[key] : null;
};

/**
 * 地球默认朝向：让中国正面朝向镜头
 * 中国中心约 lng 105 / lat 36，球体绕 Y 轴旋转 (90 - lng) 可把该经度转到正面
 */
export const DEFAULT_GLOBE = {
  yawDeg: 90 - 105, // -15
  pitchDeg: -34
};

export default PROVINCE_COORDS;
