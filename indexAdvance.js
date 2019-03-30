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

// Define a Treemap Container
var treemap = d3.treemap()
                // .tile(d3.treemapBinary)
                // .tile(d3.treemapDice)
                // .tile(d3.treemapSlice)
                // .tile(d3.treemapSliceDice)
                .tile(d3.treemapSquarify.ratio(1))
                // .tile(d3.treemapResquarify) // set treemap layout(totally six layouts, default d3.treemapSquarify)
                .size([width, height])
                .round(true);

// Define Voronoi Diagram Container
var _voronoiTreemap=d3.voronoiTreemap();//Creates a new voronoiMap with the default configuration values and functions
var hierarchy, RectPolygon, leaves, initialPosition;
RectPolygon = computeRectPolygon(width, height);
treemapContainer.append("path")
  .classed("world", true)
  .attr("d", "M"+RectPolygon.join(",")+"Z");

// Treemap Color
// generate additive color scheme using TreeColors.js
// var additive = TreeColors("add");
// var subtractive = TreeColors("sub");

///////////////////////////////////////////  
///////////////////////////////////////////  
d3.json("./data/globalEconomyByGDP.json", function(error, rootData)
// d3.json("./data/flare.json", function(error, rootData)
{
  if (error) throw error;
  
  ///////////////////////////////////////////
  //use TreeColors.js to color the tree with the additive color scheme
  // additive(rootData);
  // subtractive(rootData);

  // form a d3 hierarchy
  hierarchy = d3.hierarchy(rootData).sum(function(d){ return d.value; }); // for GDP: value
  // hierarchy = d3.hierarchy(rootData).sum(function(d){ return d.size; }); // for flare: size
  
  //////////////////////////////
  // Begin treemap
  treemap(hierarchy);
  console.log(hierarchy);
  console.log(hierarchy.descendants());

  //////////////////////////////
  // Initialize the x and y coordinate 
  hierarchy.descendants().forEach(function(d, i) {
    // no operation on root
    if (d.depth == 0) {
      d.x = 0;
      d.y = 0;
      d.weight = 0;
    }
    else {
      // 
      var parentRect0 = [d.parent.x0, d.parent.x1, d.parent.y0, d.parent.y1,];
      var parentRect1 = [Math.abs(d.parent.x1 - d.parent.x0), Math.abs(d.parent.y1 - d.parent.y0)];
      var childRect0  = [d.x0, d.x1, d.y0, d.y1,];
      var childCenter = [(d.x0 + d.x1)/2, (d.y0 + d.y1)/2];
      var childArea   = Math.abs(d.x1-d.x0)*Math.abs(d.y1-d.y0);
      // console.log(i, parentRect0, parentRect1, childArea, childRect0, childCenter);

      d.x = (childCenter[0]-parentRect0[0])/parentRect1[0];
      d.y = (childCenter[1]-parentRect0[2])/parentRect1[1];
      d.weight = childArea/2;
    }
  });

  // Initialize the weight value


  //////////////////////////////
  // Begin: calculate the voronoi treemap
  _voronoiTreemap
    .convergenceRatio(0.01)
    .maxIterationCount(100)
    .minWeightRatio(0.01)
    .clip(RectPolygon)
    // .prng(myrng) //
    (hierarchy);

  /////////////////////////////////////////// 
  // Operations on the calculated voronoi treemap
  leaves = hierarchy.leaves();
  // leaves = hierarchy.descendants();
  // 1. Get the Axis-aligned Bounding Box of each cell
  leaves.forEach(function(d){
    var tempa = GetAABB(d.polygon);
    d.AABB = tempa.slice(0, 4); //AABB
    d.AABBRatio = tempa[tempa.length-1];//AABB ratio
  }); 
   
  // 2. Get the Oriented Minimum Bounding Box of each cell
  leaves.forEach(function(d){
    d.OMBB = GetOMBB(d.polygon); //OMBB
    d.OMBBRatio = GetOMBBRatio(d.OMBB); //OMBB ratio
  });

  // 3. Calculate the area of each polygon
  leaves.forEach(function(d){
    d.Area = d3.polygonArea(d.polygon); // Polygon Area
  });

  // // 4. Output values
  // // console.log(leaves);
  leaves.forEach(function(d) {
    console.log(d.AABBRatio, "     ", d.OMBBRatio);
  });


  /////////////////////////////////////////// 
  // Draw the Voronoi result 
  var LeavesOnly = 0, // Display the leaves or all nodes 
    CellOn  = 1, // Display the cell polygon boundary?
    LabelOn = 0, // Display the cell label?
    SiteOn  = 0, // Display the cell site?
    HoverOn = 0, // Display the cell highlight?
    AABBOn  = 0, // Display the cell axis-aligned bounding box?
    OMBBOn  = 0; // Display the cell oriented minimum bounding box?

  // //drawRandomPoints: GDP
  drawTreemap(leaves, LeavesOnly, CellOn, LabelOn, SiteOn, HoverOn, AABBOn, OMBBOn);

  //drawRandomPoints: flare
  // drawTreemapFlare(hierarchy, LeavesOnly, CellOn, LabelOn, SiteOn, HoverOn, AABBOn, OMBBOn);
})

///////////////////////////////////////////  
///////////////////////////////////////////  
