// 导入 Workbox CDN（无需本地安装依赖）
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.0/workbox-sw.js');

// 缓存版本号（更新项目时修改此数字即可刷新缓存）
const CACHE_VERSION = 'v20250228';
const CACHE_PREFIX = 'data-skills-pro';

// Workbox 初始化
workbox.setConfig({ debug: false });
workbox.core.setCacheNameDetails({
  prefix: CACHE_PREFIX,
  suffix: CACHE_VERSION,
});

// 缓存清理：旧版本自动删除
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// ==========================================
// 1. 预缓存：静态资源（首次加载自动缓存）
// ==========================================
workbox.precaching.precacheAndRoute([
  { url: '/', revision: CACHE_VERSION },
  { url: '/index.html', revision: CACHE_VERSION },
  { url: '/dataSkills_pro_v2_full.html', revision: CACHE_VERSION },
  { url: '/manifest.json', revision: CACHE_VERSION },
]);

// ==========================================
// 2. 缓存策略：CSS / JS / 图片
// ==========================================
// JS/CSS 缓存：缓存优先
workbox.routing.registerRoute(
  /\.(js|css)$/,
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
      }),
    ],
  })
);

// 图片缓存：缓存优先
workbox.routing.registerRoute(
  /\.(png|jpg|jpeg|svg|gif|ico)$/,
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 90 * 24 * 60 * 60,
      }),
    ],
  })
);

// ==========================================
// 3. 题库/API 数据缓存：离线可用
// ==========================================
workbox.routing.registerRoute(
  ({ url }) => url.pathname.includes('/api/') || url.pathname.includes('/questions/'),
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_PREFIX}-data-${CACHE_VERSION}`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 90 * 24 * 60 * 60,
      }),
    ],
  })
);

// ==========================================
// 4. 离线 fallback：断网时显示离线页面
// ==========================================
workbox.routing.setDefaultHandler(
  new workbox.strategies.NetworkOnly()
);

workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.mode === 'navigate') {
    return caches.match('/index.html');
  }
  return Response.error();
});
