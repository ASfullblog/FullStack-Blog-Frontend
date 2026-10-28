<script setup lang="ts">
/**
 * 3D 省份分布地球（three.js，纯程序化外观，不加载任何外网贴图 / GeoJSON）
 * - 球体渐变 + 经纬网格 + 大气辉光 + 数据柱点位，颜色全部取主题 CSS 变量
 * - 鼠标拖拽 / 单指触摸旋转（touch-action:none，拖地球不会顺带滚页面），带阻尼惯性
 * - 自动慢转：拖拽时暂停，松手惯性衰减完再恢复
 * - 点位 hover / tap → 轻量气泡「省份 + 人数」；背对镜头的点自动隐藏
 * - 滚轮不做缩放（避免劫持页面滚动），缩放用双指捏合或右上角按钮
 * - 卸载时 dispose geometry/material/texture + renderer.dispose() + 取消所有监听和 rAF
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { useThemeStore } from '../../stores/themeStore';
import { getProvinceCoord, DEFAULT_GLOBE } from './provinceCoords';
import type { GeoItem } from '../../api/stats';

const props = withDefaults(
  defineProps<{
    data?: GeoItem[];
    /** 球体默认朝向是否跟随中国（false 时正面 0 经线） */
    focusChina?: boolean;
  }>(),
  { data: () => [], focusChina: true }
);

const emit = defineEmits<{ (e: 'point-tap', item: GeoItem): void }>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const tooltip = ref<{ show: boolean; x: number; y: number; name: string; count: number }>({
  show: false,
  x: 0,
  y: 0,
  name: '',
  count: 0
});

const themeStore = useThemeStore();

/* ------------------------------------------------------------------ *
 * 运行时对象（shallowRef：three 对象不需要深层响应式代理）
 * ------------------------------------------------------------------ */
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let globeGroup: THREE.Group | null = null;
let markersGroup: THREE.Group | null = null;
let sphere: THREE.Mesh | null = null;
let atmosphere: THREE.Mesh | null = null;
let graticule: THREE.LineSegments | null = null;
let starField: THREE.Points | null = null;
let glowTexture: THREE.Texture | null = null;
const disposables: Array<{ dispose: () => void }> = [];

let rafId = 0;
let visible = true;
const clock = { last: 0 };

/* ------------------------------------------------------------------ *
 * 旋转状态
 * ------------------------------------------------------------------ */
const RADIUS = 1;
const state = {
  yaw: THREE.MathUtils.degToRad(DEFAULT_GLOBE.yawDeg),
  pitch: THREE.MathUtils.degToRad(DEFAULT_GLOBE.pitchDeg),
  yawVel: 0,
  pitchVel: 0,
  autoSpeed: 0.0022, // rad/frame ≈ 0.126°/帧，很慢，不晕
  dragging: false,
  pointerId: -1,
  lastX: 0,
  lastY: 0,
  moved: 0,
  zoom: 3.25,
  pinchStartDist: 0,
  pinchStartZoom: 0
};
const ZOOM_MIN = 1.9;
const ZOOM_MAX = 5.2;
const PITCH_LIMIT = THREE.MathUtils.degToRad(72);

const reduceMotion =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ *
 * 主题色读取
 * ------------------------------------------------------------------ */
const readVar = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const themeColors = () => ({
  top: readVar('--accent-secondary', '#764ba2'),
  bottom: readVar('--accent-color', '#667eea'),
  rim: readVar('--accent-color', '#667eea'),
  grid: readVar('--text-tertiary', '#9ca3af'),
  marker: readVar('--accent-color', '#667eea'),
  star: readVar('--text-secondary', '#6b7280'),
  bg: readVar('--card-bg', '#ffffff')
});

const applyTheme = () => {
  const c = themeColors();
  if (sphere) {
    const m = sphere.material as THREE.ShaderMaterial;
    m.uniforms.uTop.value = new THREE.Color(c.top);
    m.uniforms.uBottom.value = new THREE.Color(c.bottom);
    m.uniforms.uRim.value = new THREE.Color(c.rim);
  }
  if (atmosphere) {
    const m = atmosphere.material as THREE.ShaderMaterial;
    m.uniforms.uColor.value = new THREE.Color(c.rim);
  }
  if (graticule) {
    const m = graticule.material as THREE.LineBasicMaterial;
    m.color = new THREE.Color(c.grid);
  }
  if (starField) {
    const m = starField.material as THREE.PointsMaterial;
    m.color = new THREE.Color(c.star);
  }
  markersGroup?.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m && 'color' in m) m.color = new THREE.Color(c.marker);
    }
  });
};

/* ------------------------------------------------------------------ *
 * 程序化几何
 * ------------------------------------------------------------------ */

/** 辉光贴图：Canvas 径向渐变，纯本地生成（不用任何外部图片） */
const makeGlowTexture = (): THREE.Texture => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

/** 经纬网格（每 15°）→ LineSegments */
const buildGraticule = (radius: number): THREE.LineSegments => {
  const pts: number[] = [];
  const seg = 96;
  const push = (a: THREE.Vector3, b: THREE.Vector3) => {
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };
  const toVec = (latDeg: number, lngDeg: number) => {
    const la = THREE.MathUtils.degToRad(latDeg);
    const lo = THREE.MathUtils.degToRad(lngDeg);
    return new THREE.Vector3(
      radius * Math.cos(la) * Math.sin(lo),
      radius * Math.sin(la),
      radius * Math.cos(la) * Math.cos(lo)
    );
  };
  for (let lat = -75; lat <= 75; lat += 15) {
    let prev = toVec(lat, 0);
    for (let i = 1; i <= seg; i++) {
      const cur = toVec(lat, (360 * i) / seg);
      push(prev, cur);
      prev = cur;
    }
  }
  for (let lng = 0; lng < 360; lng += 15) {
    let prev = toVec(-88, lng);
    for (let la = -88 + 8; la <= 88; la += 8) {
      const cur = toVec(la, lng);
      push(prev, cur);
      prev = cur;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22, depthWrite: false });
  disposables.push(geo, mat);
  return new THREE.LineSegments(geo, mat);
};

/** 星空点（程序化随机分布在大球壳上） */
const buildStars = (): THREE.Points => {
  const n = 320;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const r = 7 + Math.random() * 5;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(t);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(t);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true
  });
  disposables.push(geo, mat);
  return new THREE.Points(geo, mat);
};

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vY;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vY = position.y;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/** 球体：纬度渐变 + 边缘辉光（无贴图） */
const FRAG_SPHERE = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vY;
  void main() {
    float t = clamp(vY * 0.5 + 0.5, 0.0, 1.0);
    vec3 base = mix(uBottom, uTop, smoothstep(0.05, 0.95, t));
    float rim = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 2.4);
    vec3 col = mix(base, uRim, rim * 0.55);
    // 面向镜头稍亮，背面压暗，做出体积感
    col *= 0.68 + 0.42 * clamp(dot(vNormal, vViewDir) * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(col, 0.96);
  }
`;

/** 大气：外扩球壳背面 + 加法混合 */
const FRAG_ATMO = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float f = pow(clamp(1.0 - dot(vNormal, vViewDir), 0.0, 1.0), uPower);
    gl_FragColor = vec4(uColor, f * 0.55);
  }
`;

/* ------------------------------------------------------------------ *
 * 点位（数据柱 + 端点 + 辉光）
 * ------------------------------------------------------------------ */
interface MarkerRef {
  mesh: THREE.Mesh;
  item: GeoItem;
  worldPos: THREE.Vector3;
  baseScale: number;
  phase: number;
}
let markerRefs: MarkerRef[] = [];
let dotGeo: THREE.SphereGeometry | null = null;
/** 每次重建点位都要释放上一轮的材质/几何，避免刷新数据时泄漏 */
let markerDisposables: Array<{ dispose: () => void }> = [];

const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();

const latLngToVec3 = (lat: number, lng: number, radius: number, out?: THREE.Vector3): THREE.Vector3 => {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lng);
  const v = out || new THREE.Vector3();
  return v.set(
    radius * Math.cos(la) * Math.sin(lo),
    radius * Math.sin(la),
    radius * Math.cos(la) * Math.cos(lo)
  );
};

const clearMarkers = () => {
  if (markersGroup) {
    for (const obj of [...markersGroup.children]) {
      markersGroup.remove(obj);
      const line = obj as THREE.Line;
      if (line.geometry) line.geometry.dispose();
    }
  }
  markerRefs = [];
  markerDisposables.forEach((d) => {
    try {
      d.dispose();
    } catch {
      /* noop */
    }
  });
  markerDisposables = [];
};

const buildMarkers = () => {
  if (!markersGroup || !dotGeo) return;
  clearMarkers();
  const list = (props.data || []).filter((d) => getProvinceCoord(d.province));
  if (!list.length) return;
  const max = Math.max(...list.map((d) => d.count), 1);
  const c = themeColors();
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.marker) });
  const pillarMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(c.marker),
    transparent: true,
    opacity: 0.5
  });
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture || undefined,
    color: new THREE.Color(c.marker),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  markerDisposables.push(dotMat, pillarMat, glowMat);

  // 同省重名合并（后端已 GROUP BY，这里纯防御）
  const merged = new Map<string, GeoItem>();
  for (const d of list) {
    const cur = merged.get(d.province);
    if (cur) cur.count += d.count;
    else merged.set(d.province, { ...d });
  }

  for (const item of merged.values()) {
    const coord = getProvinceCoord(item.province)!;
    const norm = Math.sqrt(item.count / max);
    const height = 0.035 + 0.26 * norm;
    const inner = latLngToVec3(coord.lat, coord.lng, RADIUS * 1.002, new THREE.Vector3());
    const outer = latLngToVec3(coord.lat, coord.lng, RADIUS * 1.002 + height, new THREE.Vector3());

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([inner.x, inner.y, inner.z, outer.x, outer.y, outer.z], 3)
    );
    const pillar = new THREE.Line(geo, pillarMat);
    pillar.frustumCulled = false;
    markersGroup.add(pillar);
    markerDisposables.push(geo);

    const r = 0.014 + 0.045 * norm;
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(outer);
    dot.scale.setScalar(r);
    markersGroup.add(dot);

    const glow = new THREE.Sprite(glowMat);
    glow.position.copy(outer);
    glow.scale.setScalar(r * 9);
    markersGroup.add(glow);

    const ringGeo = new THREE.RingGeometry(1.25, 1.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(c.marker),
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(outer);
    ring.scale.setScalar(r * 1.6);
    scratchB.copy(outer).normalize().multiplyScalar(4);
    ring.lookAt(scratchB);
    markersGroup.add(ring);
    markerDisposables.push(ringGeo, ringMat);

    markerRefs.push({
      mesh: dot,
      item,
      worldPos: new THREE.Vector3(),
      baseScale: r,
      phase: Math.random() * Math.PI * 2
    });
  }
};

/* ------------------------------------------------------------------ *
 * 交互
 * ------------------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered: MarkerRef | null = null;

const pickAt = (clientX: number, clientY: number): MarkerRef | null => {
  if (!camera || !markersGroup || !containerRef.value) return null;
  const rect = containerRef.value.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(ndc, camera);
  const meshes = markerRefs.map((m) => m.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) return null;
  const hitMesh = hits[0].object as THREE.Mesh;
  const found = markerRefs.find((m) => m.mesh === hitMesh) || null;
  // 背对镜头的点不响应
  if (found) {
    found.mesh.getWorldPosition(found.worldPos);
    const dir = found.worldPos.clone().normalize();
    const toCam = camera.position.clone().sub(found.worldPos).normalize();
    if (dir.dot(toCam) <= 0.08) return null;
  }
  return found;
};

const showTip = (m: MarkerRef, clientX: number, clientY: number) => {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return;
  tooltip.value = {
    show: true,
    x: Math.min(Math.max(clientX - rect.left + 12, 8), rect.width - 132),
    y: Math.max(clientY - rect.top - 40, 8),
    name: m.item.province,
    count: m.item.count
  };
};

const hideTip = () => {
  if (tooltip.value.show) tooltip.value = { ...tooltip.value, show: false };
};

const onPointerDown = (e: PointerEvent) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  state.dragging = true;
  state.pointerId = e.pointerId;
  state.lastX = e.clientX;
  state.lastY = e.clientY;
  state.moved = 0;
  state.yawVel = 0;
  state.pitchVel = 0;
  hideTip();
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
};

const onPointerMove = (e: PointerEvent) => {
  if (state.dragging && e.pointerId === state.pointerId) {
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.moved += Math.abs(dx) + Math.abs(dy);
    const k = 0.0055;
    state.yaw += dx * k;
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * k, -PITCH_LIMIT, PITCH_LIMIT);
    // 记录速度用于松手后的惯性衰减
    state.yawVel = state.yawVel * 0.6 + dx * k * 0.4;
    state.pitchVel = state.pitchVel * 0.6 + dy * k * 0.4;
    return;
  }
  if (e.pointerType === 'mouse') {
    const m = pickAt(e.clientX, e.clientY);
    hovered = m;
    if (m) showTip(m, e.clientX, e.clientY);
    else hideTip();
  }
};

const onPointerUp = (e: PointerEvent) => {
  if (!state.dragging || e.pointerId !== state.pointerId) return;
  state.dragging = false;
  state.pointerId = -1;
  // tap（几乎没移动）：点位气泡在移动端也要能出
  if (state.moved < 6) {
    const m = pickAt(e.clientX, e.clientY);
    if (m) {
      showTip(m, e.clientX, e.clientY);
      emit('point-tap', m.item);
      return;
    }
  }
  if (e.pointerType !== 'mouse') hideTip();
};

const onPointerLeave = () => {
  if (!state.dragging) hideTip();
  hovered = null;
};

const onWheelBlock = (e: WheelEvent) => {
  // 故意不拦截滚轮：鼠标滚轮照常滚页面，缩放只用双指捏合或右上角按钮
  void e;
};

const zoomBy = (factor: number) => {
  state.zoom = THREE.MathUtils.clamp(state.zoom * factor, ZOOM_MIN, ZOOM_MAX);
  if (camera) camera.position.z = state.zoom;
};

const onPinchStart = (e: TouchEvent) => {
  if (e.touches.length !== 2) return;
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  state.pinchStartDist = Math.hypot(dx, dy) || 1;
  state.pinchStartZoom = state.zoom;
};

const onPinchMove = (e: TouchEvent) => {
  if (e.touches.length !== 2 || !state.pinchStartDist) return;
  e.preventDefault(); // 双指捏合时禁止页面缩放/滚动；单指不拦截，保证地球外可正常滚页
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  const dist = Math.hypot(dx, dy) || 1;
  state.zoom = THREE.MathUtils.clamp(
    (state.pinchStartZoom * state.pinchStartDist) / dist,
    ZOOM_MIN,
    ZOOM_MAX
  );
  if (camera) camera.position.z = state.zoom;
};

const onPinchEnd = () => {
  state.pinchStartDist = 0;
};

/* ------------------------------------------------------------------ *
 * 主循环
 * ------------------------------------------------------------------ */
const tick = (now: number) => {
  rafId = requestAnimationFrame(tick);
  if (!renderer || !scene || !camera || !visible) return;
  const dt = Math.min(48, now - (clock.last || now));
  clock.last = now;
  const f = dt / 16.67; // 归一到 60fps

  if (!state.dragging) {
    const decay = 0.945;
    if (Math.abs(state.yawVel) > state.autoSpeed || Math.abs(state.pitchVel) > 0.0002) {
      // 惯性
      state.yaw += state.yawVel * f;
      state.pitch = THREE.MathUtils.clamp(state.pitch + state.pitchVel * f, -PITCH_LIMIT, PITCH_LIMIT);
      state.yawVel *= Math.pow(decay, f);
      state.pitchVel *= Math.pow(decay, f);
    } else {
      state.yawVel = 0;
      state.pitchVel = 0;
      if (!reduceMotion) state.yaw += state.autoSpeed * f; // 恢复自动慢转
    }
  }

  if (globeGroup) {
    globeGroup.rotation.order = 'YXZ';
    globeGroup.rotation.y = state.yaw;
    globeGroup.rotation.x = state.pitch;
  }

  // 点位呼吸 + 背面隐藏（用复用向量，避免每帧 new）
  scratchA.copy(camera.position).normalize();
  for (const m of markerRefs) {
    m.mesh.getWorldPosition(m.worldPos);
    const front = scratchB.copy(m.worldPos).normalize().dot(scratchA) > 0.02;
    m.mesh.visible = front;
    const pulse = hovered === m && front ? 1.5 : 1 + 0.08 * Math.sin(now * 0.0022 + m.phase);
    m.mesh.scale.setScalar(m.baseScale * pulse);
  }
  for (const child of markersGroup ? markersGroup.children : []) {
    if ((child as THREE.Sprite).isSprite || (child as THREE.Line).isLine) {
      child.getWorldPosition(scratchB);
      child.visible = scratchB.normalize().dot(scratchA) > -0.05;
    }
  }

  renderer.render(scene, camera);
};

/* ------------------------------------------------------------------ *
 * 初始化 / 释放
 * ------------------------------------------------------------------ */
let resizeObserver: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let offDocument: Array<() => void> = [];

const setup = () => {
  const canvas = canvasRef.value;
  const el = containerRef.value;
  if (!canvas || !el) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene = new THREE.Scene();
  const w = el.clientWidth || 600;
  const h = el.clientHeight || 420;
  renderer.setSize(w, h, false);

  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0, state.zoom);
  camera.lookAt(0, 0, 0);

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // 球体
  const sphereGeo = new THREE.SphereGeometry(RADIUS, 64, 48);
  const c = themeColors();
  const sphereMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG_SPHERE,
    transparent: true,
    uniforms: {
      uTop: { value: new THREE.Color(c.top) },
      uBottom: { value: new THREE.Color(c.bottom) },
      uRim: { value: new THREE.Color(c.rim) }
    }
  });
  disposables.push(sphereGeo, sphereMat);
  sphere = new THREE.Mesh(sphereGeo, sphereMat);
  globeGroup.add(sphere);

  // 大气
  const atmoGeo = new THREE.SphereGeometry(RADIUS * 1.14, 48, 32);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG_ATMO,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(c.rim) },
      uPower: { value: 2.2 }
    }
  });
  disposables.push(atmoGeo, atmoMat);
  atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
  scene.add(atmosphere);

  // 网格
  graticule = buildGraticule(RADIUS * 1.004);
  globeGroup.add(graticule);

  // 星空
  starField = buildStars();
  scene.add(starField);

  // 共享几何
  dotGeo = new THREE.SphereGeometry(1, 16, 12);
  disposables.push(dotGeo);
  markersGroup = new THREE.Group();
  globeGroup.add(markersGroup);

  glowTexture = makeGlowTexture();
  disposables.push(glowTexture);

  buildMarkers();
  applyTheme();

  // 事件
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('touchstart', onPinchStart, { passive: true });
  canvas.addEventListener('touchmove', onPinchMove, { passive: false });
  canvas.addEventListener('touchend', onPinchEnd);
  canvas.addEventListener('touchcancel', onPinchEnd);
  canvas.addEventListener('wheel', onWheelBlock, { passive: true });
  offDocument.push(() => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('touchstart', onPinchStart);
    canvas.removeEventListener('touchmove', onPinchMove);
    canvas.removeEventListener('touchend', onPinchEnd);
    canvas.removeEventListener('touchcancel', onPinchEnd);
    canvas.removeEventListener('wheel', onWheelBlock);
  });

  // 尺寸自适应
  const resize = () => {
    if (!renderer || !camera || !el) return;
    const nw = el.clientWidth;
    const nh = el.clientHeight;
    if (nw <= 0 || nh <= 0) return;
    renderer.setSize(nw, nh, false);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  };
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(el);
  resize();

  // 滚出视口就停 rAF（省电 + 移动端不掉帧）
  io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((x) => x.isIntersecting);
    },
    { threshold: 0.02 }
  );
  io.observe(el);

  rafId = requestAnimationFrame(tick);
};

const teardown = () => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  offDocument.forEach((fn) => fn());
  offDocument = [];
  resizeObserver?.disconnect();
  resizeObserver = null;
  io?.disconnect();
  io = null;

  clearMarkers();
  dotGeo = null;

  if (scene) {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as any).material;
      if (mat) {
        const arr = Array.isArray(mat) ? mat : [mat];
        for (const m of arr) {
          if ((m as any).map) (m as any).map.dispose?.();
          m.dispose?.();
        }
      }
    });
    scene.clear();
  }
  disposables.forEach((d) => {
    try {
      d.dispose();
    } catch {
      /* noop */
    }
  });
  disposables.length = 0;
  glowTexture = null;
  sphere = null;
  atmosphere = null;
  graticule = null;
  starField = null;
  markersGroup = null;
  globeGroup = null;
  scene = null;
  camera = null;
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer = null;
  }
  hovered = null;
  hideTip();
};

watch(
  () => props.data,
  () => {
    buildMarkers();
    applyTheme();
  },
  { deep: false }
);

watch(() => themeStore.currentTheme, applyTheme);

onMounted(setup);
onBeforeUnmount(teardown);

defineExpose({ zoomBy, resetView: () => {
  state.yaw = THREE.MathUtils.degToRad(props.focusChina ? DEFAULT_GLOBE.yawDeg : 0);
  state.pitch = THREE.MathUtils.degToRad(props.focusChina ? DEFAULT_GLOBE.pitchDeg : 0);
  state.yawVel = 0;
  state.pitchVel = 0;
  zoomBy(1);
} });
</script>

<template>
  <div ref="containerRef" class="globe-wrap">
    <canvas ref="canvasRef" class="globe-canvas" />
    <div class="globe-tools" @pointerdown.stop>
      <button class="tool-btn" type="button" title="放大" @click="zoomBy(0.86)">＋</button>
      <button class="tool-btn" type="button" title="缩小" @click="zoomBy(1.16)">－</button>
      <button class="tool-btn wide" type="button" title="回到中国视角" @click="resetView()">复位</button>
    </div>
    <transition name="tip-fade">
      <div v-if="tooltip.show" class="globe-tip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <span class="tip-name">{{ tooltip.name }}</span>
        <span class="tip-sep">：</span>
        <span class="tip-count">{{ tooltip.count }} 人</span>
      </div>
    </transition>
    <p class="globe-hint">拖拽旋转 · 双指缩放 · 点击点位看人数</p>
  </div>
</template>

<style scoped>
.globe-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.globe-canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* 关键：单指拖地球时不带动页面滚动；地球区域外滚动完全不受影响 */
  touch-action: none;
  cursor: grab;
}

.globe-canvas:active {
  cursor: grabbing;
}

.globe-tools {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  z-index: 2;
}

.tool-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
  background: var(--card-bg, #fff);
  color: var(--text-secondary, #6b7280);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn.wide {
  font-size: 12px;
}

.tool-btn:hover {
  color: var(--accent-color, #667eea);
  border-color: var(--accent-color, #667eea);
  transform: translateY(-1px);
}

.globe-tip {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--bg-secondary, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  box-shadow: 0 4px 14px var(--shadow-color, rgba(0, 0, 0, 0.12));
  font-size: 13px;
  color: var(--text-primary, #1f2937);
  pointer-events: none;
  white-space: nowrap;
}

.tip-name {
  font-weight: 600;
}

.tip-count {
  color: var(--accent-color, #667eea);
  font-variant-numeric: tabular-nums;
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.18s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
}

.globe-hint {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
  pointer-events: none;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .globe-tools {
    top: 8px;
    right: 8px;
  }

  .globe-hint {
    font-size: 11px;
  }
}
</style>
