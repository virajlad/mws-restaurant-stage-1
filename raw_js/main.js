let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

navigator.serviceWorker.ready.then(function(swRegistration) {
  let message = {
    "type" : "dbUrl",
    "data" : DBHelper.DATABASE_URL
  };
  navigator.serviceWorker.controller.postMessage(message);
  return swRegistration.sync.register('syncFavoriteOutbox');
});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoidmlyYWpsYWQiLCJhIjoiY2ppemIyNTBuMDU3NDNwbW1kaDVrYW5kbiJ9.cHPtGiNQkbvMHkY4Nha0Tw',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

setImageNameSuffix = (url, suffix) => {
  let path = url.substr(0, url.lastIndexOf('.'));
  let ext = url.substr(url.lastIndexOf('.'));
  let newPath = path + suffix + ext;
  return newPath;
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  
  let defaultPath = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = setImageNameSuffix(defaultPath, '-300_small');
  image.setAttribute('alt','Picture of restaurant ' + restaurant.name);
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  let favoriteText = '♡';
  if (restaurant.is_favorite == 'true') {
    favoriteText = '♥';
  }

  const favorite = document.createElement('div');
  favorite.classList.add(`favorite-symbol`);
  favorite.setAttribute('data-restaurant', restaurant.id);
  favorite.innerHTML = `${favoriteText}`;
  li.append(favorite);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label','View details of ' + restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

function toggleRestaurantFavorite(element) {
  let favoriteDiv = element;
  
  if (favoriteDiv.innerHTML == '♡') {
    favoriteDiv.innerHTML = '♥';
  } else {
    favoriteDiv.innerHTML = '♡';
  }
}

window.onload = function() {
  let favoriteElements = document.getElementsByClassName("favorite-symbol");

  Array.from(favoriteElements).forEach(function(element){
    element.addEventListener('click', function(){
      // Create and call a function to write to outbox
      let restaurantId = Number(this.dataset.restaurant);
      let isFavorite = this.innerHTML == '♡' ? true : false;

      let favoriteData = {
        "restaurant_id": restaurantId,
        "isFavorite": isFavorite
      };

      let message = {
        "type" : "favorite",
        "data" : favoriteData
      };
      // Fire a sync event
      if (navigator.serviceWorker) {
        navigator.serviceWorker.ready.then(function(swRegistration) {
          navigator.serviceWorker.controller.postMessage(message);
          swRegistration.sync.register('syncFavoriteOutbox');
          return;
        });
      } else {
        putData(`${DBHelper.DATABASE_URL}`).then(data => alert(JSON.stringify(data)));
      }
      toggleRestaurantFavorite(this);
    });
  });
}

function postData(url = ``, data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: "PUT", // *GET, POST, PUT, DELETE, etc.
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

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
