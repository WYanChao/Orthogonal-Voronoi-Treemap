(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-array'), require('d3-polygon')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-array', 'd3-polygon'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3));
}(this, function (exports,d3Array,d3Polygon) { 'use strict';

/////////////////////////////////////
/////////       Utils       /////////
/////////////////////////////////////

  var epsilon = 1e-5;

  function epsilonesque(n) {
    return n <= epsilon && n >= -epsilon;
  }

  // IN: vectors or vertices
  // OUT: dot product
  function dot(v0, v1) {
    return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
  }

  // IN: two vertex objects, v0 and v1
  // OUT: true if they are linearly dependent, false otherwise
  // from https://math.stackexchange.com/questions/1144357/how-can-i-prove-that-two-vectors-in-%E2%84%9D3-are-linearly-independent-iff-their-cro
  function linearDependent(v0, v1) {
    return (
      epsilonesque(v0.x * v1.y - v0.y * v1.x) &&
      epsilonesque(v0.y * v1.z - v0.z * v1.y) &&
      epsilonesque(v0.z * v1.x - v0.x * v1.z)
    );
  }

/////////////////////////////////////
/////////   Class: Vertex   /////////
/////////////////////////////////////

  // IN: coordinates x, y, z
  function Vertex (x, y, index, weight, orig) {
    this.x = x;//must
    this.y = y;//must
    this.weight = null;//must
    this.index = null;//must
    this.polygon = null;// merged by skyline rectangles
    this.originalObject = null;//must
    this.name = null;//must
    this.isClosed = false; // must
    this.skyline = []; // must
    this.newWeight = -1; // must
    this.neighbours = [];  // Potential trouble

    if (index != null) {
      this.index = index;
    }
    if (weight != null) {
      this.weight = weight;
    }
    if (orig !== undefined) {
      this.originalObject = orig;
    }
  }

/////////////////////////////////////
///////// OrthogonalVoronoi /////////
/////////////////////////////////////
  // IN:  sites            --> set of sites with weights
  //      clippingPolygon  --> bounding polygon
  // OUT: polygons         --> Polygons for each site
  function computeDiagram (sites, clippingPolygon) {

    var polygons =  [];

    //////////////
    // Step 0: Use for experiment only
    var ExpNumNeighbor1=0;
    var ExpNumNeighbor2=0;

    //////////////
    // Step 1: Get the bounding box of the clippingPolygon
    var xExtent     = d3Array.extent(clippingPolygon.map(function (c) { return c[0]; })), // x-axis min and max
        yExtent     = d3Array.extent(clippingPolygon.map(function (c) { return c[1]; })); // y-axis min and max
    var clippingBox = [ [xExtent[0], yExtent[0]], [xExtent[1], yExtent[1]] ]; // clipping box(rectangle)
  
    //////////////
    // Step 2: Sorting sites along the x-axis
    let SortedSites = sites.slice();
    SortedSites.sort(function(a,b){return (a.x>=b.x)? 1 : -1; });//sort along x-axis
  
    //////////////
    // Step 3: Initialize the sky line and the sweep line.
    const Initialskyline = [ [ [ xExtent[0], yExtent[0] ], [ xExtent[0], yExtent[1] ] ] ];
    let Allskyline, newskyline;
    var hBreak = []; // Store all horizontal break; [y=?, index a, index b] 'a' site is above the 'b' site.
  
    //////////////
    // Step 4: Update for each site (from the second site)
    Allskyline = Initialskyline.slice();
    SortedSites[0].skyline = Initialskyline.slice();
    for (let i=1; i<sites.length; ++i) {
       // initialize the newskyline
      newskyline = [];

       // check each previous site.
      for (let j=0; j<i; ++j) {
         // If the previous point is closed, then skip.
        if(SortedSites[j].isClosed) {continue;} 

        // Compare the current site with each previous site.
        // If vertical direction rectangle, then will a horizontal break point.
        if (Math.abs(SortedSites[i].x - SortedSites[j].x) <= Math.abs(SortedSites[i].y - SortedSites[j].y) ) {

          // ExpNumNeighbor1 += 1;

          var hbreakvalue;
          if(Math.abs(SortedSites[i].y-SortedSites[j].y) >= (Math.sqrt(Math.max(SortedSites[i].weight, 0))+Math.sqrt(Math.max(SortedSites[j].weight,0)))) {
              hbreakvalue = Math.min(SortedSites[i].y, SortedSites[j].y) + (Math.abs(SortedSites[i].y-SortedSites[j].y)-Math.sqrt(Math.max(SortedSites[i].weight, 0))-Math.sqrt(Math.max(SortedSites[j].weight,0)))/2;
            if (SortedSites[i].y > SortedSites[j].y) {
              hbreakvalue += Math.sqrt(Math.max(SortedSites[j].weight, 0));}
            else {
              hbreakvalue += Math.sqrt(Math.max(SortedSites[i].weight, 0));}
          }
          else {
            hbreakvalue = Math.min(SortedSites[i].y, SortedSites[j].y);
            if (SortedSites[i].y > SortedSites[j].y) {
              hbreakvalue += (Math.sqrt(Math.max(SortedSites[j].weight, 0))*Math.abs(SortedSites[i].y-SortedSites[j].y))/(Math.sqrt(Math.max(SortedSites[i].weight, 0))+Math.sqrt(Math.max(SortedSites[j].weight,0)));}
            else {
              hbreakvalue += (Math.sqrt(Math.max(SortedSites[i].weight, 0))*Math.abs(SortedSites[i].y-SortedSites[j].y))/(Math.sqrt(Math.max(SortedSites[i].weight, 0))+Math.sqrt(Math.max(SortedSites[j].weight,0)));}        
          }
          var hbreak = (SortedSites[i].y > SortedSites[j].y) ? [hbreakvalue, j, i] : [hbreakvalue, i, j];

          // Save all hbreak point by pushing hbreak to hBreak
          hBreak.push(hbreak);
          // update neighbors
          SortedSites[i].neighbours.push(j);
          SortedSites[j].neighbours.push(i);

          // update the j-th site's skyline: many cases
          let temp0, jmax, jmin;
          let tempinter1 = true; // detect whether the j-th skyline is updated or not
          temp0 = SortedSites[j].skyline.slice();
          jmin = SortedSites[j].skyline[0][0][1];
          jmax = SortedSites[j].skyline[SortedSites[j].skyline.length-1][1][1];
          SortedSites[j].skyline = [];
          // Case 1: out of the skyline range
          if (hbreak[0] < temp0[0][0][1] || hbreak[0] > temp0[temp0.length-1][1][1]) {
            // additional range 
            let temprange;
            temprange = (hbreakvalue < temp0[0][0][1]) ? [[ 0, hbreakvalue ], [ 0, temp0[0][0][1]]] : [ [ 0, temp0[temp0.length-1][1][1] ], [ 0,  hbreakvalue ] ];
            // check temprange has intersection with newskyline ?
            let tempinter0 = false;
            tempinter1 = false;
            for (let n=0; n<newskyline.length; ++n) {
              // four cases for intersect
              // case 1.1: upper intersect
              if (temprange[0][1] > newskyline[n][0][1] && temprange[0][1] < newskyline[n][1][1]) { tempinter0 = true; }
              // case 1.2: lower intersect
              if (temprange[1][1] > newskyline[n][0][1] && temprange[1][1] < newskyline[n][1][1]) { tempinter0 = true; }
              // case 1.3: left include
              if (temprange[0][1] > newskyline[n][0][1] && temprange[1][1] < newskyline[n][1][1]) { tempinter0 = true; }
              // case 1.4: right include
              if (temprange[0][1] < newskyline[n][0][1] && temprange[1][1] > newskyline[n][1][1]) { tempinter0 = true; }
            }
            // if both true, then update temp0;
            if(tempinter0) {


              // // Experiment only 
              // ExpNumNeighbor2 += 1;
              
              for (let n=0; n<newskyline.length; ++n) {
                // check newskyline connect with j-th skyline range
                if (!(newskyline[n][0][1] == jmin || newskyline[n][0][1] == jmax || newskyline[n][1][1] == jmin || newskyline[n][1][1] == jmax) ) {
                  continue;
                }
                let tempinter;
                // four cases for intersect
                // case 1.1: upper intersect
                if (temprange[0][1] > newskyline[n][0][1] && temprange[0][1] < newskyline[n][1][1]) { 
                  // tempinter = true; 
                  tempinter = (temprange[1][1] >= newskyline[n][1][1]) ? [ [ newskyline[n][0][0], temprange[0][1] ], [ newskyline[n][0][0], newskyline[n][1][1] ] ] :
                    [ [ newskyline[n][0][0], temprange[0][1] ], [ newskyline[n][0][0], temprange[1][1] ] ] ;
                  temp0.push(tempinter);
                  tempinter1 = true;
                }
                // case 1.2: lower intersect
                if (temprange[1][1] > newskyline[n][0][1] && temprange[1][1] < newskyline[n][1][1]) { 
                  tempinter = (temprange[0][1] >= newskyline[n][0][1]) ? [ [ newskyline[n][0][0], temprange[0][1] ], [ newskyline[n][0][0], temprange[1][1] ] ] :
                    [ [ newskyline[n][0][0], newskyline[n][0][1] ], [ newskyline[n][0][0], temprange[1][1] ] ] ;
                  temp0.push(tempinter);
                  tempinter1 = true;
                }
                // case 1.3: left include
                if (temprange[0][1] > newskyline[n][0][1] && temprange[1][1] < newskyline[n][1][1]) { 
                  tempinter = newskyline[n]; 
                  temp0.push(tempinter);
                  tempinter1 = true;
                }
                // case 1.4: right include
                if (temprange[0][1] < newskyline[n][0][1] && temprange[1][1] > newskyline[n][1][1]) { 
                  tempinter = [ [ newskyline[n][0][0], temprange[0][1] ], [ newskyline[n][0][0], temprange[1][1] ] ]; 
                  temp0.push(tempinter);
                  tempinter1 = true;
                }
              }
            }
            // sort temp0 from y=0 to y=max
            temp0.sort(function(a,b){ return a[0][1] >= b[0][1] ? 1 : -1; });
            // save to SortedSites
            SortedSites[j].skyline = temp0.slice();
          }
          // Case 2: on the skyline range
          else if(Math.abs(hbreak[0]-temp0[0][0][1])<=epsilon ||  Math.abs(hbreak[0]-temp0[temp0.length-1][1][1])<=epsilon)
          {
            // update the hbreak to avaid potential problem
            hbreakvalue = Math.abs(hbreak[0]-temp0[0][0][1])<=epsilon? temp0[0][0][1] : temp0[temp0.length-1][1][1];
            hbreak[0] = hbreakvalue;
            // sort temp0 from y=0 to y=max
            temp0.sort(function(a,b){ return a[0][1] >= b[0][1] ? 1 : -1; });
            SortedSites[j].skyline = temp0.slice();
          }
          // Case 3: in the skyline range
          else {

            // // Experiment only 
            // ExpNumNeighbor2 += 1;

            for (let n=0; n<temp0.length; ++n) {
              let temp1;
              temp1 = temp0[n].slice();
              // skyline intersect with hbreak
              if(temp1[0][1]<hbreakvalue && temp1[1][1]>hbreakvalue) {
                let temp7;
                if(hbreak[1]==j) {
                  temp7 = [ [ temp1[0][0], temp1[0][1] ], [ temp1[1][0], hbreakvalue ] ];
                }
                else {
                  temp7 = [ [ temp1[0][0], hbreakvalue ], [ temp1[1][0], temp1[1][1] ] ];
                }
                SortedSites[j].skyline.push(temp7);
              }
              // skyline and site at same sides of the hbreak, then save to skyline
              if( (temp1[0][1]<hbreakvalue && temp1[1][1]<hbreakvalue && SortedSites[j].y<hbreakvalue) 
                || (temp1[0][1]>hbreakvalue && temp1[1][1]>hbreakvalue && SortedSites[j].y>hbreakvalue) ) {
                SortedSites[j].skyline.push(temp1);
              }
              // else skyline will be deleted.
            }
          }// end of j-th site's skyline        
        }
        else {
        // Else, will add a vertical segmentation line. 
          // //Experiment only
          // ExpNumNeighbor1 += 1;
          // ExpNumNeighbor2 += 1;

          var vsegment;
          if(Math.abs(SortedSites[i].x-SortedSites[j].x) >= (Math.sqrt(Math.max(SortedSites[i].weight,0))+Math.sqrt(Math.max(SortedSites[j].weight,0))) ) {
            vsegment = Math.min(SortedSites[i].x, SortedSites[j].x) + (Math.abs(SortedSites[i].x-SortedSites[j].x)-Math.sqrt(Math.max(SortedSites[i].weight,0))-Math.sqrt(Math.max(SortedSites[j].weight,0)))/2
            if (SortedSites[i].x > SortedSites[j].x) {
              vsegment += Math.sqrt(Math.max(SortedSites[j].weight, 0));}
            else {
              vsegment += Math.sqrt(Math.max(SortedSites[i].weight, 0));}
          }
          else {
            vsegment = Math.min(SortedSites[i].x, SortedSites[j].x);
            if (SortedSites[i].x > SortedSites[j].x) {
              vsegment += (Math.sqrt(Math.max(SortedSites[j].weight, 0))*Math.abs(SortedSites[i].x-SortedSites[j].x))/(Math.sqrt(Math.max(SortedSites[i].weight,0))+Math.sqrt(Math.max(SortedSites[j].weight,0))) ;
            }
            else {
              vsegment += (Math.sqrt(Math.max(SortedSites[i].weight, 0))*Math.abs(SortedSites[i].x-SortedSites[j].x))/(Math.sqrt(Math.max(SortedSites[i].weight,0))+Math.sqrt(Math.max(SortedSites[j].weight,0))) ;
            }
          }

          // 1. Set the j-th site to close.
          SortedSites[j].isClosed = true;

          // 2. update j's skyline to form polygon.
          // sort first
          SortedSites[j].skyline.sort(function(a,b){ return a[0][1] > b[0][1] ? 1 : -1; });
          // check if all the skyline are on the left side of the vsegment.
          let temp0 = SortedSites[j].skyline.slice(), temp1=[];
          for (let n=0; n<temp0.length; ++n) {
            if (temp0[n][0][0]<vsegment) { temp1.push(temp0[n]); }
          }
          // generate polygon
          if(temp1.length) {
            SortedSites[j].polygon=[];
            temp1.forEach(function(d) {
              SortedSites[j].polygon.push(d[0]);
              SortedSites[j].polygon.push(d[1]);
            });
            SortedSites[j].polygon.push([vsegment, temp1[temp1.length-1][1][1] ]); // bottom-right corner point
            SortedSites[j].polygon.push([vsegment, temp1[0][0][1] ]); // top-right corner point
            SortedSites[j].polygon.reverse(); // so that count-clock order
          }
          else { console.log("no suitable left skyline for polygon"); }

          // 3. update newskyline
          let newseg;
          newseg = [ [vsegment, temp1[0][0][1]], [vsegment, temp1[temp1.length-1][1][1]] ];
          newskyline.push(newseg);

          // 4. Update Allskyline
          if (Allskyline.length) {
            let temp0, temp6;
            temp0 = Allskyline.slice();
            temp6 = [];
            // for each i-th skyline
            for (let n=0; n<temp0.length; ++n) {
              if ( (temp0[n][0][1] < newseg[0][1]) && (temp0[n][1][1] <= newseg[0][1]) ) { 
                temp6.push(temp0[n]); } // case 1 & 8
              if ( (temp0[n][1][1] > newseg[1][1]) && (temp0[n][0][1] >= newseg[1][1]) ) { 
                temp6.push(temp0[n]); } // case 2 & 7
              if ( (temp0[n][0][1] < newseg[0][1]) && (temp0[n][1][1] >  newseg[0][1]) && (temp0[n][1][1] <= newseg[1][1]) ) { 
                temp6.push([ temp0[n][0], [ temp0[n][0][0], newseg[0][1] ] ]); } // case 3;
              if ( (temp0[n][1][1] > newseg[1][1]) && (temp0[n][0][1] >=  newseg[0][1]) && (temp0[n][0][1] < newseg[1][1]) ) { 
                temp6.push([ [ temp0[n][0][0], newseg[1][1] ], temp0[n][1] ]); } // case 4;
              if ( (temp0[n][0][1] < newseg[0][1]) && (temp0[n][1][1] >  newseg[1][1]) ) { 
                temp6.push([ temp0[n][0], [ temp0[n][0][0], newseg[0][1] ] ] );
                temp6.push([ [ temp0[n][1][0], newseg[1][1] ], temp0[n][1] ] ); 
              } // case 5;
              if ( (temp0[n][0][1] > newseg[0][1]) && (temp0[n][1][1] <  newseg[1][1]) ) { 
                continue; } // case 6;
            }
            // add the new seg
            temp6.push(newseg);
            // sort temp
            temp6.sort(function(a,b){ return a[0][1] > b[0][1] ? 1 : -1; });
            // save to Allskyline
            Allskyline = [];
            Allskyline = temp6.slice();
          }
          // console.log("update Allskyline: result: ", Allskyline);
        }//
      } //end: for (var j=0; j<i; ++j)
      
      // Update i-th skyline
      SortedSites[i].skyline = Allskyline.slice();
      SortedSites[i].skyline.sort(function(a,b){ return a[0][1] > b[0][1] ? 1 : -1; });
      for (let j=0; j<i; ++j) {
        if (SortedSites[j].isClosed) {continue;}
        if (SortedSites[j].skyline[0][0][1] >= SortedSites[i].skyline[(SortedSites[i].skyline.length-1)][1][1] || 
          SortedSites[j].skyline[SortedSites[j].skyline.length-1][1][1] <= SortedSites[i].skyline[0][0][1] ) {
          continue;
        }
        else {
          let vmax=SortedSites[j].skyline[SortedSites[j].skyline.length-1][1][1], vmin=SortedSites[j].skyline[0][0][1];
          let temp0=SortedSites[i].skyline.slice(), temp1=[];
          // for each i-th skyline
          for (let n=0; n<temp0.length; ++n) {
            if ((temp0[n][0][1] < vmin) && (temp0[n][1][1] <= vmin)) {
              // console.log("case 1 & 8");
              if (SortedSites[i].y < vmin) { temp1.push(temp0[n]); }
            } // case 1 & 8
            if ((temp0[n][1][1] > vmax) && (temp0[n][0][1] >= vmax)) {
              // console.log("case 2 & 7");
              if (SortedSites[i].y > vmax) { temp1.push(temp0[n]); }
            } // case 2 & 7
            if ((temp0[n][0][1] < vmin) && (temp0[n][1][1] > vmin) && (temp0[n][1][1] <= vmax)) {
              // console.log("case 3");
              if (SortedSites[i].y < vmin) { temp1.push([temp0[n][0], [ temp0[n][0][0], vmin ] ]); }
            } // case 3
            if ((temp0[n][1][1] > vmax) && (temp0[n][0][1] >= vmin) && (temp0[n][0][1] < vmax)) {
              // console.log("case 4");
              if (SortedSites[i].y > vmax) { temp1.push([[ temp0[n][0][0], vmax ], temp0[n][1] ]); }
            } // case 4
            if ((temp0[n][0][1] < vmin) && (temp0[n][1][1] > vmax)) {
              // console.log("case 5");
              if (SortedSites[i].y < vmin) { temp1.push([ temp0[n][0], [ temp0[n][0][0], vmin ] ]); }
              else { temp1.push([ [ temp0[n][0][0], vmax ], temp0[n][1] ]); }
            } // case 5
          }
          temp1.sort(function(a,b){ return a[0][1] > b[0][1] ? 1 : -1; });
          // save to SortedSites
          SortedSites[i].skyline = [];
          SortedSites[i].skyline = temp1.slice();   
        }
      }
     
      // Update neighbours of each sites
      for (let j=0; j<=i; ++j) {
        // console.log("  Step 4.3 of computeDiagram: update the neighbours of SortedSites ", "Allskyline", Allskyline);
        // ignore closed sites
        if (SortedSites[j].isClosed) {continue;}
        // Else?
        let temp0, amax, amin, alength;
        temp0   = SortedSites[j].neighbours.slice();
        // if(SortedSites[j].skyline.length == 0) { continue; } 
        alength = SortedSites[j].skyline.length;
        amin    = SortedSites[j].skyline[0][0][1];
        amax    = SortedSites[j].skyline[alength-1][1][1];
        SortedSites[j].neighbours = [];
        if(temp0.length == 0) {continue;}
        for (let n=0; n<temp0.length; ++n) {
          if (SortedSites[temp0[n]].isClosed) {continue;}
          var bmax, bmin, blength;
          blength = SortedSites[temp0[n]].skyline.length;
          bmin    = SortedSites[temp0[n]].skyline[0][0][1];
          bmax    = SortedSites[temp0[n]].skyline[blength-1][1][1];
          if (amin == bmin || amin == bmax || amax == bmin || amax == bmax) {
            SortedSites[j].neighbours.push(temp0[n]);
          }
        }
      }// end: update neighbours

      // Update hBreak to delete the old element (can be perfect)
      let temp4;
      temp4 = hBreak.slice();
      hBreak = [];
      for (let j=0; j<temp4.length; ++j) {
        // if both sites are closed, then continue;
        if (SortedSites[temp4[j][1]].isClosed && SortedSites[temp4[j][2]].isClosed)  { continue; }
        // if both sites are neighbores, then keep;
        if (SortedSites[temp4[j][1]].neighbours.includes(temp4[j][2])) { hBreak.push(temp4[j]); }
      }
    } //end: var i=1; i<sites.length; i++

    //////////////
    // Step 5: close the rest.
    let Closeline = xExtent[1]; 
    // console.log("Step 5 of computeDiagram: ", Closeline);
    for (let i=0; i<sites.length; ++i) {
      if (SortedSites[i].isClosed) { continue; }
      else {
        // 1. close the site
        SortedSites[i].isClosed = true;
        // 2. update i's skyline to form polygon.
        // sort first
        SortedSites[i].skyline.sort(function(a,b){ return a[0][1] > b[0][1] ? 1 : -1; });
        // generate polygon
        let temp0 = [];
        temp0 = SortedSites[i].skyline.slice();
        if(temp0.length) {
          SortedSites[i].polygon=[];
          temp0.forEach(function(d) {
            SortedSites[i].polygon.push(d[0]);
            SortedSites[i].polygon.push(d[1]);
          });
          SortedSites[i].polygon.push([Closeline, temp0[temp0.length-1][1][1]]); // bottom-right corner point
          SortedSites[i].polygon.push([Closeline, temp0[0][0][1]]); // top-right corner point
          SortedSites[i].polygon.reverse(); // so that count-clock order
        }
        else { console.log("no suitable left skyline for polygon"); }
      }
    }

    //////////////
    // Step 6: consider the clipping polygon
    if (clippingPolygon.length == 4 && 
      ((clippingPolygon[0][0] == clippingPolygon[1][0] && clippingPolygon[1][1] == clippingPolygon[2][1] && clippingPolygon[2][0] == clippingPolygon[3][0]) || 
       (clippingPolygon[0][1] == clippingPolygon[1][1] && clippingPolygon[1][0] == clippingPolygon[2][0] && clippingPolygon[2][1] == clippingPolygon[3][1]) ) ) {
    }
    else {
      ////// Begin: polygon-clipping.umd.js
      let boundary=[];
      boundary = clippingPolygon.map(function(d) { return [ d[0], d[1] ]; });
      // then update each polygon
      for (let i=0; i<sites.length; ++i) {
        let ipolygon, iintersect;
        ipolygon = SortedSites[i].polygon.map(function(d) {  return [ d[0], d[1] ];   });
        iintersect = polygonClipping.intersection([boundary], [ipolygon]);
        SortedSites[i].polygon = [];
        let polynew=iintersect.slice();
        while(polynew[0].length == 1) {
          polynew = polynew[0].slice();
        }
        SortedSites[i].polygon = polynew[0];
      }// end for (let i=0; i<sites.length; ++i) 
      ////// End: polygon-clipping.umd.js
    }

    //////////////
    // Step n: ???
    SortedSites.sort(function(a, b) { return (a.index > b.index) ? 1 : -1;});

    for (let i=0; i <sites.length; ++i) {
      if(SortedSites[i].isClosed && SortedSites[i].polygon.length >=3) {
        let p;
        p =  SortedSites[i].polygon.slice();
        p.site = sites[i];
        polygons.push(p);
      }
      else {
        console.log("Error: at least one site has no polygon.");
      }
    }

    return polygons;
  }


/////////////////////////////////////
///////// OrthogonalVoronoi /////////
/////////////////////////////////////

  function OrthogonalVoronoi() {
    /////// Inputs ///////
    var x = function (d) {
      return d.x;
    }; // accessor to the x value
    var y = function (d) {
      return d.y;
    }; // accessor to the y value
    var weight = function (d) {
      return d.weight;
    }; // accessor to the weight
    var clip = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0]
    ]; // clipping polygon
    var extent = [
      [0, 0],
      [1, 1]
    ]; // extent of the clipping polygon
    var size = [1, 1]; // [width, height] of the clipping polygon

    ///////// API /////////

    function _OrthogonalVoronoi(data) {
      var formatedSites;

      // console.log("Start orthogonal voronoi diagram function", data);

      // begin: map sites to the expected format of computeDiagram
      formatedSites = data.map(function (d, i) {
        // console.log(weight(d));
        return new Vertex(x(d), y(d), i, weight(d), d);
      });
      // end: map sites to the expected format of computeDiagram

      // begin: compute the diagram based on the formated sites.
      return computeDiagram(formatedSites, clip);
      // end: compute the diagram based on the formated sites.
    }

    _OrthogonalVoronoi.x = function (_) {
      if (!arguments.length) {
        return x;
      }

      x = _;
      return _OrthogonalVoronoi;
    };

    _OrthogonalVoronoi.y = function (_) {
      if (!arguments.length) {
        return y;
      }

      y = _;
      return _OrthogonalVoronoi;
    };

    _OrthogonalVoronoi.weight = function (_) {
      if (!arguments.length) {
        return weight;
      }

      weight = _;
      return _OrthogonalVoronoi;
    };

    _OrthogonalVoronoi.clip = function (_) {
      var direction, xExtent, yExtent;

      if (!arguments.length) {
        return clip;
      }

      xExtent = d3Array.extent(
        _.map(function (c) {
          return c[0];
        })
      );
      yExtent = d3Array.extent(
        _.map(function (c) {
          return c[1];
        })
      );
      // begin: new version //
      clip = _;
      // end: new version //
      extent = [
        [xExtent[0], yExtent[0]],
        [xExtent[1], yExtent[1]]
      ];
      size = [xExtent[1] - xExtent[0], yExtent[1] - yExtent[0]];
      return _OrthogonalVoronoi;
    };

    _OrthogonalVoronoi.extent = function (_) {
      if (!arguments.length) {
        return extent;
      }

      clip = [_[0],
        [_[0][0], _[1][1]], _[1],
        [_[1][0], _[0][1]]
      ];
      extent = _;
      size = [_[1][0] - _[0][0], _[1][1] - _[0][1]];
      return _OrthogonalVoronoi;
    };

    _OrthogonalVoronoi.size = function (_) {
      if (!arguments.length) {
        return size;
      }

      clip = [
        [0, 0],
        [0, _[1]],
        [_[0], _[1]],
        [_[0], 0]
      ];
      extent = [
        [0, 0], _
      ];
      size = _;
      return _OrthogonalVoronoi;
    };

    /////// Private ///////

    return _OrthogonalVoronoi;
  }

  exports.weightedVoronoi = OrthogonalVoronoi;

  Object.defineProperty(exports, '__esModule', { value: true });

}));