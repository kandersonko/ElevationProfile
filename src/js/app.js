require([
  "esri/map",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/layers/FeatureLayer",
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
  "dojo/domReady!"
], function (Map,
             ElevationsProfileWidget,
             Units,
             FeatureLayer,
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
             domClass) {
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

  var profileParams = {
    map: map,
    chartOptions: chartOptions,
    profileTaskUrl: "https://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer",
    scalebarUnits: Units.MILES
  };

  var elevationProfile = new ElevationsProfileWidget(profileParams, dom.byId("profileChartNode"));
  elevationProfile.startup();

  var bicycleServiceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/ArcGIS/rest/services/usbr10_4_story_map_final/FeatureServer/0";
  var bicycleLayerOptions = {
    mode: FeatureLayer.MODE_SNAPSHOT,
    outFields: ["*"]
  };
  var bicycleLayer = new FeatureLayer(bicycleServiceUrl, bicycleLayerOptions);


  var navigationWEServiceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/arcgis/rest/services/Navigation_WE/FeatureServer/0";
  var navigationEWServiceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/arcgis/rest/services/Navigation_EW/FeatureServer/0";

  var tabEwDom = dom.byId('tab-east-west');
  var tabWeDom = dom.byId('tab-west-east');
  var serviceUrlEventName = "serviceUrl:changes";

  // tabEwDom.style.display = 'none';
  tabWeDom.style.display = 'none';

  map.on("load", init);

  map.addLayer(bicycleLayer);

  on(dom.byId("EW"), 'click', function(){
    // topic.publish(serviceUrlEventName, "tab-east-west", "tab-east-east");
    tabEwDom.style.display = 'block';
    tabWeDom.style.display = 'none';
    domClass.add("EW", 'selected-link');
    domClass.remove("WE", "selected-link");
  });

  on(dom.byId("WE"), 'click', function(){
    // topic.publish(serviceUrlEventName, "tab-west-east", "tab-east-west");
    tabEwDom.style.display = 'none';
    tabWeDom.style.display = 'block';
    domClass.remove("EW", "selected-link");
    domClass.add("WE", "selected-link");
  });

  topic.subscribe("ew:data-loaded", function (features) {
    navigationDirections(features, "tab-east-west");
  });

  topic.subscribe("we:data-loaded", function (features) {
    navigationDirections(features, "tab-west-east");
  });

  function navigationQuery(serviceUrl, id) {
    var url = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/arcgis/rest/services/Navigation_EW/FeatureServer/0";
    var fieldID = (serviceUrl === url) ? "OBJECTID = '" : "ID = '";
    var navigationQueryTask = new QueryTask(serviceUrl);
    var navigationQuery = new Query();
    // dom.byId(tableDom).style.display = 'block';
    navigationQuery.outFields = ["*"];
    navigationQuery.returnGeometry = false;
    navigationQuery.multipatchOption = "xyFootprint";
    // navigationQuery.objectIds = [id];
    navigationQuery.where = fieldID + id + "'";
    navigationQueryTask.execute(navigationQuery);
    navigationQueryTask.on("complete", function (data) {
      console.log("data: ", data);
      var features = data.featureSet.features;
      if (serviceUrl === url) {
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
        "<th>Images</th><th>Directions</th></tr></thead>";
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
    console.log("url parameters: ", urlParams);
    var id = urlParams.OBJECTID;
    var zoom = (urlParams.ZOOM) ? parseInt(urlParams.ZOOM, 10) : 11;
    var lines = {
      1: {color: new Color("#005CE6"), width: 12},
      2: {color: new Color("#005CE6"), width: 12},
      3: {color: new Color("#005CE6"), width: 12},
      4: {color: new Color("#E60000"), width: 12},
      8: {color: new Color("#38A800"), width: 14},
      9: {color: new Color("#E69800"), width: 6}
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

    navigationQuery(navigationEWServiceUrl, id);
    navigationQuery(navigationWEServiceUrl, id);

    search.startup();
    search.search(id).then(function (resp) {
      var feature = resp[0][0].feature;
      elevationProfile.set("profileGeometry", feature.geometry);
      var polyline = new Polyline(feature.geometry);
      var graphic = new Graphic(polyline, selectionSymbol);
      map.graphics.add(graphic);
      var pt = feature.geometry.getExtent();
      var pt2 = pt.getCenter();
      map.centerAndZoom(pt2, zoom);
    });

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