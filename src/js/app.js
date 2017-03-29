require([
  "esri/map",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/dijit/Search",
  "dojo/_base/array",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"
], function (Map,
             ElevationsProfileWidget,
             Units,
             FeatureLayer,
             Query,
             QueryTask,
             Search,
             array,
             dom,
             on) {
  var map = new Map("map", {
    basemap: "streets",
    center: [-116.678, 48.097],
    zoom: 10
  });
  map.on("load", init);

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

  var serviceUrl = "http://services.arcgis.com/WLhB60Nqwp4NnHz3/ArcGIS/rest/services/usbr10_4_story_map_final/FeatureServer/0";
  var bicycleLayerOptions = {
    mode: FeatureLayer.MODE_SNAPSHOT,
    outFields: ["*"]
  };
  var bicycleLayer = new FeatureLayer(serviceUrl, bicycleLayerOptions);
  map.addLayer(bicycleLayer);


  function init() {
    var urlParams = getJsonFromUrl();
    // OBJECTID: [1, 2, 3, 4, 8, 9];
    var id = urlParams.OBJECTID;

    var search = new Search({
      map: map,
      visible: false,
      enableHighlight: true,
      sources: [
        {
          featureLayer: bicycleLayer,
          outFields: ["*"],
          exactMatch: false,
          searchFields: ["OBJECTID"]
        }
      ]
    });

    search.startup();
    search.search(id).then(function (resp) {
      console.log("resp:", resp);
      var feauture = resp[0][0].feature;
      console.log("graphic: ", feauture);
      elevationProfile.set("profileGeometry", feauture.geometry);
    }).catch(function(error){
      console.log("error: ", error);
    });

  }

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