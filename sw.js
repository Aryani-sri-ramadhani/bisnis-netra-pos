// Menyimpan aplikasi di cache agar bisa dibuka tanpa internet.
var CACHE = "bisnisnetra-pos-v2";
var ASSETS = [
  "./","./index.html","./styles.css","./db.js","./utils.js","./screens.js",
  "./manifest.json","./xlsx.full.min.js","./icon-192.png","./icon-512.png"
];
self.addEventListener("install", function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })); self.skipWaiting(); });
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(function(cached){
    return cached || fetch(e.request).then(function(res){ return caches.open(CACHE).then(function(c){ try{ c.put(e.request, res.clone()); }catch(err){} return res; }); }).catch(function(){ return caches.match("./index.html"); });
  }));
});
