// Generated by CoffeeScript 1.8.0
(function() {
  var activePolylines, addMapLine, clearMap, createIndividualPlowTrail, createPlowsOnMap, displayNotification, getActivePlows, getPlowJobColor, initializeGoogleMaps, map, populateMap, snowAPI;

  snowAPI = "https://api.turku.fi/street-maintenance/v1/vehicles/";

  activePolylines = [];

  map = null;

  initializeGoogleMaps = function(callback, time) {
    var mapOptions, styles, turkuCenter;
    turkuCenter = new google.maps.LatLng(60.4629060928519, 22.259694757206415);
    mapOptions = {
      center: turkuCenter,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      }
    };
    styles = [
      {
        "stylers": [
          {
            "invert_lightness": true
          }, {
            "hue": "#00bbff"
          }, {
            "weight": 0.4
          }, {
            "saturation": 80
          }
        ]
      }, {
        "featureType": "road.arterial",
        "stylers": [
          {
            "color": "#00bbff"
          }, {
            "weight": 0.1
          }
        ]
      }, {
        "elementType": "labels",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      }, {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "visibility": "on"
          }, {
            "color": "#2b8aa9"
          }
        ]
      }, {
        "featureType": "administrative.locality",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      }, {
        "featureType": "administrative.neighborhood",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      }, {
        "featureType": "administrative.land_parcel",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      }
    ];
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    map.setOptions({
      styles: styles
    });
    return callback(time);
  };

  getPlowJobColor = function(job) {
    switch (job) {
      case "kv":
        return "#8dd3c7";
      case "au":
        return "#ffffb3";
      case "su":
        return "#bebada";
      case "hi":
        return "#fb8072";
      case "hj":
        return "#ffffff";
      case "hn":
        return "#fdb462";
      case "hs":
        return "#b3de69";
      case "ps":
        return "#ccebc5";
      case "pe":
        return "#aaaaff";
      default:
        return "#6cf0ff";
    }
  };

  addMapLine = function(plowData, plowJobId) {
    var arr, distance, ind, opacity, plowTrailColor, polyline, polylinePath, strokeWeight, _i, _ref;
    plowTrailColor = getPlowJobColor(plowJobId);
    polylinePath = _.reduce(plowData, (function(accu, x) {
      accu.push(new google.maps.LatLng(x.coords[1], x.coords[0]));
      return accu;
    }), []);
    strokeWeight = 2;
    opacity = 0.8;
    arr = [];
    for (ind = _i = 0, _ref = plowData.length - 1; _i < _ref; ind = _i += 1) {
      arr.push(polylinePath[ind]);
      distance = google.maps.geometry.spherical.computeDistanceBetween(polylinePath[ind], polylinePath[ind + 1]);
      if (200 < distance) {
        polyline = new google.maps.Polyline({
          path: arr,
          geodesic: true,
          strokeColor: plowTrailColor,
          strokeWeight: strokeWeight,
          strokeOpacity: opacity
        });
        activePolylines.push(polyline);
        polyline.setMap(map);
        arr = [];
      }
    }
    polyline = new google.maps.Polyline({
      path: arr,
      geodesic: true,
      strokeColor: plowTrailColor,
      strokeWeight: strokeWeight,
      strokeOpacity: opacity
    });
    activePolylines.push(polyline);
    return polyline.setMap(map);
  };

  clearMap = function() {
    return _.map(activePolylines, function(polyline) {
      return polyline.setMap(null);
    });
  };

  displayNotification = function(notificationText) {
    var $notification;
    $notification = $("#notification");
    return $notification.empty().text(notificationText).slideDown(800).delay(5000).slideUp(800);
  };

  getActivePlows = function(time, callback) {
    $("#load-spinner").fadeIn(400);
    return $.getJSON("" + snowAPI + "?since=" + time + "&location_history=1").done(function(json) {
      if (json.length !== 0) {
        callback(time, json);
      } else {
        displayNotification("Ei näytettävää valitulla ajalla");
      }
      return $("#load-spinner").fadeOut(800);
    }).fail(function(error) {
      return console.error("Failed to fetch active snowplows: " + (JSON.stringify(error)));
    });
  };

  createIndividualPlowTrail = function(time, plowId, historyData) {
    $("#load-spinner").fadeIn(800);
    return $.getJSON("" + snowAPI + plowId + "?since=" + time + "&temporal_resolution=4").done(function(json) {
      if (json.length !== 0) {
        _.map(json, function(oneJobOfThisPlow) {
          var plowHasLastGoodEvent;
          plowHasLastGoodEvent = (oneJobOfThisPlow != null) && (oneJobOfThisPlow[0] != null) && (oneJobOfThisPlow[0].events != null) && (oneJobOfThisPlow[0].events[0] != null);
          if (plowHasLastGoodEvent) {
            return addMapLine(oneJobOfThisPlow, oneJobOfThisPlow[0].events[0]);
          }
        });
        return $("#load-spinner").fadeOut(800);
      }
    }).fail(function(error) {
      return console.error("Failed to create snowplow trail for plow " + plowId + ": " + (JSON.stringify(error)));
    });
  };

  createPlowsOnMap = function(time, json) {
    return _.each(json, function(x) {
      return createIndividualPlowTrail(time, x.id, json);
    });
  };

  populateMap = function(time) {
    clearMap();
    return getActivePlows("" + time + "hours+ago", function(time, json) {
      return createPlowsOnMap(time, json);
    });
  };

  $(document).ready(function() {
    var clearUI;
    clearUI = function() {
      $("#notification").stop(true, false).slideUp(200);
      return $("#load-spinner").stop(true, false).fadeOut(200);
    };
    if (localStorage["auratkartalla.userHasClosedInfo"]) {
      $("#info").addClass("off");
    }
    initializeGoogleMaps(populateMap, 8);
    $("#time-filters li").on("click", function(e) {
      e.preventDefault();
      clearUI();
      $("#time-filters li").removeClass("active");
      $(e.currentTarget).addClass("active");
      $("#visualization").removeClass("on");
      return populateMap($(e.currentTarget).data("hours"));
    });
    $("#info-close, #info-button").on("click", function(e) {
      e.preventDefault();
      $("#info").toggleClass("off");
      return localStorage["auratkartalla.userHasClosedInfo"] = true;
    });
    return $("#visualization-close, #visualization-button").on("click", function(e) {
      e.preventDefault();
      return $("#visualization").toggleClass("on");
    });
  });

}).call(this);
