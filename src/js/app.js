require([
  "esri/map",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
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
             array,
             dom,
             on
) {
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
  var bicycleLayer= new FeatureLayer(serviceUrl, bicycleLayerOptions);
  map.addLayer(bicycleLayer);


  function init() {
    var urlParams = getJsonFromUrl();
    console.log("appUrl: ", urlParams);
    var layerIds = map.graphicsLayerIds;
    array.forEach(layerIds, function(id) {
      var l = map.getLayer(id);

    });


    var query = new Query();
    var queryTask = new QueryTask(serviceUrl);
    query.objectIds = [0, 1, 2, 3, 4, 5];
    var id = parseInt(urlParams.OBJECTID);
    query.objectIds = [id];
    query.multipatchOption = "xyFootprint";
    query.outFields = ["*"];
    query.returnGeometry = true;
    queryTask.execute(query);
    queryTask.on("complete", function(resp){
      console.log("resp: ", resp);
      var graphic = resp.featureSet.features[0];
      console.log("graphic: ", graphic);
      elevationProfile.set("profileGeometry", graphic.geometry);
    });
    queryTask.on("error", function(error){
      console.log("error: ", error);
    })
  }

  function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }
});