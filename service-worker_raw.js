var staticCacheName = 'restaurant-reviews-static-v1';
var idb = require('idb');

let DBNAME = 'restaurant';
let OBJECT_STORE_NAME = 'restaurantStore';

var dbPromise = idb.open(DBNAME, 1, function (upgradeDB){
  var restaurantStore = upgradeDB.createObjectStore(OBJECT_STORE_NAME, {keyPath: 'id'});
});

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

function getDataFromIDB(relativePath) {
  let regexGetAllRestaurants = new RegExp('\/restaurants\/*$');
  let regexGetRestaurantById = new RegExp('\/restaurants\/[0-9]+$');
  
  if (regexGetAllRestaurants.test(relativePath)) {
    return getAllRestaurantsDataFromIDB();
  } else if (regexGetRestaurantById.test(relativePath)) {
    let regexId = /[0-9]+/;
    let id = Number(relativePath.match(regexId)[0]);
    return getRestaurantDataByIdFromIDB(id);
  }
}

function getAllRestaurantsDataFromIDB() {
  return dbPromise.then(function(db) {
    let tx = db.transaction(OBJECT_STORE_NAME);
    let store = tx.objectStore(OBJECT_STORE_NAME);
    
    return store.getAll();
  });
}

function getRestaurantDataByIdFromIDB(id) {
  return dbPromise.then(function(db) {
    let tx = db.transaction(OBJECT_STORE_NAME);
    let store = tx.objectStore(OBJECT_STORE_NAME);
    
    return store.get(id);
  });
}


function putRestaurantDataInIDB(relativePath, data) {
  let regexGetAllRestaurants = new RegExp('\/restaurants\/*$');
  let regexGetRestaurantById = new RegExp('\/restaurants\/[0-9]+$');
  
  if (regexGetAllRestaurants.test(relativePath)) {
    putAllRestaurantsDataInIDB(data);
  } else if (regexGetRestaurantById.test(relativePath)) {
    let restaurantArray = [];
    restaurantArray.push(data);
    putAllRestaurantsDataInIDB(restaurantArray);
  }
}

function putAllRestaurantsDataInIDB(restaurants) {
  return dbPromise.then(function(db) {
    let tx = db.transaction(OBJECT_STORE_NAME,'readwrite');
    let store = tx.objectStore(OBJECT_STORE_NAME);
    
    restaurants.forEach(restaurant => store.put(restaurant));
  });
}

self.addEventListener('fetch', function(event) {
  let requestUrl = new URL(event.request.url);
  let isRestaurantDataUrl = requestUrl.pathname.startsWith(`/restaurants`);
  let isMapBoxUrl = requestUrl.pathname.includes(`leaflet@`) || requestUrl.pathname.includes(`mapbox.streets`);

  event.respondWith(
    fetch(event.request).then(function(response){
        var clone = response.clone();
        
        if (!isRestaurantDataUrl && !isMapBoxUrl) {
          caches.open(staticCacheName).then(function(cache){
            cache.put(requestUrl, clone);
          });
        } else {
          // Put restaurant data in IDB
          clone.json().then(restaurantData => putRestaurantDataInIDB(requestUrl.pathname,restaurantData));
        }
        return response;
    }).catch(function(){
      if (!isRestaurantDataUrl) {
        return caches.match(event.request);
      } else {
        // Get data from IDB
        var resp = new Response(getDataFromIDB(requestUrl.pathname));
        return resp;
      }
    }) 
  );
});