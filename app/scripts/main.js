'use strict';

// don't bother me with name format of different properties of APIs
/*jshint camelcase: false */

var mai = {};   // object to isolate my code from global scope

// so jshint doesn't complain of undefined variables
var Offline = Offline || {},
    ko = ko || {},
    google = google || {},
    Awesomplete = Awesomplete || {};

$(function () {

  // if Google API loaded initialize map
  if (window.google) {
    mai.initializeMap();
  }

  // otherwise notify user of bad connection
  else {
    mai.showMessage('Lost connection to server.');
  }

  // load weather data
  mai.loadWeather(mai.neighborhood.lat + ',' + mai.neighborhood.lng);
});

/**
  @desc use Offline.js library to notify user when connection goes down
**/
Offline.on('down', function () {
  mai.showMessage('Lost connection to server.');
});

/**
  @desc checks connection to server by asynchronously requesting favicon.ico
  file with random suffix (to overcome browser's caching). If request fails
  lets user know of bad connection.
  @param both optional, function fn is executed with arguments arg if provided and
  above mentioned request succeeded.
**/
mai.execIfConnectedToServer = function (arg, fn) {

  // take care of vendor prefixes
  window.URL = window.URL || window.webkitURL;

  // append file name with random number to not get cached version
  var xhrurl = '/favicon.ico?_=' + (Math.floor(Math.random() * 1000000000));

  // setup HTTP request
  mai.xhr = new XMLHttpRequest();
  mai.xhr.open('HEAD', xhrurl, true);

  mai.xhr.onload = function () {
    // check arguments and execute if valid
    if (fn !== undefined && typeof fn === 'function') {
      fn(arg);
    }
  };

  mai.xhr.onerror = function () {
    mai.showMessage('Lost connection to server.');
  };

  // send request
  mai.xhr.send();
};

/**
  @desc shows message to user.
  @param string messageType - used to select message to be shown
**/
mai.showMessage = function (messageType) {

  // stop animation of loading/waiting process in infowindow
  mai.vm.loadingGallery(false);
  mai.vm.streetViewLoading(false);

  // clear message body before appending new content
  mai.vm.errMsg.paragraphs.removeAll();

  // depending on messageType create header and paragraphs of new message
  switch(messageType) {
    case 'Lost connection to server.':
      mai.vm.errMsg.header('Bad connection.');
      mai.vm.errMsg.paragraphs.push('It looks like there is no, or bad Internet connection.');
      mai.vm.errMsg.paragraphs.push('Some features of the app may still work, but to experience ' +
        'it to the fullest you will need a reliable Internet connection.');
      break;

    case 'Image error.':
      mai.vm.errMsg.header(messageType);
      mai.vm.errMsg.paragraphs.push('Unfortunately previous image failed to load. ' +
        'It may be due to bad or no Internet connection.');
      mai.vm.errMsg.paragraphs.push('When issue is fixed please re-open gallery to see all the images.');
      break;

    case 'Last image error.':
      var place = (mai.vm.selectedPlace.name() === '' ? 'selected place. ' : mai.vm.selectedPlace.name() + '. ');
      mai.vm.errMsg.header('Image error.');
      mai.vm.errMsg.paragraphs.push('Unfortunately all images failed to load for ' + place + '.');
      mai.vm.errMsg.paragraphs.push('It may be due to bad or no Internet connection.');
      break;

    case 'Street View error.':
      mai.vm.errMsg.header(messageType);
      mai.vm.errMsg.paragraphs.push('Street View data not found for this location at this moment.');
      break;

    case 'Street View image failed.':
      mai.vm.errMsg.header(messageType);
      mai.vm.errMsg.paragraphs.push('Request to retrieve street view image for ' + mai.vm.selectedPlace.name() +
        ' failed. It may be caused by bad Internet connection.');
      break;

    case 'Place details error.':
      mai.vm.errMsg.header(messageType);
      mai.vm.errMsg.paragraphs.push('Failed to get details for ' + mai.vm.selectedPlace.name() +
        '. Make sure your Internet link is up and try again.');
      mai.vm.errMsg.paragraphs.push('Report the issue if it persists.');
      break;

    case 'Instagram API error.':
      mai.vm.errMsg.header('Instagram error.');
      mai.vm.errMsg.paragraphs.push('Failed to retrieve images for ' + mai.vm.selectedPlace.name() +
        ' from Instagram. Sorry for this mishap. Make sure you are connected to the Internet and try again.');
      mai.vm.errMsg.paragraphs.push('Report the issue if it persists.');
      break;

    case 'Instagram 0 results.':
      mai.vm.errMsg.header('Instagram error.');
      mai.vm.errMsg.paragraphs.push('Could not find any available images for ' + mai.vm.selectedPlace.name() +
        ' on Instagram.');
      break;

    case 'Flickr API error.':
      mai.vm.errMsg.header('Flickr error.');
      mai.vm.errMsg.paragraphs.push('Failed to retrieve images for ' + mai.vm.selectedPlace.name() +
        ' from Flickr. Sorry for this mishap. Make sure you are connected to the Internet and try again.');
      mai.vm.errMsg.paragraphs.push('Report the issue if it persists.');
      break;

    case 'Flickr 0 results.':
      mai.vm.errMsg.header('Flickr error.');
      mai.vm.errMsg.paragraphs.push('Could not find any recent available images for ' + mai.vm.selectedPlace.name() +
        ' on Flickr.');
      break;

    case 'No geometry.':
      mai.vm.errMsg.header('Search error.');
      mai.vm.errMsg.paragraphs.push('Please select a place from the list of suggestions and make sure you are connected to the Internet.');
      break;

    case 'Geolocation 0 results.':
      mai.vm.errMsg.header('Geolocation service failed');
      mai.vm.errMsg.paragraphs.push('We were unable to find you on Earth (:');
      break;

    case 'Geolocation error.':
      mai.vm.errMsg.header('Geolocation service failed');
      mai.vm.errMsg.paragraphs.push('The were no result returned from your request. ' +
        'We apologize for inconvenience. PLease try again later.');
      mai.vm.errMsg.paragraphs.push('Report the issue if it persists.');
      break;

    case 'Geolocation failed.':
      mai.vm.errMsg.header('Geolocation service failed');
      mai.vm.errMsg.paragraphs.push('We couldn\'t determine your precise location.');
      mai.vm.errMsg.paragraphs.push('It could be that the location services are turned off ' +
      'on your device, or it may be a permission issue. To help you solve the problem, here are short Google ' +
      'docs on the issue:');
      mai.vm.errMsg.paragraphs.push('<a class="btn btn-success" role="button" href="https://support.google.com/gmm/answer/1250066?p=ml_location_help&hl=en&rd=1" ' +
      'target="location_docs">Mobile browser</a>' +
      '<a class="btn btn-success" role="button" href="https://support.google.com/maps/answer/152197?hl=en" target="location_docs">Desktop browser</a>');
      break;

    case 'No geolocation support.':
      mai.vm.errMsg.header('The Geolocation service failed.');
      mai.vm.errMsg.paragraphs.push('Unfortunately your browser doesn\'t support geolocation.');
      mai.vm.errMsg.paragraphs.push('Any modern browser will most likely solve this issue.');
      break;

    case 'Weather err.':
      mai.vm.errMsg.header('The Weather service failed.');
      mai.vm.errMsg.paragraphs.push('There was an error retrieving the latest weather information. ' +
        'Most likely due to absent data for current location');
      mai.vm.errMsg.paragraphs.push('Hopefully this mishap will not spoil your experience here.');
      break;

    default:
      mai.vm.errMsg.header('Something went wrong. Please try again.');
      break;
  }

  // finally display the message
  mai.vm.displayErrMsg(true);
};

/**
  @desc object to store information about preselected points of interest,
  its keys are place names, values - place coordinates, Google place ID and
  place category.
**/
mai.places = {
  'Intrepid Sea, Air & Space Museum': {
    lat: 40.764527,
    lng: -73.999608,
    googlePid: 'ChIJnxlg1U5YwokR8T90UrZiIwI',
    category: 'Attractions',
  },

  'Madame Tussauds': {
    lat: 40.756463,
    lng: -73.988859,
    googlePid: 'ChIJ8VOfr1RYwokRhil9_pcMKuc',
    category: 'Attractions'
  },

  'The Museum of Modern Art': {
    lat: 40.761433,
    lng: -73.977622,
    googlePid: 'ChIJKxDbe_lYwokRVf__s8CPn-o',
    category: 'Attractions'
  },

  'The Plaza Hotel': {
    lat: 40.764469,
    lng: -73.974488,
    googlePid: 'ChIJYaVdffBYwokRnTOoCzCq9mE',
    category: 'Hotels'
  },

  'Hotel Pennsylvania': {
    lat: 40.7500064,
    lng: -73.9909531,
    googlePid: 'ChIJWbSN8q5ZwokRpLN00upxy8g',
    category: 'Hotels'
  },

  'Four Seasons Hotel New York': {
    lat: 40.762327,
    lng: -73.971282,
    googlePid: 'ChIJ68J3tfpYwokR2HaRoBcB4xg',
    category: 'Hotels'
  },

  '414 Hotel': {
    lat: 40.761273,
    lng: -73.991744,
    googlePid: 'ChIJhwBD1VNYwokR7eKcshuz914',
    category: 'Hotels'
  },

  'The High Line Hotel': {
    lat: 40.745996,
    lng: -74.005002,
    googlePid: 'ChIJ-1XDX7hZwokRHLjn63mDetU',
    category: 'Hotels'
  },

  'United Nations Headquarters': {
    lat: 40.748876,
    lng: -73.968009,
    googlePid: 'ChIJEU2H4BxZwokRNfY93Yvi-sU',
    category: 'Attractions'
  },

  'Empire State Building Observation Deck': {
    lat: 40.74844,
    lng: -73.985664,
    googlePid: 'ChIJEwxwq6lZwokRnYSTMiceJsE',
    category: 'Attractions'
  },

  'Flatiron Building': {
    lat: 40.74106,
    lng: -73.989699,
    googlePid: 'ChIJZx8c96NZwokRJklw7SVhKt4',
    category: 'Attractions'
  },

  'Chrysler Building': {
    lat: 40.751621,
    lng: -73.975502,
    googlePid: 'ChIJeWPFRwJZwokRGD60OOo74RU',
    category: 'Attractions'
  },

  'Rockefeller Center': {
    lat: 40.75874,
    lng: -73.978674,
    googlePid: 'ChIJ9U1mz_5YwokRosza1aAk0jM',
    category: 'Attractions'
  },

  'Radio City Music Hall': {
    lat: 40.759976,
    lng: -73.979977,
    googlePid: 'ChIJPS8b1vhYwokRldqq2YHmxJI',
    category: 'Attractions'
  },

  'Central Park Zoo': {
    lat: 40.767778,
    lng: -73.971834,
    googlePid: 'ChIJaWjW_PFYwokRFD8a2YQu12U',
    category: 'Attractions'
  },

  'New York Public Library': {
    lat: 40.753182,
    lng: -73.982253,
    googlePid: 'ChIJqaiomQBZwokRTHOaUG7fUTs',
    category: 'Attractions'
  },

  'St. Patrick\'s Cathedral': {
    lat: 40.758465,
    lng: -73.975993,
    googlePid: 'ChIJUW4vEPxYwokRW6o24DU0YIg',
    category: 'Attractions'
  },

  'Madison Square Park': {
    lat: 40.742037,
    lng: -73.987564,
    googlePid: 'ChIJp32RvaZZwokRfH0Zgzl9mXk',
    category: 'Attractions'
  },

  'Bryant Park': {
    lat: 40.753596,
    lng: -73.983233,
    googlePid: 'ChIJvbGg56pZwokRp_E3JbivnLQ',
    category: 'Attractions'
  },

  'Grand Central Terminal': {
    lat: 40.752726,
    lng: -73.977229,
    googlePid: 'ChIJhRwB-yFawokRi0AhGH87UTc',
    category: 'Travel'
  },

  'Port Authority Bus Terminal': {
    lat: 40.756974,
    lng: -73.990499,
    googlePid: 'ChIJxSvNNFNYwokRjrN1HB74O28',
    category: 'Travel'
  }
};

// name and coordinates of initial map location
mai.neighborhood = {
  name: 'Midtown, New Yourk, NY, USA',
  lat: 40.7504877,
  lng: -73.9839238
};

// array of used place categories
mai.poisCategories = ['Attractions', 'Hotels', 'Travel'];

// quasi-globals to use with Google maps
mai.bounds = null;
mai.infowindow = null;
mai.map = null;
mai.panorama = null;
mai.xhr = null;

/**
  @desc create map for the neighborhood with custom options, add auto-complete input field and
  attach event listener to it to allow user to search Google's database of places and addresses
  and then get Instagram and Flicker images for selected location. Add custom controls to reset
  map to its initial position, and to use geo-location service. Get map's default street view
  panorama to use it later for user requests. Also creates info-window and calls functions to
  create markers and drop them on map.
**/
mai.initializeMap = function () {
  // point of google.maps.LatLng class to serve os map's center
  var location = new google.maps.LatLng(mai.neighborhood.lat, mai.neighborhood.lng),

    mapOptions = {
      disableDefaultUI: true,
      mapTypeControl: true,
      center: location,
      minZoom: 2,
      zoom: 14,
      mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
      }
    },

    // create element to store geo-location and reset buttons
    mapButtons,
    mapButtonsDiv = document.createElement('div'),

    // set up places auto-complete input
    input = document.getElementById('pac-input'),
    autocomplete = new google.maps.places.Autocomplete(input);

  // create map with its options
  mai.map = new google.maps.Map(document.querySelector('#map-canvas'), mapOptions);

  // bias auto-complete results to current map bounds
  autocomplete.bindTo('bounds', mai.map);

  // retrieve map's default StreetView
  mai.panorama = mai.map.getStreetView();

  // set map bounds
  mai.bounds = new google.maps.LatLngBounds(location);

  // add CSS class for custom map buttons and attach them to the map
  mapButtonsDiv.setAttribute('class', 'map-btns');
  mapButtonsDiv.index = 1;
  mapButtons = new mai.CustomMapControls(mapButtonsDiv, mai.map);

  // position custom controls and input for Google places search on the map
  mai.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(mapButtonsDiv);
  mai.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // initialize info-window
  mai.infowindow = new google.maps.InfoWindow({
    maxWidth: 260
  });

  // create markers for places and fit them into map's bounds
  mai.createMarkers();
  mai.map.fitBounds(mai.bounds);

  // This event is fired when the div containing the InfoWindow's content is attached to the DOM
  google.maps.event.addListener(mai.infowindow, 'domready', function () {

    /*
      looks like bindings are destructed each time info-window is closed since we clear its content,
      thus we need to apply bindings each time after we update info-window's content.
    */
    ko.applyBindings(mai.vm, $('.infowindow-container')[0]);

    // after in was loaded remove URL object we created before for place's street view image
    $('.gm-style-iw .img-responsive').load(function () {
      window.URL.revokeObjectURL(this.src);
    });
  });

  /*
    @desc this event fires when results are available for a Place the user has selected. If request
    fails, message is displayed to user, otherwise we try to populate map with place's data, like
    current weather conditions, street view panorama and image gallery
  */
  google.maps.event.addListener(autocomplete, 'place_changed', function () {

    mai.closeIw();

    // clear previous iw content so it doesn't show while new one is created when iw opens
    mai.infowindow.setContent('');

    // create object with PlaceSearch results
    var place = autocomplete.getPlace();

    // result of failed request has only place name, let user know and stop
    if (!place.geometry) {

      mai.showMessage('No geometry.');

      return;
    }

    var pos = place.geometry.location,
        userPosition = pos.A + ',' + pos.F;     // this format is required bu loadWeather function

    // open info-window with partial place data while the rest is via request to Google
    mai.vm.selectedPlace.name(place.name);
    mai.infowindow.setContent($('.iw-part').html());
    mai.infowindow.setPosition(pos);
    mai.infowindow.open(mai.map);

    // try to get street view image for places coordinates
    mai.getStreetViewImg(pos);

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {

      mai.map.fitBounds(place.geometry.viewport);

    // otherwise center map to place and set nice zoom
    } else {
      mai.map.setCenter(pos);
      mai.map.setZoom(17);
    }

    // updates iw content and opens it
    mai.createInfoWindowContent(place, place.name);

    // get weather conditions for around selected place
    mai.loadWeather(userPosition);
  });

  /*
    @desc when map is clicked we close iw and remove reference to blob we created
    for streetview image from DOM, otherwise browser complains when iw is closed
    and it can't load image since we deleted its URL object after it has loaded;
    close any messages, de-select any selected place and hide weather forecast.
  */
  google.maps.event.addListener(mai.map, 'click', function (){
    mai.closeIw();
    mai.vm.selectedPlace.name('');
    mai.vm.closeErrMsg();
    mai.vm.forecastVisible(false);
  });

};

/**
  @desc data to display in info-window for current place: either one on mai.places,
  or user location, or a result of user search.
  @param object place containing details of a place and optional string placeName
**/
mai.createInfoWindowContent = function (place, placeName) {

  // define variables, containing place data, based on available function parameters
  var phone = place.formatted_phone_number ? place.formatted_phone_number : '',
      phoneHref = 'tel: ' + phone,
      ratings = place.rating ? mai.ratingStars(place.rating) : '',
      marker = mai.places[placeName] ? mai.places[placeName].marker : null,
      address = '';

  // if places has formatted address present it
  if (place.formatted_address) {
    address = place.formatted_address;

  // otherwise construct address by pieces
  } else if (place.address_components) {
    address = [
    (place.address_components[0] && place.address_components[0].short_name || ''),
    (place.address_components[1] && place.address_components[1].short_name || ''),
    (place.address_components[2] && place.address_components[2].short_name || '')
    ].join(' ');
  }

  // if no placeName parameter were passed switch name and address to make it look nice in info-window
  if (!placeName) {
    placeName = address;
    address = '';
  }

  // update place's data in ViewModel
  mai.vm.selectedPlace.name(placeName);
  mai.vm.selectedPlace.address(address);
  mai.vm.selectedPlace.phone(phone);
  mai.vm.selectedPlace.phoneHref(phoneHref);
  mai.vm.selectedPlace.website(place.website);
  mai.vm.selectedPlace.gplus(place.url);
  mai.vm.selectedPlace.rating(ratings);

  mai.infowindow.setContent($('.info-window').html());

  // to fit infowindow into map, inspired by http://stackoverflow.com/questions/16429004/auto-pan-map-to-fit-infowindow-after-loading-with-content-from-ajax
  if (marker) {
    mai.infowindow.open(mai.map, marker);
  } else {
    mai.infowindow.open(mai.map);
  }
};

/**
  @desc create custom markers for places, based on categories and try to
  drop those markers on map with slight delay to make the process look nice
**/
mai.createMarkers = function () {

  // used to set interval for dropping markers
  var iterator = 1;

  // iterate through place names in mai.places object
  Object.keys(mai.places).forEach(function (poi) {

    // create custom marker for each place with category-related icons
    var markerPos = new google.maps.LatLng(mai.places[poi].lat, mai.places[poi].lng),
        markerIcon = 'images/' + mai.places[poi].category + '.png',
        marker = new google.maps.Marker({
          title: poi,
          draggable: false,
          position: markerPos,
          icon: markerIcon
        });

    // animate markers on click and show info-window
    google.maps.event.addListener(marker, 'click', function () {

      mai.vm.selectPlace(this.title);

    });

    // fit all markers into map
    mai.bounds.extend(new google.maps.LatLng(markerPos.lat(), markerPos.lng()));

    // start dropping markers every fifth of a second
    window.setTimeout(mai.dropMarker, iterator++ * 200, marker);

    // add marker info to place object
    mai.places[poi].marker = marker;
  });
};

/**
  @desc drop marker on map with animation, and populate droppedMarkers array
  to start showing place names in the list for places which markers were already dropped;
  when that array contains all markers, filtering input field will be enabled
**/
mai.dropMarker = function (marker) {
  marker.setAnimation(google.maps.Animation.DROP);
  marker.setMap(mai.map);
  mai.vm.droppedMarkers.push(marker.title);
};

/**
  @desc trying to get street view image for currently selected place by sending
  HTTP request to GoogleAPI; on error display message to the user.
  @param string location - place's coordinates separated by coma.
**/
mai.getStreetViewImg = function (location) {

  // construct link to get street view image from Google
  var streetViewImg = 'https://maps.googleapis.com/maps/api/streetview?size=260x80&location=' + location + '&fov=120';

  // take care of vendor prefixes.
  window.URL = window.URL || window.webkitURL;

  // build request and set its response type
  mai.xhr = new XMLHttpRequest();
  mai.xhr.open('GET', streetViewImg + '&_=' + (Math.floor(Math.random() * 1000000000)), true);
  mai.xhr.responseType = 'blob';

  mai.xhr.onload = function () {
    if (this.status === 200) {

      // create URL object with returned image data and set place's photo ViewModel to it
      var blob = this.response;
      mai.vm.selectedPlace.photo(window.URL.createObjectURL(blob));

    // on any other response from Google besides 'OK' display warning to user
    } else {
      mai.showMessage('Street View image failed.');
    }
  };

  // request failed - notify user
  mai.xhr.onerror = function () {
    mai.showMessage('Street View image failed.');
  };

  mai.xhr.send();
};

/**
  @desc get place details from Google service
  @param string placeName
**/
mai.getGooglePlaceDetails = function (placeName) {

  var loc = mai.places[placeName].lat + ',' + mai.places[placeName].lng,
      // construct service and request objects
      service = new google.maps.places.PlacesService(mai.map),
      request = {
        placeId: mai.places[placeName].googlePid
      };

  // request street view image for place's location
  mai.getStreetViewImg(loc);

  // send request
  service.getDetails(request, function (place, status) {
    // on successful response construct iw for the place
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      mai.createInfoWindowContent(place, placeName);

    // notify user otherwise
    } else {
      mai.showMessage('Place details error.');
    }
  });
};

/**
  @desc visualize place's rating using stars (requires CSS sprite)
  @param number averageRating - place's Google+ rating
  @return ratingsHTML - HTML string to represent place's rating using float and stars.
**/
mai.ratingStars = function (averageRating) {
  // Google doesn't have rating for that place
  if (!averageRating) {
    return '';
  }

  var ratingsHTML,
      roundedAverageRating = Math.ceil(averageRating);

  // trying to mimic Google's relationship between place's rating value and number of stars to display
  if (roundedAverageRating - averageRating > 0.7) {
    roundedAverageRating -= 1;
  } else if (roundedAverageRating - averageRating > 0.2) {
    roundedAverageRating -= 0.5;
  }

  // build markup for place rating stars
  ratingsHTML =
    '<article class="place-rating-' + roundedAverageRating + '">' +
      '<span class="average-rating">' + averageRating.toFixed(1) + '</span>' +
        '<ul class="stars">' +
          '<li id="star-1"></li>' +
          '<li id="star-2"></li>' +
          '<li id="star-3"></li>' +
          '<li id="star-4"></li>' +
          '<li id="star-5"></li>' +
        '</ul>' +
      '<span class="reviews">Google+</span>' +
    '</article>';

  return ratingsHTML;
};

/**
  @desc bounce map marker, called when user clicks place marker or otherwise
  selects one of predefined places
  @param object of type Marker
**/
mai.markerBounce = function (mrkr) {

  // stop bouncing if marker is bouncing
  if (mrkr.getAnimation() !== null) {
    mrkr.setAnimation(null);

  // otherwise make it bounce for 2.1 seconds
  } else {
    mrkr.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function () { mrkr.setAnimation(null); }, 2100);
  }
};

/**
  @desc create custom map controls for GPS and Reset buttons,
  attach appropriate event listeners
  @param controlDiv - HTML element to hold controls, map to bind controls to.
**/
mai.CustomMapControls = function (controlDiv, map) {

  // define HTML elements for both buttons
  var useGeoLocUI = document.createElement('div'),
      centerMapUI = document.createElement('div');

  // set attributes of those elements
  useGeoLocUI.setAttribute('class', 'gps-btn');
  useGeoLocUI.title = 'Something awesome';
  // add svg GPS icon and hidden animated gif for when location is being determined
  useGeoLocUI.innerHTML = '<svg><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg><img src="images/loading.gif">';
  controlDiv.appendChild(useGeoLocUI);

  centerMapUI.setAttribute('class', 'center-map-btn');
  centerMapUI.title = 'Click to recenter the map';
  centerMapUI.innerHTML = 'Reset Position';
  controlDiv.appendChild(centerMapUI);

  // start animation and request geo-position
  google.maps.event.addDomListener(useGeoLocUI, 'click', function () {
    mai.vm.animateGps(true);
    mai.getLocation();
  });

  // return map to its initial view and load weather for the neighborhood
  google.maps.event.addDomListener(centerMapUI, 'click', function () {
    map.fitBounds(mai.bounds);
    map.setCenter(mai.bounds.getCenter());
    mai.loadWeather(mai.neighborhood.lat + ',' + mai.neighborhood.lng);
  });
};

/**
  @desc clear previous src attribute of selected place street view image
  because we delete URL object when iw opens, otherwise browser complains
  in console, and close info-window.
**/
mai.closeIw = function () {
  mai.vm.selectedPlace.photo('');
  mai.infowindow.close();
};

/**
  @desc try to get user's current location, construct and show appropriate
  iw and weather data, notify user on failure
**/
mai.getLocation = function () {

  // close iw and clear selected place name - to not show it in the list of places
  mai.closeIw();
  mai.vm.selectedPlace.name('');

  // browser supports geo-location
  if (navigator.geolocation) {

    // request current user position
    navigator.geolocation.getCurrentPosition(function (position) {

      var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude),  // Google LatLng object
          userPosition = position.coords.latitude + ',' + position.coords.longitude,          // use with loadWeather fn
          geocoder = new google.maps.Geocoder(),                                              // Geocoder object
          place;                                                                              // will store result of reverse geo-location request

      // perform reverse geo-coding of current user's position using Google service
      geocoder.geocode({ 'latLng': pos }, function (results, status) {

        // at least one result returned
        if (status === google.maps.GeocoderStatus.OK) {

          // store one of possible result formats
          place = results[1] || results[0] || results[2] || results[3] || results[4] || results[5] || results[6] || results[7] || results[8] || results[9] || null;

          // set up map for user position
          mai.map.setZoom(17);
          mai.map.setCenter(pos);

          mai.vm.selectedPlace.name(place.formatted_address);

          // open info-window with partial place data while the rest is via request to Google
          mai.infowindow.setContent($('.iw-part').html());
          mai.infowindow.setPosition(pos);
          mai.infowindow.open(mai.map);

          // construct and show data for user's location
          mai.getStreetViewImg(pos);
          mai.createInfoWindowContent(place);

          // get weather conditions for user's location
          mai.loadWeather(userPosition);

        // goe-service returned no results, notify user
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          mai.showMessage('Geolocation 0 results.');

        // some other error of Google reverse geo-location, notify user
        } else {
          mai.showMessage('Geolocation error.');
        }

        // stop GPS animation
        mai.vm.animateGps(false);
      });
    },

    // geo-location supported, but failed
    function () {
      mai.handleNoGeolocation(true);
    });

  // browser doesn't support Geolocation
  } else {
    mai.handleNoGeolocation(false);
  }
};

/**
  @desc display appropriate messages after geolocation fail
  @param boolean errorFlag - determines the message to be shown to the user
**/
mai.handleNoGeolocation = function (errorFlag) {
  if (errorFlag) {
    mai.showMessage('Geolocation failed.');
  } else {
    mai.showMessage('No geolocation support.');
  }

  // stop GPS animation
  mai.vm.animateGps(false);
};

/**
  @desc get current weather conditions and forecast for geo coordinates
  Docs at http://simpleweatherjs.com
  @param string location - coordinated separated by coma
**/
mai.loadWeather = function (location) {

  // request object
  $.simpleWeather({
    location: location,

    // update weather ViewModel and forecast on successful request
    success: function (weather) {
      var weatherLoc = weather.city + ', ' + weather.region + ' ' + weather.country;

      // current weather conditions
      mai.vm.weatherLoc(weatherLoc);
      mai.vm.weatherCondition(weather.currently + ' ');
      mai.vm.weatherIcon('icon-' + weather.code);
      mai.vm.temperature(weather.temp + '\u00B0' + weather.units.temp);
      if (weather.wind.speed !== '') {
        mai.vm.wind(weather.wind.direction + ' ' + weather.wind.speed);
        mai.vm.windSpeed(weather.units.speed);
      }

      // clear old forecast data and construct new one for five days including today
      mai.vm.forecast.removeAll();
      for (var day = 0; day < 5; day++) {
        var dayName = day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : mai.dayFromToday(day),
            obj = {};

        obj = {
          day: dayName,
          condition: weather.forecast[day].text,
          conditionCode: 'icon-' + weather.forecast[day].code,
          high: weather.forecast[day].high + '\u00B0' + weather.units.temp,
          low: weather.forecast[day].low + '\u00B0' + weather.units.temp
        };

        mai.vm.forecast.push(obj);
      }
    },

    // weather request failed
    error: function (error) {

      // log exact error to console for debugging
      console.error(error.error);

      mai.showMessage('Weather err.');

      // update weather ViewModel
      mai.vm.forecast.removeAll();
      mai.vm.weatherCondition('');
      mai.vm.weatherIcon('');
      mai.vm.temperature('No data for ' + mai.vm.selectedPlace.name());
      mai.vm.wind('');
      mai.vm.windSpeed('');
      mai.vm.weatherLoc('No data for ' + mai.vm.selectedPlace.name());
    }
  });
};

/**
  @desc get name of day
  @param number days - number of days from today
  @return string - name of day days-number of days from today
**/
mai.dayFromToday = function (days) {
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      dayInMS = Date.now() + days * 60 * 1000 * 60 * 24,
      day = (new Date(dayInMS)).getDay();

  return weekdays[day];
};

function ViewModel() {
  var self = this;

  // number of predefined places
  self.numOfPlaces = ko.computed(function () {
    return Object.keys(mai.places).length;
  });

  // user input to filter places
  self.inputValue = ko.observable('');

  // holds place names, required for auto-complete functionality of places filter
  self.awesomeList = [];

  // array of objects with place category names and arrays of related place names
  self.placesByType = ko.observableArray([]);

  // controls visibility of places list
  self.placesListVisible = ko.observable(false);

  // controls visibility of places' categories
  self.showAttractions = ko.observable(true);
  self.showHotels = ko.observable(true);
  self.showTravel = ko.observable(true);

  // controls appearance of user notifications
  self.displayErrMsg = ko.observable(false);

  // will hold images related to selected place
  self.placeGallery = ko.observableArray([]);

  // holds boolean of gallery being currently visible
  self.galleryVisible = ko.observable(false);

  // controls animation of waiting for gallery to be displayed
  self.loadingGallery = ko.observable(false);

  // used to populate weather info
  self.weatherCondition = ko.observable('');
  self.weatherIcon = ko.observable('');
  self.temperature = ko.observable('');
  self.wind = ko.observable('');
  self.windSpeed = ko.observable('');
  self.forecastVisible = ko.observable(false);
  self.weatherLoc = ko.observable('');
  self.forecast = ko.observableArray([]);

  // controls state of geo-location button animation
  self.animateGps = ko.observable(false);

  // controls animation of waiting for place's street view to be displayed
  self.streetViewLoading = ko.observable(false);

  // holds boolean of street view being currently visible and shows/hides  custom button to close street view
  self.streetViewVisible = ko.observable(false);

  // disables/enables info-window elements to prevent simultaneous requests for gallery and street view
  self.disableOrNot = ko.computed(function () {
    return (self.loadingGallery() || self.streetViewLoading());
  });

  // tracks dropped markers when map first loads to show corresponding place names in the list
  self.droppedMarkers = ko.observableArray([]);

  // info of currently selected place
  self.selectedPlace = {
    name: ko.observable(''),
    address: ko.observable(''),
    phone: ko.observable(''),
    phoneHref: ko.observable(''),
    photo: ko.observable(''),
    website: ko.observable(''),
    gplus: ko.observable(''),
    rating: ko.observable('')
  };

  // user message data
  self.errMsg = {
    header: ko.observable(''),
    paragraphs: ko.observableArray([])
  };

  // show/hide welcome item in place gallery slide show
  self.galleryHelperVisible = ko.computed(function () {
    return self.placeGallery().length === 0;
  });

  // populate awesomeList and placesByType
  mai.poisCategories.forEach(function (category) {

    // object with category name and places of that category
    var obj = { name: category, items: ko.observableArray([]), showAllItems: true };

    // go through places
    Object.keys(mai.places).forEach(function (poi) {

      if (mai.places[poi].category === category) {

        // add place to category items
        obj.items.push(poi);

        // add place to auto-complete list
        self.awesomeList.push(poi);
      }
    });

    // add object for current category to placesByType array
    self.placesByType.push(obj);
  });

  // initialize auto-complete
  self.awesomplete = new Awesomplete($('#awesominput')[0], {
    list: self.awesomeList,   // list to use for suggestions
    autoFirst: true,          // preselect first entry in suggestions list
    minChars: 1,              // activate auto-complete after 1 character entered
    maxItems: 15              // show max of 15 suggestions
  });

  self.closeErrMsg = function () {
    self.displayErrMsg(false);
  };

  /**
    @desc controls category buttons' classes (for presentation purposes)
    @param string data - category name
    @return boolean - to add/remove active class from category button(s)
  **/
  self.btnState = function (data) {
    switch(data) {
      case 'Attractions':
        return self.showAttractions();
      case 'Hotels':
        return self.showHotels();
      case 'Travel':
        return self.showTravel();
    }
  };

  /**
    @desc glyph class for category buttons
    @param string data - category name
    @return string - proper Bootstrap's glyth icon class for button(s)
  **/
  self.getGlyth = function (data) {
    switch(data) {
      case 'Attractions':
        return 'glyphicon-camera';
      case 'Hotels':
        return 'glyphicon-header';
      case 'Travel':
        return 'glyphicon-road';
    }
  };

  // show/hide weather forecast
  self.toggleForecast = function () {
    self.forecastVisible(!self.forecastVisible());
  };

  /**
    @desc show/hide places of certain category and their markers and
    update array used for auto-complete
    @param object data - contains category name and array of places of that category
  **/
  self.toggleCategory = function (data) {
    var show;                     // boolean to to either show or hide places

    // category name
    data = data.name;

    // toggle category places view and determine whether to show them or hide
    switch(data) {
      case 'Attractions':
        self.showAttractions(!self.showAttractions());
        show = self.showAttractions();
        break;
      case 'Hotels':
        self.showHotels(!self.showHotels());
        show = self.showHotels();
        break;
      case 'Travel':
        self.showTravel(!self.showTravel());
        show = self.showTravel();
        break;
    }

    // places must be hidden from view
    if (!show) {

      // remove places from auto-complete suggestions
      self.awesomeList = self.awesomeList.filter(function (element) {

        // close iw and de-select element's name in the list if that place must be hidden
        if (element === self.selectedPlace.name()) {
          mai.closeIw();
          self.selectedPlace.name('');
        }

        // filter out all places of the category to be hidden
        return mai.places[element].category !== data;
      });

    // places must be shown in the view
    } else {

      // go through all places
      Object.keys(mai.places).forEach(function (poi) {

        // if category is same as data and place is not in self.awesomeList add it to list
        if (mai.places[poi].category === data && self.awesomeList.indexOf(poi) < 0) {
          self.awesomeList.push(poi);
        }
      });
    }

    // present updated list of places to auto-complete engine
    self.awesomplete.list = self.awesomeList;

    // show or hide markers for places of the category name
    self.toggleCategoryMarkers(data, show);
  };

  /**
    @desc tells whether submitted category of places should be visible,
    based on corresponding observables
    @param object data - contains category name and array of places of that category
    @return boolean - true: category will be shown in, false: category places will be hidden
  **/
  self.showCategory = function (data) {

    // category name
    data = data.name;

    switch(data) {
      case 'Attractions':
        return self.showAttractions();
      case 'Hotels':
        return self.showHotels();
      case 'Travel':
        return self.showTravel();
    }
  };

  /**
    @desc used on mobile devices to show all categories
    if any of categories is hidden - it will be shown in the view
  **/
  self.showAll = function () {
    var categoriesToShow = [];

    // determine which categories are hidden and need to be shown now, show then in places list
    if (!self.showAttractions()) {
      self.showAttractions(true);
      categoriesToShow.push('Attractions');
    }

    if (!self.showHotels()) {
      self.showHotels(true);
      categoriesToShow.push('Hotels');
    }

    if (!self.showTravel()) {
      self.showTravel(true);
      categoriesToShow.push('Travel');
    }

    // go throw all categories we've collected
    categoriesToShow.forEach(function (categoryName) {

      // show category markers
      self.toggleCategoryMarkers(categoryName, true);

      // go through all places
      Object.keys(mai.places).forEach(function (poi) {

        // if category matches and place is not in self.awesomeList add it to list
        if (mai.places[poi].category === categoryName && self.awesomeList.indexOf(poi) === -1) {
          self.awesomeList.push(poi);
        }
      });
    });

    // present updated list of places to auto-complete engine
    self.awesomplete.list = self.awesomeList;
  };

  /**
    @desc show/hide list of places, activated by button click
  **/
  self.togglePlacesList = function () {
    self.placesListVisible(!self.placesListVisible());
  };

  /**
    @desc show/hide markers for places of certain category
    @param string category, boolean show
  **/
  self.toggleCategoryMarkers = function (category, show) {

    // items to toggle visibility of
    var items;

    // go through places and select items of current category
    self.placesByType().forEach(function (placeType) {
      if (category === placeType.name) {
        items = placeType.items();
      }
    });

    // show/hide markers
    items.forEach(function (poi) {
      if (mai.places[poi].category === category && show) {
        mai.places[poi].marker.setMap(mai.map);
      } else if (mai.places[poi].category === category) {
        mai.places[poi].marker.setMap(null);
      }
    });
  };

  /**
    @desc handles user selection of a place, update and show
    info-window data, animate marker
    @param string placeName - selected place
  **/
  self.selectPlace = function (placeName) {

    // place marker
    var marker = mai.places[placeName].marker;

    // stop info-window's loading animations and close it
    self.loadingGallery(false);
    self.streetViewLoading(false);
    mai.closeIw();

    // bounce marker and make place show in places list
    mai.markerBounce(marker);
    self.selectedPlace.name(placeName);

    // open info-window with partial place data while the rest is via request to Google
    mai.infowindow.setContent($('.iw-part').html());
    mai.infowindow.open(mai.map, marker);

    // get place details from Google
    mai.execIfConnectedToServer(placeName, mai.getGooglePlaceDetails);
  };

  // clear place filter input field and close iw
  self.clearInput = function () {
    self.inputValue('');
    mai.closeIw();
  };

  /**
    @desc filter places based on user input, update map accordingly
    @param first is not used, second is event triggered when value
    in places filter input field changes
  **/
  self.updatePlaces = function (_, event) {

    var newValue = event.target.value.trim().toLowerCase(),   // user input in lower case and spaces trimmed
        placeCategory;                                        // category name if input matches any place

    // empty places arrays of each category to populate it with proper ones
    self.clearPlacesByType();

    // if filter is empty show all places of non-hidden categories
    if (newValue === '') {
      self.selectedPlace.name('');

      Object.keys(mai.places).forEach(function (poi) {
        placeCategory = mai.places[poi].category;

        // places of currently non-hidden categories are always in auto-complete array
        if (self.awesomeList.indexOf(poi) >= 0) {

          // show markers for all places in auto-complete array
          mai.places[poi].marker.setMap(mai.map);
        }

        // add places to proper items array, they'll be shown in view unless category is hidden
        self.placesByType().forEach(function (placeType) {
          if (placeType.name === placeCategory) {
            placeType.items.push(poi);
          }
        });
      });

      return;
    }

    // if user filters places go through each category and its palace
    self.placesByType().forEach(function (placeType) {
      Object.keys(mai.places).forEach(function (poi) {

        // user input at least partially matches current place name
        if (poi.toLowerCase().indexOf(newValue) >= 0 && mai.places[poi].category === placeType.name) {

          // add place to category's items array
          placeType.items.push(poi);

          // if that category is not hidden, show marker for that place on map
          if (self.awesomeList.indexOf(poi) >= 0) {
            mai.places[poi].marker.setMap(mai.map);
          }

          // if user enters full place name make it selected and show data for it
          if (poi === event.target.value) {
            self.selectPlace(poi);

          // otherwise close iw and deselect any place name in the places list view
          } else {
            mai.closeIw();
            self.selectedPlace.name('');
          }

        // hide markers if user input doesn't match current place name but current place name matches current category
        } else if (mai.places[poi].category === placeType.name) {
          mai.places[poi].marker.setMap(null);
        }
      });
    });
  };

  /**
    @desc clear places array for each category
    used to update places list view and map markers when user filters places
  **/
  self.clearPlacesByType = function () {
    for (var i = 0; i < self.placesByType().length; i++) {
      self.placesByType()[i].items.removeAll();
    }
  };

  /**
    @desc start loading animation in iw and request places gallery
  **/
  self.requestPlaceGallery = function () {
    self.loadingGallery(true);
    mai.execIfConnectedToServer('', mai.vm.showPlaceGallery);
  };

  /**
    @desc request place images from Instagram and Flickr
  **/
  self.showPlaceGallery = function () {

    // get coordinates to request images for
    var lat = mai.infowindow.getPosition().A,
        lng = mai.infowindow.getPosition().F,
        placeName = mai.vm.selectedPlace.name();

    // clear any previous images from DOM
    self.placeGallery.removeAll();

    self.getFlickrPhotos(lat, lng, placeName);
    self.getInstagramPhotos(lat, lng, placeName);
  };

  /**
    @desc perform request to Instagram API and add photos (if any returned) to place's gallery
    @param numbers lat and lng, string placeName
  **/
  self.getInstagramPhotos = function (lat, lng, placeName) {
    var clientID = '33405dcafb524445ad9883cd0c431433',
        // if place is one of predefined set radius to 100 meters, otherwise to 1 mile
        radius = (Object.keys(mai.places).indexOf(placeName) >= 0 ? 100 : 1600);

    // set up AJAX request
    $.ajax({
      url: 'https://api.instagram.com/v1/media/search?&_=1',
      dataType: 'jsonp',
      type: 'GET',
      data: {
        lat: lat,
        lng: lng,
        distance: radius,
        client_id: clientID,
      }
    })

    // request succeeded, handle returned data
    .done(function (data) {

      // Instagram returned error code
      if (data.meta.code !== 200) {

        // log specific error message
        console.error(data.meta.error_message);

        // show rather general error message to user
        mai.showMessage('Instagram API error.');

        return;

      // no images, notify user
      } else if (data.data.length === 0) {
        mai.showMessage('Instagram 0 results.');
        return;
      }

      // go through returned data
      Object.keys(data.data).forEach(function (i) {
        var obj,
            caption = data.data[i].caption ? data.data[i].caption.text : '';

        // if data is image, construct object to hold image data
        if (data.data[i].type === 'image') {
          obj = {};

          obj.src = data.data[i].images.standard_resolution.url;
          obj.title = caption;
          obj.author = 'https://instagram.com/' + data.data[i].user.username + '/';
          obj.hosting = 'Instagram';

          // add object to gallery
          self.placeGallery.push(obj);
        }
      });

      // only show gallery (open modal) when it is not yet shown and it is created for current place
      if(!self.galleryVisible() && (self.selectedPlace.name() === placeName)) {
        $('#bsModal').modal('show');
        self.galleryVisible(true);
      }
    })

    // request failed, notify user
    .fail(function () {
      mai.showMessage('Instagram API error.');
    });
  };

  /**
    @desc perform request to Flickr API and add photos (if any returned) to place's gallery
    @param numbers lat and lng, string placeName
  **/
  self.getFlickrPhotos = function (lat, lng, placeName) {
    var apiKey = 'c82b369d7f0b0b53994f32e2c9620f51',
        // if place is one of predefined set radius to 100 meters, otherwise to 1 mile
        radius = (Object.keys(mai.places).indexOf(placeName) >= 0 ? 1 : 1.6);

    // set up AJAX request
    $.ajax({
      url: 'https://www.flickr.com/services/rest/?',
      dataType: 'json',
      type: 'GET',
      data: {
        method: 'flickr.photos.search',
        format: 'json',
        lat: lat,
        lon: lng,
        radius: radius,
        tags: placeName,
        api_key: apiKey,
        nojsoncallback: 1
      }
    })

    // request succeeded, handle returned data
    .done(function ( data, status, jqxhr ) {

      // flickr sent back 'fail' response, notify user
      if (jqxhr.responseText.indexOf('fail') > -1) {

        // construct error messages
        var errorMessage = jqxhr.responseText.slice(jqxhr.responseText.indexOf('message') + 9,
          jqxhr.responseText.indexOf('}'));

        // log specific error message
        console.error(errorMessage);

        // show rather general error message to user
        mai.showMessage('Flickr API error.');
        return;

      // all went fine, start building Flickr's part of the gallery
      } else {
        self.addFlkrToPlaceGallery(data.photos.photo, placeName);
      }
    })

    // request failed, notify user
    .fail(function () {
      // show rather general error message to user
      mai.showMessage('Flickr API error.');
    });
  };

  /**
    @desc construct image data and add it to the place gallery
    @param array photos, string placeName
  **/
  self.addFlkrToPlaceGallery = function (photos, placeName) {

    // show message if there is no images
    if (photos.length === 0) {
      mai.showMessage('Flickr 0 results.');
      return;
    }

    var obj,
        // url to construct image link
        imgURL = 'https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_z.jpg';

    // construct object to store image data and meta-data
    photos.forEach(function (photo) {
      obj = {};

      // construct image url
      obj.src = imgURL.replace('{farm-id}', photo.farm);
      obj.src = obj.src.replace('{server-id}', photo.server);
      obj.src = obj.src.replace('{id}', photo.id);
      obj.src = obj.src.replace('{secret}', photo.secret);

      // image meta-data
      if (photo.title) {
        obj.title = photo.title;
      } else {
        obj.title = '';
      }
      obj.hosting = 'Flickr';
      obj.author = 'https://www.flickr.com/people/' + photo.owner + '/';

      // add object to place gallery
      self.placeGallery.push(obj);
    });

    // only show gallery (open modal) when it is not yet shown and it is created for current place
    if(!self.galleryVisible() && (self.selectedPlace.name() === placeName)) {
      $('#bsModal').modal('show');
      self.galleryVisible(true);
    }
  };

  /**
    @desc start loading animation in iw and request place's street view
  **/
  self.requestStreetView = function () {
    self.streetViewLoading(true);
    mai.execIfConnectedToServer('', mai.vm.showStreetView);
  };

  /**
    @desc try to show street view panorama for current location
  **/
  self.showStreetView = function () {
    var position = mai.infowindow.getPosition(),          // get current location
        svService = new google.maps.StreetViewService();  // StreetViewService object

    // send street view request to get panorama for anywhere in 100 meters of current position
    svService.getPanoramaByLocation(position, 100, function (data, status) {
      if (status === google.maps.StreetViewStatus.OK) {

        // to remove any previous StreetView panorama from the (user's) way
        mai.panorama.setVisible(false);

        // set up and display StreetView for current place
        mai.panorama.setPosition(position);
        mai.panorama.setVisible(true);

        self.streetViewVisible(true);
        self.streetViewLoading(false);

      // street view request did not return panorama
      } else {
        mai.showMessage('Street View error.');
      }
    });
  };

  self.closeStreetView = function () {
    mai.panorama.setVisible(false);
    self.streetViewVisible(false);
  };
}

/**
  @desc custom binding to control visibility
  of helper item in place gallery slide show
**/
ko.bindingHandlers.showHelper = {
  init: function (element) {
    // remember carousel's helper div to show it when needed
    mai.carouselHelper = $(element).children().first();

    // clear place's gallery  and pause slide-show when modal has closed
    $('#bsModal').on('hidden.bs.modal', function () {
      $('#carousel').carousel('pause');
      mai.vm.placeGallery.removeAll();
      mai.vm.galleryVisible(false);
    });

    // make sure slid-show is paused when gallery opens
    $('#bsModal').on('shown.bs.modal', function () {
      $('#carousel').carousel('pause');
      mai.vm.loadingGallery(false);
    });

    // start slide-show
    $('.slideshow-btn').click(function () {
      $('#carousel').carousel('cycle');
    });

    // remove helper div from carousel after slide event
    $('#carousel').on('slid.bs.carousel', function () {
      mai.carouselHelper.remove();
    });
  },
  update: function (element, valueAccessor) {
    var shouldDisplay = valueAccessor();

    // if we need to display helper item in carousel
    if (shouldDisplay && mai.carouselHelper) {

      // add helper div with class 'active' to carousel
      mai.carouselHelper.addClass('active');
      $(element).prepend(mai.carouselHelper);
    }
  }
};

/**
  @desc custom binding to react on failed images in place's gallery, control
  visibility of those images and gallery behavior on errors
**/
ko.bindingHandlers.imgEvents = {
  init: function (element) {
    var $parent = $(element).parent(),          // image parent div
        $meta = $(element).next('.img-meta');   // image meta-data div

    // if image in gallery fails to load
    $(element).error(function () {

      // if it is currently showing image and there are others
      if ($parent.hasClass('active') && $parent.siblings().length > 0) {

        // notify user and move to next image
        mai.showMessage('Image error.');
        $parent.next().addClass('active');

      // no more images left in current gallery
      } else if ($parent.siblings().length === 0) {

        // notify user and close gallery
        mai.showMessage('Last image error.');
        $('#bsModal').modal('hide');
      }

      // remove failed image from view
      $parent.remove();
    });

    // show image meta-data and remove background loading animation when image loads
    $(element).load(function () {
      $meta.removeClass('hidden');
      $parent.addClass('no-background');
    });
  }
};

/**
  @desc custom binding to fade an element in/out
**/
ko.bindingHandlers.fadeVisible = {
  init: function (element, valueAccessor) {
    // Start visible/invisible according to initial value
    var shouldDisplay = valueAccessor();
    $(element).toggle(shouldDisplay);
  },
  update: function (element, valueAccessor, allBindingsAccessor) {
    // On update, fade in/out
    var shouldDisplay = valueAccessor(),
        allBindings = allBindingsAccessor(),
        duration = allBindings.fadeDuration || 500; // 500ms is default duration unless otherwise specified

    if (shouldDisplay) {
      $(element).fadeIn(duration);
    } else {
      $(element).fadeOut(duration);
    }
  }
};

/**
  @desc custom binding to catch current value of places filter input field,
  since basic knockout bindings did not work fully when user selected a place
  from auto-complete suggestions list using mouse or tap;
  here we use animation frame to check value of filter field in the view
  and update corresponding observable with that value; when that happens -
  update function executes (knockout feature) and triggers custom event,
  which has a function updatePlaces set up as its event handler.
**/
ko.bindingHandlers.observeInputValue = {
  init: function (element, valueAccessor) {
    var input = element,
        newValue = valueAccessor();

    // create event object
    mai.customEvent = new Event('value-updated');

    // set up a requestAnimationFrame loop
    function update () {
      window.requestAnimationFrame(update);

      // change the output to match the input
      newValue(input.value);
    }
    update();
  },
  update: function (element, valueAccessor) {
    var value = valueAccessor(),            // get the latest data that we're bound to
        valueUnwrapped = ko.unwrap(value);  // whether or not the supplied model property is observable, get its current value

    // implement two-way binding - update view when observable updates
    element.value = valueUnwrapped;

    // trigger event when observable updates
    element.dispatchEvent(mai.customEvent);
  }
};

// apply bindings
mai.vm = new ViewModel();
ko.applyBindings(mai.vm);

