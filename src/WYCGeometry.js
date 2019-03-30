///////////////////////////////////////////
// Drawing the Voronoi Treemap
function drawTreemap(leaves, LeavesOnly, CellOn, LabelOn, SiteOn, HoverOn, AABBOn, OMBBOn) {
  var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader));  
  //var leaves=hierarchy.children; // get leaves
  // var leaves=[];
  // // Display leaves only or all nodes
  // if(LeavesOnly) {
  //   leaves=hierarchy.leaves();
  // }
  // else {
  //   var RootChild=hierarchy.children;
  //   RootChild.forEach(function(d){ leaves = leaves.concat(d.descendants());})
  // }
  // console.log('leaves');
  // console.log(leaves);

  var treemapContainer=d3.select("svg").select(".treemap-container"); //select the container
  
  var cells, labels, sites, hoverers, AABB, OMBB;

  // cells
  if(CellOn) {
    cells = treemapContainer.append("g")
      .classed('cells', true)
      .selectAll(".cell")
      .data(leaves)
      .enter()
        .append("path")
          // .classed("cell", true)
          .attr("d", function(d){ return "M"+d.polygon.join(",")+"z"; })
          .attr("stroke-width", 2)
          .attr("stroke", "black")
          .style("fill", function(d){ return d.parent.data.color; })
          // .style("fill", function(d) { return d3.hcl(d.data.color.h, d.data.color.c, d.data.color.l); })
          // .style("fill", "black");
  }// end cells

  // labels
  if(LabelOn) {
    labels = treemapContainer.append("g")
      .classed('labels', true)
      .selectAll(".label")
      .data(leaves)
      .enter()
        .append("g")
          .classed("label", true)
          .attr("transform", function(d){
            return "translate("+[d.polygon.site.x, d.polygon.site.y+25]+")";
          })
          .style("font-size", "20px")
          // .style("font-size", function(d){ return fontScale(d.data.value); });

    labels.append("text")
      .classed("name", true)
      .html(function(d){
        return (d.data.value<5)? d.data.code : d.data.name;
      });
    // labels.append("text")
    //   .classed("value", true)
    //   .text(function(d){ return d.data.value+"%"; });
  }// end lables

  // Sites
  if(SiteOn) {
    sites = treemapContainer.append("g")
      .classed("sites", true)
      .selectAll("circle")
      .data(leaves)
      .enter()
        .append("circle")
          .classed("site", true)
          .attr('stroke', d3.rgb(120,120,120))
          .attr('stroke-width', 1)
          .attr('fill-opacity', 0.9)
          .attr("cx", function (d) { return d.polygon.site.x; })
          .attr("cy", function (d) { return d.polygon.site.y; })
          .attr("r", 5)
          //.attr("r", function (d) { return d.radius; })
          // .style("fill", CellOn? "black" : "fill", function(d) { return d3.hcl(d.data.color.h, d.data.color.c, d.data.color.l); })
          .style("fill", "black");
  }// end sites

  // hoverers
  if(HoverOn) {
    hoverers = treemapContainer.append("g")
      .classed('hoverers', true)
      .selectAll(".hoverer")
      .data(leaves)
      .enter()
        .append("path")
          .classed("hoverer", true)
          .attr("d", function(d){ return "M"+d.polygon.join(",")+"z"; });
    
    hoverers.append("title")
      .text(function(d) { return d.data.name + "\n" + d.value+"%"; });
  }// end hoverers
 
  // AABB
  if(AABBOn) {
    AABB = treemapContainer.append("g")
      .classed("aabb", true)
      .selectAll(".aabb")
      .data(leaves)
      .enter()
        .append("rect")
        .classed("aabb", true)
        .attr("x", function(d){ return d.AABB.length==4?d.AABB[0]:0;})
        .attr("y", function(d){ return d.AABB.length==4?d.AABB[1]:0;}) 
        .attr("width", function(d){return d.AABB.length==4?d.AABB[2]:0;})
        .attr("height", function(d){return d.AABB.length==4?d.AABB[3]:0;})  
  }// end AABB

  // OMBB
  if(OMBBOn) {
    OMBB = treemapContainer.append("g")
      .classed("ombb", true)
      .selectAll(".ombb")
      .data(leaves)
      .enter()
        .append("path")
        .classed("ombb", true)
        .attr("d", function(d){ return "M"+d.OMBB.join(",")+"z"; });  
  }// end OMBB

} // end: function drawTreemap(hierarchy)

///////////////////////////////////////////
// Drawing the voronoi treemap for flare dataset
function drawTreemapFlare(hierarchy, LeavesOnly, CellOn, LabelOn, SiteOn, HoverOn, AABBOn, OMBBOn) {
  var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader));

  //var leaves=hierarchy.children; // get leaves
  var leaves=[];
  // Display leaves only or all nodes
  if(LeavesOnly) {
    leaves=hierarchy.leaves();
  }
  else {
    var RootChild=hierarchy.children;
    RootChild.forEach(function(d){ leaves = leaves.concat(d.descendants());})
  }
  // console.log('leaves');
  // console.log(leaves);

  var treemapContainer=d3.select("svg").select(".treemap-container"); //select the container
  
  var cells, labels, sites, hoverers, AABB, OMBB;

  // cells
  if(CellOn) {
    cells = treemapContainer.append("g")
      .classed('cells', true)
      .selectAll(".cell")
      .data(leaves)
      .enter()
        .append("path")
          .classed("cell", true)
          .attr("d", function(d){ return "M"+d.polygon.join(",")+"z"; })
          .style("fill", function(d) { return d3.hcl(d.data.color.h, d.data.color.c, d.data.color.l); })
          // .style("fill", "black")
  }// end cells

  // labels
  if(LabelOn) {
    labels = treemapContainer.append("g")
      .classed('labels', true)
      .selectAll(".label")
      .data(leaves, function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
      .enter()
        .append("g")
          .classed("label", true)
          .attr("transform", function(d){
            return "translate("+[d.polygon.site.x, d.polygon.site.y-10]+")";
          })
          // .style("font-size", 1)
          // .style("font-color", "black");

    labels.append("text")
      .classed("name", true)
      .style("fill", "black")
      .html(function(d){
        return d.data.name;
      }).style("font-size", "15px");
    // labels.append("text")
    //   .classed("value", true)
    //   .text(function(d){ return d.data.value+"%"; });
  }// end lables

  // Sites
  if(SiteOn) {
    sites = treemapContainer.append("g")
      .classed("sites", true)
      .selectAll("circle")
      .data(leaves)
      .enter()
        .append("circle")
          .classed("site", true)
          .attr('stroke', d3.rgb(0,0,0))
          .attr('stroke-width', 1)
          .attr('fill-opacity', 0.9)
          .attr("cx", function (d) { return d.polygon.site.x; })
          .attr("cy", function (d) { return d.polygon.site.y; })
          .attr("r", 3)
          //.attr("r", function (d) { return d.radius; })
          // .style("fill", CellOn? "black" : function(d){ return d3.hcl(d.data.color.h, d.data.color.c, d.data.color.l); })
          // .style("fill", "red")
          // .style("fill", "black")
          .style("fill", function(d) { return d3.hcl(d.data.color.h, d.data.color.c, d.data.color.l); });
  }// end sites

  // hoverers
  if(HoverOn) {
    hoverers = treemapContainer.append("g")
      .classed('hoverers', true)
      .selectAll(".hoverer")
      .data(leaves)
      .enter()
        .append("path")
          .classed("hoverer", true)
          .attr("d", function(d){ return "M"+d.polygon.join(",")+"z"; });
    
    hoverers.append("title")
      .text(function(d) { return d.data.name + "\n" + d.value; });
  }// end hoverers
 
  // AABB
  if(AABBOn) {
    AABB = treemapContainer.append("g")
      .classed("aabb", true)
      .selectAll(".aabb")
      .data(leaves)
      .enter()
        .append("rect")
        .classed("aabb", true)
        .attr("x", function(d){ return d.AABB.length==4?d.AABB[0]:0;})
        .attr("y", function(d){ return d.AABB.length==4?d.AABB[1]:0;}) 
        .attr("width", function(d){return d.AABB.length==4?d.AABB[2]:0;})
        .attr("height", function(d){return d.AABB.length==4?d.AABB[3]:0;})  
  }// end AABB

  // OMBB
  if(OMBBOn) {
    OMBB = treemapContainer.append("g")
      .classed("ombb", true)
      .selectAll(".ombb")
      .data(leaves)
      .enter()
        .append("path")
        .classed("ombb", true)
        .attr("d", function(d){ return "M"+d.OMBB.join(",")+"z"; });  
  }// end OMBB

}


///////////////////////////////////////////
// Calculating the Axis-aligned Bounding Box for a given polygon
// Input: An array of array. [[x1,y1], [x2,y2], [x3,y3], [x4,y4], [x5,y5], ... ]
// Output: [x_left, y_top, width, height, min(width, height)/max(width, height)]
function GetAABB(polygon) {
    //console.log(polygon);
    var aabb=[], x1, x2, y1, y2;
    // get the columns of an array of an array
    const arrayColum = (arr, n) => arr.map(x=>x[n]); 

    x1 = Math.min.apply(null, arrayColum(polygon, 0)); // x_left
    x2 = Math.max.apply(null, arrayColum(polygon, 0)); // x_right
    y1 = Math.min.apply(null, arrayColum(polygon, 1)); // y_top
    y2 = Math.max.apply(null, arrayColum(polygon, 1)); // y_bottom

    aabb = [x1, y1, x2-x1, y2-y1, Math.min(x2-x1,y2-y1)/Math.max(x2-x1,y2-y1)];
    //x_left, y_top, width, height, min(width, height)/max(width, height)

    return aabb;
}

///////////////////////////////////////////
// Calculating the Oriented Minimum Bounding Box for a given polygon
// Input: An array of array. [[x1,y1], [x2,y2], [x3,y3], [x4,y4], [x5,y5], ... ]
// Output: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
function GetOMBB(polygon) {
    var ombb=[];
    ombb = CalcOMBB(polygon);
    return ombb;
}
// Input: OMBB (four corner points position)
// Output: OMBB aspect ratio
function GetOMBBRatio(polygon) {
  var ratio, width, length, d1, d2;
  //if(polygon.length != 4) throw error;
  if(polygon.length != 4) return 0;
  d1 = Math.sqrt((polygon[0][0]-polygon[1][0])*(polygon[0][0]-polygon[1][0]) + 
        (polygon[0][1]-polygon[1][1])*(polygon[0][1]-polygon[1][1]));
  d2 = Math.sqrt((polygon[1][0]-polygon[2][0])*(polygon[1][0]-polygon[2][0]) + 
        (polygon[1][1]-polygon[2][1])*(polygon[1][1]-polygon[2][1]));

  width  = Math.min(d1, d2);
  length = Math.max(d1, d2);

  return length==0?0:width/length;
}

///////////////////////////////////////////
// Calculating the Rectangular Overall Container
// The counterclockwise (assuming the origin ⟨0,0⟩ is in the top-left corner)
// By default: [[0, 0], [0, 1], [1, 1], [1, 0]];
// Output: [[0,0], [0, h], [w, h], [w, 0]]
function computeRectPolygon(w, h) { 
  var RP = [];
  RP.push([0, 0]);
  RP.push([0, h]);
  RP.push([w, h]);
  RP.push([w, 0]);
  return RP;
}


///////////////////////////////////////////
// Drawing random points in the canvas following certain rule
// Input: The total amount of random points
function drawRandomPoints(hierarchy, w, h, amount){
  var treemapContainer=d3.select("svg").select(".treemap-container"); //select the container
  var color = d3.schemeCategory10;


  // sites
  var leaves = hierarchy.children, sites=[], site;
  for (var i=0; i<leaves.length; ++i) {
    site = [leaves[i].polygon.site.x, leaves[i].polygon.site.y];
    sites.push(site);
  }
  console.log(sites);


  //// Demo 1: dist = Math.max(Math.abs(point.x-sites[j][0]), Math.abs(point.y-sites[j][1]));
  //// Demo 2: dist = compare two nearest sites(nearest? sum of x and y)
  //// Demo 3: dist = compare two nearest sites(nearest? Euclidean)
  //// Demo 4: dist = compare two nearest sites(nearest? sum of x and y)
  //// Demo 5: voronoi diagram;
  //// Demo 6: dist = considering the three nearest points
  var point={}, points = [];
  for(var i=0; i<amount; ++i) {
    var dist = {}, dists = [];
    point={};
    point.x = Math.random() * width;
    point.y = Math.random() * height;
    point.index = 0;
    //sorting distance
    for (var j=0; j<sites.length; ++j) {
      dist = {};
      // demo 1; demo 2;
      //dist.dist = Math.max(Math.abs(point.x-sites[j][0]), Math.abs(point.y-sites[j][1])); 
      // demo 3; demo 5;
      //dist.dist = Math.sqrt((point.x-sites[j][0])*(point.x-sites[j][0]) + (point.y-sites[j][1])*(point.y-sites[j][1])); 
      // demo 4;
      dist.dist = Math.abs(point.x-sites[j][0]) +  Math.abs(point.y-sites[j][1]); 
      // demo 7;
      //dist.dist = Math.abs(point.x - sites[j][0]);
      // demo 8;
      //dist.dist = Math.abs(point.y - sites[j][1]);
      // demo 9;
      //dist.dist = Math.min(Math.abs(point.x-sites[j][0]), Math.abs(point.y-sites[j][1])); 
      dist.index = j;
      dists.push(dist);
    }//endfor
    dists.sort(function(a,b) { return (a.dist >= b.dist)? 1 : -1; });
    //console.log(dists);
    
    // clustering
    // // demo 1; demo 5;
    // point.index = dists[0].index;
    // demo 2; demo 3; demo 4; demo 6;
    var indextemp0, indextemp1, indextemp2;
    if (Math.abs(sites[dists[0].index][0] - sites[dists[1].index][0]) > 
      Math.abs(sites[dists[0].index][1] - sites[dists[1].index][1])) {
      indextemp0 = (Math.abs(point.x-sites[dists[0].index][0]) < Math.abs(point.x-sites[dists[1].index][0]) ) ? dists[0].index : dists[1].index;
    } else {
      indextemp0 = (Math.abs(point.y-sites[dists[0].index][1]) < Math.abs(point.y-sites[dists[1].index][1]) ) ? dists[0].index : dists[1].index;
    }

    if (Math.abs(sites[dists[0].index][0] - sites[dists[2].index][0]) > 
      Math.abs(sites[dists[0].index][1] - sites[dists[2].index][1])) {
      indextemp1 = (Math.abs(point.x-sites[dists[0].index][0]) < Math.abs(point.x-sites[dists[2].index][0]) ) ? dists[0].index : dists[2].index;
    } else {
      indextemp1 = (Math.abs(point.y-sites[dists[0].index][1]) < Math.abs(point.y-sites[dists[2].index][1]) ) ? dists[0].index : dists[2].index;
    }    
    if (Math.abs(sites[dists[1].index][0] - sites[dists[2].index][0]) > 
      Math.abs(sites[dists[1].index][1] - sites[dists[2].index][1])) {
      indextemp2 = (Math.abs(point.x-sites[dists[1].index][0]) < Math.abs(point.x-sites[dists[2].index][0]) ) ? dists[1].index : dists[2].index;
    } else {
      indextemp2 = (Math.abs(point.y-sites[dists[1].index][1]) < Math.abs(point.y-sites[dists[2].index][1]) ) ? dists[1].index : dists[2].index;
    }

    // 1. Only based on nearest two points
    // point.index = indextemp0;
    // 2. 
    // if (indextemp1 == dists[2].index ) {point.index = sites.length;}
    // else {point.index = indextemp0;}
    // 3. 
    // if (indextemp2 == dists[2].index ) {point.index = sites.length;}
    // else {point.index = indextemp0;}
    // 4. 
    // if (indextemp1 == dists[2].index || indextemp2 == dists[2].index) {point.index = sites.length;}
    // else {point.index = indextemp0;}
    // 5. 
    // if (indextemp0 == indextemp1 || indextemp0 == indextemp2) { point.index = indextemp0; }
    // else {point.index = sites.length;}
    // 6. three overlap region
    // if ((indextemp0 != indextemp1) && (indextemp0 != indextemp2) && (indextemp1 != indextemp2)) {point.index =sites.length;}
    // else {point.index = indextemp0; }
    // 7. My newest thought
    if ((indextemp0 != indextemp1) && (indextemp0 != indextemp2) && (indextemp1 != indextemp2)) {
      // if (sites[dists[0].index][0] <= sites[dists[1].index][0] && sites[dists[0].index][0] <= sites[dists[2].index][0]) { point.index = indextemp2; }
      // if (sites[dists[1].index][0] <= sites[dists[0].index][0] && sites[dists[1].index][0] <= sites[dists[2].index][0]) { point.index = indextemp1; }
      // if (sites[dists[2].index][0] <= sites[dists[0].index][0] && sites[dists[2].index][0] <= sites[dists[1].index][0]) { point.index = indextemp0; }

      // if (sites[dists[0].index][0] >= sites[dists[1].index][0] && sites[dists[0].index][0] >= sites[dists[2].index][0]) { point.index = dists[0].index; }
      // if (sites[dists[1].index][0] >= sites[dists[0].index][0] && sites[dists[1].index][0] >= sites[dists[2].index][0]) { point.index = dists[1].index; }
      // if (sites[dists[2].index][0] >= sites[dists[0].index][0] && sites[dists[2].index][0] >= sites[dists[1].index][0]) { point.index = dists[2].index; }

      point.index = indextemp0; // calculate based on the two nearest sites
      
      // point.index = sites.length;

      // point.index = dists[0].index; // the nearest site (not good)
    }
    else {
      if (indextemp0 == indextemp1 || indextemp0 == indextemp2) { point.index = indextemp0; }
      if (indextemp1 == indextemp2 ) { point.index = indextemp2; }
      else { point.index = indextemp0; }

      // point.index = indextemp0; 
    }

    //

    //
    points.push(point);
  }


  //
  treemapContainer.append("g")
    .classed("points", true)
    .selectAll("circle")
    .data(points)
    .enter()
      .append("circle")
        .classed("site", true)
        .attr('stroke', d3.rgb(120,120,120))
        .attr('stroke-width', 0)
        .attr('fill-opacity', 1)
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("r", 2)
        .style("fill", function (d) { return color[d.index];});

}