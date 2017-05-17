/*
  Author: Koffi Anderson Koffi
  Email: kandersonko@gmail.com
  Date: 05/05/2017
 */
require([
  "esri/map",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/dijit/Search",
  "esri/symbols/SimpleLineSymbol",
  "esri/Color",
  "esri/geometry/Polyline",
  "esri/geometry/Point",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/graphic",
  "dojo/topic",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-class",
  "dojo/query",
  "dojo/domReady!"
], function (Map,
             ElevationsProfileWidget,
             Units,
             FeatureLayer,
             GraphicsLayer,
             Search,
             SimpleLineSymbol,
             Color,
             Polyline,
             Point,
             Query,
             QueryTask,
             Graphic,
             topic,
             on,
             dom,
             domClass,
             query) {
  var map = new Map("map", {
    basemap: "streets",
    center: [-116.678, 48.097],
    zoom: 10
  });

  var chartOptions = {
    titleFontColor: "#ffffff",
    axisFontColor: "#ffffff",
    sourceTextColor: "white",
    busyIndicatorBackgroundColor: "#666"
  };

  var elevationProfileTaskUrl = "https://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer";

  var profileParams = {
    map: map,
    chartOptions: chartOptions,
    profileTaskUrl: elevationProfileTaskUrl,
    scalebarUnits: Units.MILES
  };

  var elevationProfile = new ElevationsProfileWidget(profileParams, dom.byId("profileChartNode"));
  elevationProfile.startup();

  var bicycleServiceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/arcgis/rest/services/NewestForElevationApp/FeatureServer/0";
  var bicycleLayerOptions = {
    mode: FeatureLayer.MODE_SNAPSHOT,
    outFields: ["*"]
  };
  var bicycleLayer = new FeatureLayer(bicycleServiceUrl, bicycleLayerOptions);

  var navigationWEServiceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/arcgis/rest/services/USBR_10_W_to_E_Navigation/FeatureServer/0";

  var navigationEWServiceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/arcgis/rest/services/USBR_10_E_to_W_Navigation/FeatureServer/0";

  var tabEwDom = dom.byId('tab-east-west');
  var tabWeDom = dom.byId('tab-west-east');

  tabEwDom.style.display = 'none';

  map.on("load", init);

  map.addLayer(bicycleLayer);

  on(dom.byId("EW"), 'click', function(e){
    tabEwDom.style.display = 'block';
    tabWeDom.style.display = 'none';
    domClass.add("EW", 'selected-link');
    domClass.remove("WE", "selected-link");
    e.preventDefault();
  });

  on(dom.byId("WE"), 'click', function(e){
    tabEwDom.style.display = 'none';
    tabWeDom.style.display = 'block';
    domClass.remove("EW", "selected-link");
    domClass.add("WE", "selected-link");
    e.preventDefault();
  });

  on(dom.byId("directions-img"), 'click', function(e){
    dom.byId("tabs").style.display = "block";
    e.preventDefault();
  });

  on(dom.byId("directions-close-btn"), 'click', function (e) {
    dom.byId("tabs").style.display = "none";
    e.preventDefault();
  });

  on(dom.byId("elevation-img"), 'click', function (e) {
    dom.byId("elevationProfile").style.visibility = "visible";
    query("div.esriElevationProfileInfoNode").style("opacity", 1);
    e.preventDefault();
  });

  on(dom.byId("elevation-close-btn"), 'click', function (e) {
    dom.byId("elevationProfile").style.visibility = "hidden";
    query("div.esriElevationProfileInfoNode").style("opacity", 0);
    e.preventDefault();
  });

  topic.subscribe("ew:data-loaded", function (features) {
    navigationDirections(features, "tab-east-west");
  });

  topic.subscribe("we:data-loaded", function (features) {
    navigationDirections(features, "tab-west-east");
  });

  function navigationQuery(serviceUrl, id, direction) {
    var fieldID = "ID = '";
    var navigationQueryTask = new QueryTask(serviceUrl);
    var navigationQuery = new Query();
    navigationQuery.outFields = ["*"];
    navigationQuery.returnGeometry = false;
    navigationQuery.multipatchOption = "xyFootprint";
    navigationQuery.where = fieldID + id + "'";
    navigationQueryTask.execute(navigationQuery);
    navigationQueryTask.on("complete", function (data) {
      var features = data.featureSet.features;
      if (direction === "east-west") {
        topic.publish("ew:data-loaded", features);
      }
      else {
        topic.publish("we:data-loaded", features);
      }
    });
    navigationQueryTask.on("error", function (error) {
      console.log("error: ", error);
    });
  }

  function navigationDirections(features, tabDom) {

      var table = "<table cellspacing='0' cellpadding='10'><thead><tr>" +
        "<th></th><th>Directions</th></tr></thead>";
      table += "<tbody>";
      features.forEach(function (feature) {
        table += "<tr><td><img style='display:block;' width='50px' height='50px' src='" + feature.attributes.Image + "'/></td>" +
          "<td>" + feature.attributes.Directions + "</td></tr>";
      });

      table += "</tbody></table>";

    dom.byId(tabDom).innerHTML = table;
  }

  function init() {

    var urlParams = getJsonFromUrl();
    // OBJECTID : [1, 2, 3, 4, 8, 9];
    var id = urlParams.OBJECTID;
    var opacity = (urlParams.OPACITY) ? urlParams.OPACITY : 0.5;
    var zoom = (urlParams.ZOOM) ? urlParams.ZOOM : null;
    var lines = {
      1: {color: new Color("#005CE6"), width: 12},
      2: {color: new Color("#005CE6"), width: 12},
      3: {color: new Color("#005CE6"), width: 12},
      4: {color: new Color("#E69800"), width: 12},
      5: {color: new Color("#38A800"), width: 12},
      6: {color: new Color("#E60000"), width: 12}
    };
    var search = new Search({
      map: map,
      visible: false,
      enableHighlight: true,
      showInfoWindowOnSelect: false,
      enableInfoWindow: false,
      infoTemplate: null,
      // highlightSymbol: new SimpleLineSymbol().setColor(lines[id].color).setWidth(14),
      sources: [
        {
          featureLayer: bicycleLayer,
          outFields: ["*"],
          exactMatch: false,
          searchFields: ["OBJECTID"]
        }
      ]
    });

    var selectionSymbol = new SimpleLineSymbol().setColor(lines[id].color).setWidth(lines[id].width);

    search.startup();
    search.search(id).then(function (resp) {
      var feature = resp[0][0].feature;
      var polyline = new Polyline(feature.geometry);
      elevationProfile.set("profileGeometry", polyline);
      var graphic = new Graphic(polyline, selectionSymbol);
      var graphicLayer = new GraphicsLayer();
      graphicLayer.setOpacity(opacity);
      graphicLayer.add(graphic);
      map.addLayer(graphicLayer);
      var featureExtent = feature.geometry.getExtent();
      var point = featureExtent.getCenter();
      map.centerAndZoom(point, zoom);
    });

    navigationQuery(navigationEWServiceUrl, id, "east-west");
    navigationQuery(navigationWEServiceUrl, id, "west-east");

  }

  // returns a json object which
  // attributes are the url parameters
  function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }
});