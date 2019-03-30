(function(global,factory){
	typeof exports==='object'&&typeof module!=='undefined'?factory(exports,require('d3-polygon'),require('d3-weighted-voronoi')):typeof define==='function'&&define.amd?define(['exports','d3-polygon','d3-weighted-voronoi'],factory):(factory((global.d3=global.d3||{}),global.d3,global.d3));
}(this,function(exports,d3Polygon,d3WeightedVoronoi){'use strict';


	var epsilon=1e-5;

	function FlickeringMitigation(){
    /////// Inputs ///////
		this.growthChangesLength=DEFAULT_LENGTH;
		this.totalAvailableArea=NaN;

    //begin: internals
		this.lastAreaError=NaN;
		this.lastGrowth=NaN;
		this.growthChanges=[];
		this.growthChangeWeights=generateGrowthChangeWeights(this.growthChangesLength);//used to make recent changes weighter than older changes
		this.growthChangeWeightsSum=computeGrowthChangeWeightsSum(this.growthChangeWeights);
    //end: internals
	}

	var DEFAULT_LENGTH=10;

	function direction(h0,h1){
		return(h0>=h1)?1:-1;
	}

	function generateGrowthChangeWeights(length){
		var initialWeight=3; // a magic number
		var weightDecrement=1; // a magic number
		var minWeight=1;

		var weightedCount=initialWeight;
		var growthChangeWeights=[];

		for(var i=0;i<length;i++){
			growthChangeWeights.push(weightedCount);
			weightedCount-=weightDecrement;
			if(weightedCount<minWeight){weightedCount=minWeight;}
		}
		return growthChangeWeights;
	}

	function computeGrowthChangeWeightsSum(growthChangeWeights){
		var growthChangeWeightsSum=0;
		for(var i=0;i<growthChangeWeights.length;i++){
			growthChangeWeightsSum+=growthChangeWeights[i];
		}
		return growthChangeWeightsSum;
	}

  ///////////////////////
  ///////// API /////////
  ///////////////////////

FlickeringMitigation.prototype.reset=function(){
	this.lastAreaError=NaN;
	this.lastGrowth=NaN;
	this.growthChanges=[];
	this.growthChangesLength=DEFAULT_LENGTH;
	this.growthChangeWeights=generateGrowthChangeWeights(this.growthChangesLength);
	this.growthChangeWeightsSum=computeGrowthChangeWeightsSum(this.growthChangeWeights);
	this.totalAvailableArea=NaN;

	return this;
};

FlickeringMitigation.prototype.clear=function(){
	this.lastAreaError=NaN;
	this.lastGrowth=NaN;
	this.growthChanges=[];

	return this;
};

FlickeringMitigation.prototype.length=function(_){
	if(!arguments.length){return this.growthChangesLength;}

	if(parseInt(_)>0){
		this.growthChangesLength=Math.floor(parseInt(_));
		this.growthChangeWeights=generateGrowthChangeWeights(this.growthChangesLength);
		this.growthChangeWeightsSum=computeGrowthChangeWeightsSum(this.growthChangeWeights);
	}else{
		console.warn("FlickeringMitigation.length() accepts only positive integers; unable to handle "+_);
	}
	return this;
};

FlickeringMitigation.prototype.totalArea=function(_){
	if(!arguments.length){return this.totalAvailableArea;}

	if(parseFloat(_)>0){
		this.totalAvailableArea=parseFloat(_);
	}else{
		console.warn("FlickeringMitigation.totalArea() accepts only positive numbers; unable to handle "+_);
	}
	return this;
};

FlickeringMitigation.prototype.add=function(areaError){
	var secondToLastAreaError,secondToLastGrowth;

	secondToLastAreaError=this.lastAreaError;
	this.lastAreaError=areaError;if(!isNaN(secondToLastAreaError)){
		secondToLastGrowth=this.lastGrowth;
		this.lastGrowth=direction(this.lastAreaError,secondToLastAreaError);
	}
	if(!isNaN(secondToLastGrowth)){
		this.growthChanges.unshift(this.lastGrowth!=secondToLastGrowth);
	}

	if(this.growthChanges.length>this.growthChangesLength){
		this.growthChanges.pop();
	}
	return this;
};

FlickeringMitigation.prototype.ratio=function(){
	var weightedChangeCount=0;
	var ratio;

	if(this.growthChanges.length<this.growthChangesLength){return 0;}
	if(this.lastAreaError>this.totalAvailableArea/10){return 0;}

	for(var i=0;i<this.growthChangesLength;i++){
		if(this.growthChanges[i]){
			weightedChangeCount+=this.growthChangeWeights[i];
		}
	}

	ratio=weightedChangeCount/this.growthChangeWeightsSum;

	if(ratio>0){
		console.log("flickering mitigation ratio: "+Math.floor(ratio*1000)/1000);
	}

	return ratio;
};

function treemapInitialPosition(){
	//begin: internals
	var clippingPolygon,
		extent,
		minX,maxX,
		minY,maxY,
		dx,dy;
	//end: internals

    ///////////////////////
    ///////// API /////////
    ///////////////////////
    function _treemap(d, i, arr, voronoiMap){
    	// console.log("initialize position");

		var shouldUpdateInternals=false;
		var x,y;
		var intersectPoint, pointArray=[];

		if(clippingPolygon!==voronoiMap.clip()){
			clippingPolygon=voronoiMap.clip();
			extent=voronoiMap.extent();
			shouldUpdateInternals=true;
		}

		if(shouldUpdateInternals){
			updateInternals();
		}

		y = minY + dy*d.y;
		intersectPoint = inter(y, [clippingPolygon[clippingPolygon.length-1][0], clippingPolygon[clippingPolygon.length-1][1]], 
			[clippingPolygon[0][0], clippingPolygon[0][1]]);
		if(intersectPoint) { pointArray.push(intersectPoint); }

		for(let i =1; i<clippingPolygon.length; ++i) {
			intersectPoint = inter(y, [clippingPolygon[i-1][0], clippingPolygon[i-1][1]], [clippingPolygon[i][0], clippingPolygon[i][1]]);
			if(intersectPoint) {
				pointArray.push(intersectPoint);
			}
		}

		if(pointArray.length != 2) {
			console.log("stupid WYC.");
			console.log(pointArray);
		}

		var minXX = maxX+1, maxXX=minX-1;
		for(let i=0; i<pointArray.length; ++i) {
			if (minXX > pointArray[i][0]) minXX = pointArray[i][0];
			if (maxXX < pointArray[i][0]) maxXX = pointArray[i][0];
		}
		x = minXX + (maxXX - minXX) * d.x;

		return [x,y];
    };
    ///////////////////////
    /////// Private ///////
    ///////////////////////

    function inter(LineAY, LineBLeft, LineBRight) {
    	if (Math.abs(LineBLeft[1] -LineBRight[1]) < Math.abs(LineBLeft[0] -LineBRight[0])) { return false; }
    	else {
    		if (LineAY <= Math.max(LineBLeft[1], LineBRight[1]) &&  LineAY >= Math.min(LineBLeft[1], LineBRight[1])) {
    			return [LineBLeft[0], LineAY];
    		}
    		else {
    			return false;
    		}
    	}
    }

	function updateInternals(){
		minX=extent[0][0];
		maxX=extent[1][0];
		minY=extent[0][1];
		maxY=extent[1][1];
		dx=maxX-minX;
		dy=maxY-minY;
	};

    return _treemap;
};

///////////////////////////////////////////
// Inputing the initial position of voronoi diagram
function InputInitialPos(){

  function _InputInitialPos(d,i,arr,voronoiMap){
      return [d.data.x , d.data.y];    
  };

  return _InputInitialPos;
};

function halfAverageAreaInitialWeight(){
	//begin: internals
	var clippingPolygon,
		dataArray,
		siteCount,
		totalArea,
		halfAverageArea;
    //end: internals

    ///////////////////////
    ///////// API /////////
    ///////////////////////
	//wyc
	function _halfAverageArea(d,i,arr,voronoiMap) {
		return epsilon;
	}

    ///////////////////////
    /////// Private ///////
    ///////////////////////

	function updateInternals(){
		siteCount=dataArray.length;
		totalArea=d3Polygon.polygonArea(clippingPolygon);
		halfAverageArea=totalArea/siteCount/2;// half of the average area of the the clipping polygon
	}

	return _halfAverageArea;
};

function voronoiMap(){
    //begin: constants
	var DEFAULT_CONVERGENCE_RATIO=0.01;
	var DEFAULT_MAX_ITERATION_COUNT=50;
	var DEFAULT_MIN_WEIGHT_RATIO=0.01;
	var DEFAULT_PRNG=Math.random;
	var DEFAULT_INITIAL_POSITION=treemapInitialPosition();
	var DEFAULT_INITIAL_WEIGHT=halfAverageAreaInitialWeight();
	var RANDOM_INITIAL_POSITION=treemapInitialPosition();
    //end: constants

    /////// Inputs ///////
	var weight=function(d){
		return d.value;
	}; // accessor to the weight
	var convergenceRatio=DEFAULT_CONVERGENCE_RATIO; // targeted allowed error ratio; default 0.01 stops computation when cell areas error <= 1% clipping polygon's area
	var maxIterationCount=DEFAULT_MAX_ITERATION_COUNT; // maximum allowed iteration; stops computation even if convergence is not reached; use a large amount for a sole converge-based computation stop
	var minWeightRatio=DEFAULT_MIN_WEIGHT_RATIO; // used to compute the minimum allowed weight; default 0.01 means 1% of max weight; handle near-zero weights, and leaves enought space for cell hovering
	var prng=DEFAULT_PRNG; // pseudorandom number generator
	var initialPosition=DEFAULT_INITIAL_POSITION; // accessor to the initial position; defaults to a random position inside the clipping polygon
	var initialWeight=DEFAULT_INITIAL_WEIGHT; // accessor to the initial weight; defaults to the average area of the clipping polygon

	var tick=function(polygons,i){
		return true;
	};
	var weightedVoronoi=d3WeightedVoronoi.weightedVoronoi();
	var siteCount, // number of sites
		totalArea, // area of the clipping polygon
		areaErrorTreshold, // targeted allowed area error (= totalArea * convergenceRatio); below this treshold, map is considered obtained and computation stops
		flickeringMitigation=new FlickeringMitigation();

    //begin: algorithm conf.
	var handleOverweightedVariant=1;// this option still exists 'cause for further experiments
	var handleOverweighted;
    //end: algorithm conf.

    //begin: utils
	function sqr(d){return Math.pow(d,2);}

	function squaredDistance(s0,s1){
		return sqr(s1.x-s0.x)+sqr(s1.y-s0.y);
	}
    //end: utils

	function _voronoiMap(data){

		siteCount=data.length;
		totalArea=Math.abs(d3Polygon.polygonArea(weightedVoronoi.clip()));
		areaErrorTreshold=convergenceRatio*totalArea;
		flickeringMitigation.clear().totalArea(totalArea);

		var iterationCount=0,
			polygons=initialize(data),
			converged=false;
		var areaError;
		tick(polygons,iterationCount); //not understand why use this.

		// console.time("voronoiTreemap");
		while(!(converged||iterationCount>=maxIterationCount)){
			polygons=adapt(polygons,flickeringMitigation.ratio());
			iterationCount++;
			areaError=computeAreaError(polygons);
			flickeringMitigation.add(areaError);
			converged=areaError<areaErrorTreshold;
			// console.log("voronoi: ",iterationCount, areaError/totalArea);
			tick(polygons,iterationCount);
		}
		// console.timeEnd("voronoiTreemap"); 

		return{
			polygons:polygons,
			iterationCount:iterationCount,
			convergenceRatio:areaError/totalArea
		};
	}

	_voronoiMap.weight=function(_){
		if(!arguments.length){
			return weight;
		}

		weight=_;
		return _voronoiMap;
	};

	_voronoiMap.convergenceRatio=function(_){
		if(!arguments.length){
			return convergenceRatio;
		}

		convergenceRatio=_;
		return _voronoiMap;
	};

	_voronoiMap.maxIterationCount=function(_){
		if(!arguments.length){
			return maxIterationCount;
		}

		maxIterationCount=_;
		return _voronoiMap;
	};

	_voronoiMap.minWeightRatio=function(_){
		if(!arguments.length){
			return minWeightRatio;
		}

		minWeightRatio=_;
		return _voronoiMap;
	};

	_voronoiMap.tick=function(_){
		if(!arguments.length){
			return tick;
		}

		tick=_;
		return _voronoiMap;
	};

	_voronoiMap.clip=function(_){
		if(!arguments.length){
			return weightedVoronoi.clip();
		}

		weightedVoronoi.clip(_);
		return _voronoiMap;
	};

	_voronoiMap.extent=function(_){
		if(!arguments.length){
			return weightedVoronoi.extent();
		}

		weightedVoronoi.extent(_);
		return _voronoiMap;
	};

	_voronoiMap.size=function(_){
		if(!arguments.length){
			return weightedVoronoi.size();
		}

		weightedVoronoi.size(_);
		return _voronoiMap;
	};

	_voronoiMap.prng=function(_){
		if(!arguments.length){
			return prng;
		}

		prng=_;
		return _voronoiMap;
	};

	_voronoiMap.initialPosition=function(_){
		if(!arguments.length){
			return initialPosition;
		}
		//if _ exists, then use the input initial position
		initialPosition=InputInitialPos(); 
		return _voronoiMap;
	};

	_voronoiMap.initialWeight=function(_){
		if(!arguments.length){
			return initialWeight;
		}

		initialWeight=_;
		return _voronoiMap;
	};

	function SetInitialWeight(polygons){
		let polygon, mapPoint;
		for(let i=0; i<siteCount; i++) {
			polygon=polygons[i];
			mapPoint=polygon.site.originalObject;
			mapPoint.weight = Math.sqrt(mapPoint.targetedArea)/2;
		}
	}

	function adapt(polygons,flickeringMitigationRatio){
		var adaptedMapPoints;

		adaptPositions(polygons,flickeringMitigationRatio);

		adaptWeights(polygons,flickeringMitigationRatio);
		
		adaptedMapPoints=polygons.map(function(p){
			return p.site.originalObject;
		});
		polygons=weightedVoronoi(adaptedMapPoints);
		if(polygons.length<siteCount){
			console.log('at least 1 site has no area, which is not supposed to arise');
			debugger;
		}
		
		return polygons;
	}

	function adaptPositions(polygons,flickeringMitigationRatio){
		var flickeringInfluence=0.5;
		var flickeringMitigation,d,polygon,mapPoint,centroid,dx,dy;

		flickeringMitigation=flickeringInfluence*flickeringMitigationRatio;
		d=1-flickeringMitigation;// in [0.5, 1]
		for(var i=0;i<siteCount;i++){
			polygon=polygons[i];
			mapPoint=polygon.site.originalObject;
			centroid=d3Polygon.polygonCentroid(polygon);

			dx=centroid[0]-mapPoint.x;
			dy=centroid[1]-mapPoint.y;

       		//begin: handle excessive change;
			dx*=d;
			dy*=d;
        	//end: handle excessive change;

			mapPoint.x+=dx;
			mapPoint.y+=dy;
		}
	}
	function adaptWeights(polygons,flickeringMitigationRatio){
		var flickeringInfluence=0.1;
		var flickeringMitigation,polygon,mapPoint,currentArea,adaptRatio,adaptedWeight;

		flickeringMitigation=flickeringInfluence*flickeringMitigationRatio;
		for(var i=0;i<siteCount;i++){
			polygon=polygons[i];
			mapPoint=polygon.site.originalObject;
			currentArea=Math.abs(d3Polygon.polygonArea(polygon));
			adaptRatio=mapPoint.targetedArea/currentArea;
			
			//begin: handle excessive change;
			adaptRatio=Math.max(adaptRatio,1-flickeringInfluence+flickeringMitigation); // in [(1-flickeringInfluence), 1]
			adaptRatio=Math.min(adaptRatio,1+flickeringInfluence-flickeringMitigation); // in [1, (1+flickeringInfluence)]
	        //end: handle excessive change;

			adaptedWeight=mapPoint.weight*Math.sqrt(adaptRatio);
			adaptedWeight=Math.max(adaptedWeight,epsilon);

			mapPoint.weight=adaptedWeight;
		}
	}

	function computeAreaError(polygons){
	    //convergence based on summation of all sites current areas
		var areaErrorSum=0;
		var polygon,mapPoint,currentArea;
		for(var i=0;i<siteCount;i++){
			polygon=polygons[i];
			mapPoint=polygon.site.originalObject;
			currentArea=Math.abs(d3Polygon.polygonArea(polygon));
			areaErrorSum+=Math.abs(mapPoint.targetedArea-currentArea);
		}
		return areaErrorSum;
	}

	function initialize(data){
		console.log(data);
		var maxValue=data.reduce(function(max,d){
			return Math.max(max, weight(d));
			},-Infinity),
			minAllowedValue=maxValue*minWeightRatio;
		var weights,mapPoints;

	    //begin: extract weights
		weights=data.map(function(d,i,arr){
			//console.log(d);
			return{
				index:i,
				value: d.value,
				initialPosition:initialPosition(d,i,arr,_voronoiMap),
				initialWeight: d.weight,
				originalData:d
			};
		});
		//end: extract weights

		// create map-related points
		// (with targetedArea, initial position and initialWeight)
		mapPoints=createMapPoints(weights);
		return weightedVoronoi(mapPoints);
	}

	function createMapPoints(basePoints){
		var totalValue=basePoints.reduce(function(acc,bp){
			return(acc+=bp.value);
		},0);
		var initialPosition;

		return basePoints.map(function(d,i,bps){
			initialPosition=d.initialPosition;

			return{
				index:d.index,
				targetedArea:totalArea*d.value/totalValue,
				data:d,
				x:initialPosition[0],
				y:initialPosition[1],
				weight:d.initialWeight
				// ArlindNocaj/Voronoi-Treemap-Library uses an epsilonesque initial weight; using heavier initial weights allows faster weight adjustements, hence faster stabilizatio
			};
		});
	}
	return _voronoiMap;
	}

	exports.voronoiMap=voronoiMap;
	exports.voronoiMapInitialPositionRandom=treemapInitialPosition;

	Object.defineProperty(exports,'__esModule',{value:true});

}));