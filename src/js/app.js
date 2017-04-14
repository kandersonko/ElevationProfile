require([
  "esri/map",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/layers/FeatureLayer",
  "esri/dijit/Search",
  "esri/symbols/SimpleLineSymbol",
  "esri/Color",
  "esri/geometry/Polyline",
  "esri/graphic",
  "dojo/dom",
  "dojo/domReady!"
], function (Map,
             ElevationsProfileWidget,
             Units,
             FeatureLayer,
             Search,
             SimpleLineSymbol,
             Color,
             Polyline,
             Graphic,
             dom) {
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
    // OBJECTID : [1, 2, 3, 4, 8, 9];
    // rgb(230,0,0)
    var id = urlParams.OBJECTID;
    var lines = {
      1: {color: new Color("#005CE6"), width: 12},
      2: {color: new Color("#005CE6"), width: 12},
      3: {color: new Color("#005CE6"), width: 12},
      4: {color: new Color("#E60000"), width: 12},
      8: {color: new Color("#38A800"), width: 14},
      9: {color: new Color("#E69800"), width: 6}
    };
    console.log("lines: ", lines);
    console.log("current line: ", lines[id], lines[id].color, lines[id].width);
    var search = new Search({
      map: map,
      visible: false,
      enableHighlight: true,
      showInfoWindowOnSelect: false,
      enableInfoWindow: false,
      infoTemplate: null,
      // highlightSymbol: new SimpleLineSymbol().setColor(lines[id].color).setWidth(14),
      zoomScale: 2,
      sources: [
        {
          featureLayer: bicycleLayer,
          outFields: ["*"],
          exactMatch: false,
          searchFields: ["OBJECTID"]
        }
      ]
    });

    // var selectionSymbol = new SimpleLineSymbol().setColor(new Color("#E69800")).setWidth(24);

    var selectionSymbol = new SimpleLineSymbol().setColor(lines[id].color).setWidth(lines[id].width);
    // bicycleLayer.setSelectionSymbol(selectionSymbol);

    search.startup();
    // console.log("search: ", search);
    search.search(id).then(function (resp) {
      console.log("resp: ", resp);
      var feature = resp[0][0].feature;
      elevationProfile.set("profileGeometry", feature.geometry);
      var polyline = new Polyline(feature.geometry);
      var graphic = new Graphic(polyline, selectionSymbol);
      map.graphics.add(graphic);
      console.log("map: ", map);
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