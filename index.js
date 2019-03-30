///////////////////////////////////////////
/////////////////////////////////////////// 
// Layout Setting
var svgWidth = 900, // 250 * 4,
    svgHeight = 900; // 170 * 4,

// var svgWidth = 250 * 4 ,
//     svgHeight = 170 * 4 ;
var margin = {top: 0, right: 0, bottom: 0, left: 0},
    height = svgHeight - margin.top - margin.bottom,
    width = svgWidth - margin.left - margin.right,
    halfWidth = width/2,
    halfHeight = height/2,
    quarterWidth = width/4,
    quarterHeight = height/4,
    treemapCenter = [halfWidth+margin.left, halfHeight+margin.top]; 

var fontScale = d3.scaleLinear();
fontScale.domain([3, 20]).range([8, 20]).clamp(true);

// Use "new" to create a local prng without altering Math.random.
var myrng = new Math.seedrandom('constant');


///////////////////////////////////////////
/////////////////////////////////////////// 
// Initialize Layout
var svg=d3.select("svg").attr("width", svgWidth).attr("height", svgHeight);
var drawingArea, treemapContainer;

drawingArea = svg.append("g").classed("drawingArea", true)
                 .attr("transform", "translate("+[margin.left,margin.top]+")");
treemapContainer = drawingArea.append("g").classed("treemap-container", true)
                  .style("fill", "#fff");

// Define Voronoi Diagram Container
var _voronoiMap=d3.voronoiMap();//Creates a new voronoiMap with the default configuration values and functions
var hierarchy, RectPolygon, leaves, initialPosition;
RectPolygon = computeRectPolygon(width, height);
treemapContainer.append("path")
  .classed("world", true)
  .attr("d", "M"+RectPolygon.join(",")+"Z");
 
// Treemap Color
// generate additive color scheme using TreeColors.js
var additive = TreeColors("add");
var subtractive = TreeColors("sub");

///////////////////////////////////////////  
///////////////////////////////////////////    
// Load Data 
// d3.json("./data/globalEconomyByGDP.json", function(error, rootData)
d3.json("./data/globalEconomyByGDP-plain.json", function(error, rootData)
// d3.json("./data/flare.json", function(error, rootData)
// d3.json("./data/demo-data.json", function(error, rootData)
// d3.json("./data/demo-data-2.json", function(error, rootData)
// d3.json("./data/demo-data-3.json", function(error, rootData)
{
  if (error) throw error;
  
  ///////////////////////////////////////////
  //use TreeColors.js to color the tree with the additive color scheme
  // additive(rootData);
  subtractive(rootData);

  /////////////////////////////////////////// 
  // form a d3 hierarchy
  hierarchy = d3.hierarchy(rootData).sum(function(d){ return d.value; });
  // hierarchy = d3.hierarchy(rootData).sum(function(d){ return d.size; }); // flare
  leaves = hierarchy.children;
  //initialPos = leaves.map(function(d){return [d.x, d.y];})
  console.log("Initial Status: hierarchy and hierarchy.descendants", hierarchy);
  console.log(hierarchy.descendants());
  console.log(leaves);

  //////////////////////////////
  // // Begin: calculate the voronoi treemap
  // _voronoiTreemap
  //   .convergenceRatio(0.01)
  //   .maxIterationCount(1000)
  //   .minWeightRatio(0.01)
  //   .clip(RectPolygon)
  //   // .prng(myrng) //
  //   (hierarchy)
  // // End: calculate the voronoi treemap
  //////////////////////////////

  ////////////////////////////////
  // Begin: calculate the voronoi map
  var Diagram = _voronoiMap
    // .initialPosition(1) // add any value here to set initial position of sites as in the data
    .convergenceRatio(0.01)
    .maxIterationCount(0)
    .minWeightRatio(0.01)
    .clip(RectPolygon)
    .prng(myrng) // if set intial pos, this is useless
    (leaves); 

  // insert each clipping polygon to the corresponding hierarchical node
  leaves.forEach(function(d, i){
    d.polygon = Diagram.polygons[i];
  });
  // End: calculate the voronoi map

  // console.log("_voronoiMap Diagram");
  // console.log(Diagram);
  // //////////////////////////////

  //_voronoiTreemap.extent([top-left corner, right-bottom corner])(root);
  //_voronoiTreemap.size([width, height])(root);
  //_voronoiTreemap.clip(polygon)(root);
  //_voronoiTreemap.convergenceRatio([convergenceRatio]); // default 0.01
  //_voronoiTreemap.maxIterationCount([maxIterationCount]); // default 50
  //_voronoiTreemap.minWeightRatio([minWeightRatio]); // default 0.01
  //_voronoiTreemap.prng([prng]); // default Math.random. for initial layout

  // /////////////////////////////////////////// 
  // // Operations on the calculated voronoi treemap
  // //leaves = hierarchy.leaves();
  // leaves = hierarchy.descendants();
  // // 1. Get the Axis-aligned Bounding Box of each cell
  // leaves.forEach(function(d){
  //   var tempa = GetAABB(d.polygon);
  //   d.AABB = tempa.slice(0, 4); //AABB
  //   d.AABBRatio = tempa[tempa.length-1];//AABB ratio
  // });

  // // 2. Get the Oriented Minimum Bounding Box of each cell
  // leaves.forEach(function(d){
  //   d.OMBB = GetOMBB(d.polygon); //OMBB
  //   d.OMBBRatio = GetOMBBRatio(d.OMBB); //OMBB ratio
  // });

  // // 3. Calculate the area of each polygon
  // leaves.forEach(function(d){
  //   d.Area = d3.polygonArea(d.polygon); // Polygon Area
  // })

  // // 4. 

  // // output result for testing
  // console.log(leaves);  
  // // leaves.forEach(function(d){
  // //    console.log("d.AABBRatio: " + d.AABBRatio + ". d.OMBBRatio: " + d.OMBBRatio);
  // // });
  /////////////////////////////////////////// 
  // Draw the Voronoi result 
  var LeavesOnly = 1, // Display the leaves or all nodes 
      CellOn  = 1, // Display the cell polygon boundary?
      LabelOn = 1, // Display the cell label?
      SiteOn  = 1, // Display the cell site?
      HoverOn = 0, // Display the cell highlight?
      AABBOn  = 0, // Display the cell axis-aligned bounding box?
      OMBBOn  = 0; // Display the cell oriented minimum bounding box?

  // //drawRandomPoints: GDP
  drawTreemap(hierarchy, LeavesOnly, CellOn, LabelOn, SiteOn, HoverOn, AABBOn, OMBBOn);

  //drawRandomPoints: flare
  // drawTreemapFlare(hierarchy, LeavesOnly, CellOn, LabelOn, SiteOn, HoverOn, AABBOn, OMBBOn);

  //save svg to PNG figure. Refer to WYC/SaveFig.js
  d3.select("#save").on("click", function() {
    var svgString = getSVGString(svg.node());
    svgString2Image( svgString, 4*width, 4*height, 'png', save ); // passes Blob and filesize String to the callback

    function save( dataBlob, filesize ){
      saveAs(dataBlob, 'D3JS.png' ); // FileSaver.js function
    }
  });

  // console.log("Finally: hierarchy", hierarchy);
  console.log(hierarchy.descendants());
}); 


///////////////////////////////////////////  
///////////////////////////////////////////  
// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  var cssStyleText = getCSSStyles( svgNode );
  appendCSS( cssStyleText, svgNode );

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

  return svgString;

  function getCSSStyles( parentElement ) {
    var selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push( '#'+parentElement.id );
    for (var c = 0; c < parentElement.classList.length; c++)
        if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
          selectorTextArr.push( '.'+parentElement.classList[c] );

    // Add Children element Ids and Classes to the list
    var nodes = parentElement.getElementsByTagName("*");
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id;
      if ( !contains('#'+id, selectorTextArr) )
        selectorTextArr.push( '#'+id );

      var classes = nodes[i].classList;
      for (var c = 0; c < classes.length; c++)
        if ( !contains('.'+classes[c], selectorTextArr) )
          selectorTextArr.push( '.'+classes[c] );
    }

    // Extract CSS Rules
    var extractedCSSText = "";
    for (var i = 0; i < document.styleSheets.length; i++) {
      var s = document.styleSheets[i];
      
      try {
          if(!s.cssRules) continue;
      } catch( e ) {
            if(e.name !== 'SecurityError') throw e; // for Firefox
            continue;
          }

      var cssRules = s.cssRules;
      for (var r = 0; r < cssRules.length; r++) {
        if ( contains( cssRules[r].selectorText, selectorTextArr ) )
          extractedCSSText += cssRules[r].cssText;
      }
    }
    

    return extractedCSSText;

    function contains(str,arr) {
      return arr.indexOf( str ) === -1 ? false : true;
    }

  }

  function appendCSS( cssText, element ) {
    var styleElement = document.createElement("style");
    styleElement.setAttribute("type","text/css"); 
    styleElement.innerHTML = cssText;
    var refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore( styleElement, refNode );
  }
}


function svgString2Image( svgString, width, height, format, callback ) {
  var format = format ? format : 'png';

  var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  var image = new Image();
  image.onload = function() {
    context.clearRect ( 0, 0, width, height );
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob( function(blob) {
      var filesize = Math.round( blob.length/1024 ) + ' KB';
      if ( callback ) callback( blob, filesize );
    });
  };
  image.src = imgsrc;
}

///////////////////////////////////////////  
///////////////////////////////////////////  