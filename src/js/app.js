require([
  "esri/map",
  "esri/toolbars/draw",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/CartographicLineSymbol",
  "esri/graphic",
  "esri/units",
  "esri/dijit/ElevationProfile",
  "esri/Color",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"
], function(
  Map,
  Draw,
  SimpleLineSymbol,
  CartographicLineSymbol,
  Graphic,
  Units,
  ElevationsProfileWidget,
  Color,
  dom,
  on
) {
  var tb, epWidget, lineSymbol;
  var map = new Map("map", {
    basemap: "topo",
    center: [-122.45, 37.75],
    zoom: 10
  });
  map.on("load", init);

  function init() {
    var eleList = ["Polyline", "FreehandPolyline"];
    for (var ele in eleList) {
      on(dom.byId(eleList[ele]), "click", function (evt) {
        initToolbar(evt.target.id.toLowerCase());
      });
    }

    on(dom.byId("unitsSelect"), "change", function (evt) {
      if (epWidget) {
        epWidget.set("measureUnits", evt.target.options[evt.target.selectedIndex].value);
      }
    })

    // lineSymbol used for freehand polyline and line.
    lineSymbol = new CartographicLineSymbol(
      CartographicLineSymbol.STYLE_SOLID,
      new Color([255, 0, 0]), 2,
      CartographicLineSymbol.CAP_ROUND,
      CartographicLineSymbol.JOIN_MITER, 2
    );

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

    epWidget = new ElevationsProfileWidget(profileParams, dom.byId("profileChartNode"));
    epWidget.startup();
  }

  function initToolbar(toolName) {
    epWidget.clearProfile(); //Clear profile

    map.graphics.clear();
    tb = new Draw(map);
    tb.on("draw-end", addGraphic);
    tb.activate(toolName);
    map.disableMapNavigation();
  }

  function addGraphic(evt) {
    //deactivate the toolbar and clear existing graphics
    tb.deactivate();
    map.enableMapNavigation();
    var symbol = lineSymbol;
    map.graphics.add(new Graphic(evt.geometry, symbol));
    epWidget.set("profileGeometry", evt.geometry);

    var sel = dom.byId("unitsSelect");
    if (sel) {
      var val = sel.options[sel.selectedIndex].value;
      epWidget.set("measureUnits", val);
    }
  }
});