require([
  "esri/map",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/layers/FeatureLayer",
  "dojo/_base/array",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"
], function (Map,
             ElevationsProfileWidget,
             Units,
             FeatureLayer,
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

  function init() {

  }

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

  var layerIds = map.graphicsLayerIds;
  array.forEach(layerIds, function(id) {
    var l = map.getLayer(id);
    console.log("layer: ", id, l);
  });
});