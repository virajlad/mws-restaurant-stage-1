if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

navigator.serviceWorker.ready.then(function(swRegistration) {
  return swRegistration.sync.register('syncReviewsOutbox');
});

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

document.getElementById('submit-review-button').addEventListener('click', function(){
    if (getUrlParameter('restaurantId')) {
      let restaurantId = Number(getUrlParameter('restaurantId'));
      let userName = document.getElementById("username-input").value;
      let rating = Number(document.getElementById("rating-input").value);
      let review = document.getElementById("review-input").value;
      let createdAt = new Date().toISOString();
      
      let reviewData = {
        "restaurant_id": restaurantId,
        "name": userName,
        "rating": rating,
        "comments": review,
        "createdAt": createdAt,
        "updatedAt": createdAt
      };

      let message = {
        "targetUrl" : DBHelper.DATABASE_URL,
        "type" : "review",
        "data" : reviewData
      };

      if (navigator.serviceWorker) {
        navigator.serviceWorker.ready.then(function(swRegistration) {
          navigator.serviceWorker.controller.postMessage(message);
          swRegistration.sync.register('syncReviewsOutbox');
          window.location.href = `/restaurant.html?id=${restaurantId}`;
          return;
        });
      } else {
        postData(DBHelper.DATABASE_URL + `reviews/`, reviewData).then(data => alert(JSON.stringify(data)));
      }
      
    } else {
      alert('Something went wrong. Redirecting to home page');
      window.location.href = window.location.origin;
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