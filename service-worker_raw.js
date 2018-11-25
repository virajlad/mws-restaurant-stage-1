var staticCacheName = 'restaurant-reviews-static-v1';
var idb = require('idb');

let DBNAME = 'restaurant';
let OBJECT_STORE_NAME = 'restaurantStore';
let REVIEWS_OBJECT_STORE_NAME = 'reviewsStore';
let REVIEWS_OUTBOX_STORE = 'reviewsOutbox';
let FAVORITE_OUTBOX_STORE = 'favoriteOutbox';

var dbPromise = idb.open(DBNAME, 1, function (upgradeDB){
  var restaurantStore = upgradeDB.createObjectStore(OBJECT_STORE_NAME, {keyPath: 'id'});
  
  var reviewsStore = upgradeDB.createObjectStore(REVIEWS_OBJECT_STORE_NAME, {keyPath: 'id'});
  reviewsStore.createIndex("restaurant_id", "restaurant_id", { unique: false });

  let reviewsOutbox = upgradeDB.createObjectStore(REVIEWS_OUTBOX_STORE, { autoIncrement : true , keyPath: 'id'});
  reviewsOutbox.createIndex("restaurant_id", "restaurant_id", { unique: false });

  let favoriteOutbox = upgradeDB.createObjectStore(FAVORITE_OUTBOX_STORE, { keyPath : 'restaurant_id' });
});

self.addEventListener('message', function(event){

  let messageType = event.data.type;
  let targetUrl = event.data.targetUrl;
  let data = event.data.data;
  
  // 1. Write it into IDB
  switch (messageType) {
    case 'review' :
      data['toBeSynced'] = true;
      writeReviewToLocalDB(data);
      break;
    case 'favorite' :
      markRestaurantFavorite(data.restaurant_id, data.isFavorite);
  }
});

self.addEventListener('sync', function(event) {
  if (event.tag == 'syncReviewsOutbox') {
    event.waitUntil(syncReviews());
  }
});

function postData(url = ``, data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        // mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        // credentials: "same-origin", // include, same-origin, *omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response.json()); // parses response to JSON
}

function syncReviews() {
  return dbPromise.then(function(db) {
    let tx = db.transaction(REVIEWS_OUTBOX_STORE);
    let store = tx.objectStore(REVIEWS_OUTBOX_STORE);
    
    return store.getAll();
  }).then(function(reviews) {
    return Promise.all(reviews.map(function(review) {
      let localId = review.id;
      delete review['id'];
      return postData(`http://localhost:1337/reviews`, review).then(function(data) {
        if (Number(data.id)) {
          return dbPromise.then(function(db) {
            let tx = db.transaction(REVIEWS_OBJECT_STORE_NAME, 'readwrite');
            let store = tx.objectStore(REVIEWS_OBJECT_STORE_NAME);

            return store.put(data);
          }).then(function(){
            dbPromise.then(function(db){
              let txDel = db.transaction(REVIEWS_OUTBOX_STORE, 'readwrite');
              let storeDel = txDel.objectStore(REVIEWS_OUTBOX_STORE);
              return storeDel.delete(localId);
            });
          });
        } else {
          throw new Error('Error syncing local review');
        }
      })
    })
    ).catch(function(err) { console.error(err); })})
  }

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

function markRestaurantFavorite(restaurantId, isFavorite) {
  // Store request in IDB
  console.log('NOT IMPLEMENTED : Mark restaurant with id ' + restaurantId + ' as favorite ' + isFavorite);
}

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
  // let regexGetReviewsByRestaurantId = new RegExp('\/reviews\/\?restaurantId=[0-9]+$');
  
  if (regexGetAllRestaurants.test(relativePath)) {
    return getAllRestaurantsDataFromIDB();
  } else if (regexGetRestaurantById.test(relativePath)) {
    let regexId = /[0-9]+/;
    let id = Number(relativePath.match(regexId)[0]);
    return getRestaurantDataByIdFromIDB(id);
  } else if(relativePath.startsWith(`/reviews/?restaurant_id=`)) {
    let regexId = /\/?[0-9]+/;
    let id = Number(relativePath.match(regexId)[0]);
    return getReviewForRestaurantByRestaurantIdFromIDB(id);
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

function getReviewForRestaurantByRestaurantIdFromIDB(id) {
  return dbPromise.then(function(db) {
    let tx = db.transaction(REVIEWS_OBJECT_STORE_NAME);
    let store = tx.objectStore(REVIEWS_OBJECT_STORE_NAME);
    let restaurantIdIndex = store.index('restaurant_id');

    let txLocal = db.transaction(REVIEWS_OUTBOX_STORE);
    let storeLocal = txLocal.objectStore(REVIEWS_OUTBOX_STORE);
    let restaurantIdIndexLocal = storeLocal.index('restaurant_id');

    return Promise.all([restaurantIdIndex.getAll(id), restaurantIdIndexLocal.getAll(id)]).
      then(function(arrayOfArrays){
        let reviews = [].concat.apply([], arrayOfArrays);
        return reviews;
      });
  });
}


function putRestaurantDataInIDB(relativePath, data) {
  let regexGetAllRestaurants = new RegExp('\/restaurants\/*$');
  let regexGetRestaurantById = new RegExp('\/restaurants\/[0-9]+$');
  // let regexGetReviewsByRestaurantId = new RegExp('\/reviews\/\?restaurant_id=[0-9]+$');

  if (regexGetAllRestaurants.test(relativePath)) {
    putAllRestaurantsDataInIDB(data);
  } else if (regexGetRestaurantById.test(relativePath)) {
    let restaurantArray = [];
    restaurantArray.push(data);
    putAllRestaurantsDataInIDB(restaurantArray);
  } else if(relativePath.startsWith(`/reviews/?restaurant_id=`)) {
    putAllReviewsDataInIDB(data);
  }
}

function putAllRestaurantsDataInIDB(restaurants) {
  return dbPromise.then(function(db) {
    let tx = db.transaction(OBJECT_STORE_NAME,'readwrite');
    let store = tx.objectStore(OBJECT_STORE_NAME);

    restaurants.forEach(restaurant => store.put(restaurant));
  });
}

function putAllReviewsDataInIDB(reviews) {
  return dbPromise.then(function(db) {
    let tx = db.transaction(REVIEWS_OBJECT_STORE_NAME,'readwrite');
    let store = tx.objectStore(REVIEWS_OBJECT_STORE_NAME);
    
    reviews.forEach(review => store.put(review));
  });
}

function writeReviewToLocalDB(review) {
  return dbPromise.then(function(db) {
    let tx = db.transaction(REVIEWS_OUTBOX_STORE,'readwrite');
    let store = tx.objectStore(REVIEWS_OUTBOX_STORE);
    
    store.put(review);
  });
}

self.addEventListener('fetch', function(event) {
  let requestUrl = new URL(event.request.url);
  let isRestaurantDataUrl = requestUrl.pathname.startsWith(`/restaurants`);
  let isReviewsUrl = requestUrl.pathname.startsWith(`/reviews`);
  let isMapBoxUrl = requestUrl.pathname.includes(`unpkg.com`) || requestUrl.pathname.includes(`mapbox.streets`);

  event.respondWith(
    fetch(event.request).then(function(response){
        var clone = response.clone();
        
        if (isMapBoxUrl) {
          return response;
        }

        if (isRestaurantDataUrl || isReviewsUrl) {
          // Put data in IDB
          clone.json()
          .then(restaurantData => putRestaurantDataInIDB(requestUrl.pathname + requestUrl.search,restaurantData))
          .catch(error => console.log);
        } else {
          caches.open(staticCacheName).then(function(cache){
            cache.put(requestUrl, clone);
          });
        }
        
        return response;
    }).catch(function(){
      if (isMapBoxUrl) {
        return new Response();
      } else if (isRestaurantDataUrl || isReviewsUrl){
        if (event.request.method === 'POST') {
          // Submit review request. Write review to local IDB
          return writeReviewToLocalDB(event.request);
        } else {
          // Get data from IDB
          return getDataFromIDB(requestUrl.pathname + requestUrl.search).then(data => {
            return new Response(JSON.stringify(data));
          });
        }
      } else {
        return caches.match(event.request);
      }
    }) 
  );
});