/* 한자어 탐정단 서비스워커: 온라인이면 최신 파일, 오프라인이면 저장해 둔 파일 */
const CACHE = 'hanja-tamjeong-v5-20261017';
const AUDIO_FILES = (() => { try { importScripts('audio/list.js'); return Object.values(self.AUDIO_LIST || {}).map(n => 'audio/' + n + '.mp3'); } catch (e) { return []; } })();
const FILES = ['./', 'index.html', 'style.css', 'data.js', 'app.js', 'lib/hanzi-writer.js', 'lib/open-in-chrome.js', 'audio/list.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png', 'hanzi/4E00.json', 'hanzi/4E03.json', 'hanzi/4E09.json', 'hanzi/4E5D.json', 'hanzi/4E66.json', 'hanzi/4E8C.json', 'hanzi/4E94.json', 'hanzi/516B.json', 'hanzi/516C.json', 'hanzi/516D.json', 'hanzi/51FA.json', 'hanzi/533B.json', 'hanzi/5341.json', 'hanzi/53E3.json', 'hanzi/56DB.json', 'hanzi/56ED.json', 'hanzi/56FE.json', 'hanzi/5728.json', 'hanzi/573A.json', 'hanzi/5802.json', 'hanzi/5B66.json', 'hanzi/5BA4.json', 'hanzi/5BB6.json', 'hanzi/5E02.json', 'hanzi/5E97.json', 'hanzi/6559.json', 'hanzi/6821.json', 'hanzi/884C.json', 'hanzi/94F6.json', 'hanzi/9662.json', 'hanzi/98DF.json', 'hanzi/9986.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.concat(AUDIO_FILES))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 글꼴(구글 폰트): 저장본 먼저, 없으면 받아서 저장
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // 게임 파일: 인터넷 먼저(최신본), 실패하면 저장본
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
});
