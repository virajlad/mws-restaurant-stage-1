var staticCacheName = 'restaurant-reviews-static-v1';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'css/',
        'data/',
        'img/',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-reviews') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

var cacheResponseAndReturn = function(response) {
  var clone = response.clone();

  return caches.open(staticCacheName).then(function(cache){
    cache.put(event.request.url, clone);
    return response;
  });
};

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  event.respondWith(
    fetch(event.request).then(function(response){
      if (response.status === 200) {
        var clone = response.clone();
        caches.open(staticCacheName).then(function(cache){
          cache.put(requestUrl, clone);
        });
        return response;
      } 
    }).catch(function(){
      return caches.match(event.request);
    }) 
  );
});