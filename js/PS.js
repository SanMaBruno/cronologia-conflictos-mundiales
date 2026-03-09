
// Create Namespace
var PS = window.PS || {};

// Event Manager
PS.EM = PS.EM || $({});

// Graph Filters
PS.Filter = PS.Filter || {};

// Events
PS.Event = PS.Event || {

	"INTRO_HIDDEN"			: "introHidden",
	"GRAPH_HIDDEN"			: "graphHidden",
	
	"DATE_FILTERED" 		: "dateFiltered",
	"FATALITIES_FILTERED" 	: "fatalitiesFiltered",
	"REGION_FILTERED" 		: "regionFiltered",

	"FATALITIES_CLICKED" 	: "fatalitiesClicked",
	"REGION_CLICKED" 		: "regionClicked",
	"REGION_REMOVED" 		: "regionRemoved",
	"REGION_RESETED"		: "regionReseted",

	"SHOW_OVERLAY" 			: "showOverlay",
	"HIDE_OVERLAY"			: "hideOverlay",
	"SEARCH_FILTERED"		: "searchFiltered"

};

PS.Colors = {
	"Africa" 		: "#AE0F0A",
	"Asia" 			: "#E30613",
	"Europe" 		: "#E35E06",
	"NorthAmerica" 	: "#B70D4D",
	"SouthAmerica" 	: "#D2024B"
};

$(window).ready(function() {

	if ( window.GRAPH_ONLY ) {

		PS.Controls.onIntroHidden();
		PS.Buttons.init();

		TweenMax.killTweensOf(".overlay-btns .btn-overlay:not(.back)");
		TweenMax.staggerTo(".overlay-btns .btn-overlay:not(.back)", this.baseDuration, { "transform" : "translateX(114px)", "opacity" : 1, delay : 1.1, force3D: true }, 0.04);

	} else {
		PS.Controls.init();
	}
});

// Scroll trick 
$(window).on('beforeunload', function() {
    $(window).scrollTop(0);
});


PS.Graph = {

	width : 1280,
	height : 720,
	padding : 75,

	totalFatalities : 0,
	radiusMultiplier : 0,
	flowerDuration : 2000,

	sliderStartDate : null,
	sliderEndDate : null,
	originalDataSet : null,
	data : null,
	dataAll : null,

	dateShow : null,
	dateHide : null,
	regionShow : null,
	regionHide : null,
	deathShow : null,
	deathHide : null,

	xScale : null,
	yScale : null,
	fatalitiesScale : null,
	viz : null,

	xAxis : null,
	yAxis : null,
	durationScale : null,

	paused : false,
	BGInterval : false,
	BGCurrent : ".bg-graph",
  
	init : function() {

		var self = this;

		TweenLite.killTweensOf(".bg-graph");
		TweenLite.to(".bg-graph", 2, { opacity: 1, onComplete : function() {
			self.initBGTimer();
		} });

		TweenLite.killTweensOf("#graph");
		TweenLite.to("#graph", 1, { opacity: 1 });
		
		TweenLite.killTweensOf(".block-filter-top");
		TweenLite.to(".block-filter-top", 0.8, { opacity : 1, transform : "translateY(0)", force3D : true, delay : 3.8, ease : Expo.easeInOut });

		$(".intro").hide();

		this.viz = d3.select('#graph');
		// d3.csv('data/wars.csv', $.proxy( this.spreadsheetLoaded, this ) );
		d3.csv('data/PoppyDataCSV.csv', $.proxy( this.spreadsheetLoaded, this ) );
	},

	spreadsheetLoaded : function ( e, rows ) {
		
		var self = this;

		this.originalDataSet = [];
		rows.forEach(function(row, i) {
			row.index = i;
			row.fatalities = row.fatalities.trim();
			row.fatalitiesInt = +(row.fatalities.replace(/,/g, ""));
			row.fatalitiesIntSQRT = Math.sqrt( row.fatalitiesInt );

			// if ( row.fatalitiesInt > 10000 ) {
				self.originalDataSet.push( new PS.Graph.War(row) );
			// }
		});

		this.originalDataSet.sort( this.orderFatalities );
		this.originalDataSet.forEach( function( row, i ) {
			row.index = i;
		});
		this.dataLoaded( this.originalDataSet );

		this.dateHide = [];
		this.dateShow = this.originalDataSet;
		this.regionHide = [];
		this.regionShow = this.originalDataSet;
		this.deathHide = [];
		this.deathShow = this.originalDataSet;
		this.searchHide = [];
		this.searchShow = this.originalDataSet;
	},

	dataLoaded : function ( loadedWars ) {

		this.data = loadedWars;
		this.dataAll = this.data.slice(0);

		var 
			minYear = d3.min(this.data, function(d){return d.startYear;}),
			maxYear = d3.max(this.data, function(d){return d.endYear;});

		// Init Sub Modules
		PS.Graph.Overlay.init();

		PS.Filter.Date.init( minYear, maxYear );

		PS.Filter.Panel.init( this.dataAll );

		PS.EM.on(PS.Event.DATE_FILTERED, $.proxy(this.onDateFiltered, this));
		PS.EM.on(PS.Event.REGION_FILTERED, $.proxy(this.onRegionFiltered, this));
		PS.EM.on(PS.Event.FATALITIES_FILTERED, $.proxy(this.onFatalitiesFiltered, this));
		PS.EM.on(PS.Event.SEARCH_FILTERED, $.proxy(this.onSearchFiltered, this));

		this.xScale = d3.scale.linear().domain([ minYear, maxYear ]).range([ this.padding, this.width - this.padding ]);
		
		this.yScale = d3.scale.log()
			.base(2)
			.clamp(true)
			.domain([ 0.8, d3.max(this.data, function(d) { return d.duration; }) ])
			.range([ this.height, this.padding + 80 ]);

		this.fatalitiesScale = d3.scale.linear().domain( d3.extent( this.data, function(d){ return d.fatalitiesIntSQRT; }) ).range([ 10, 310 ]);
		this.durationScale = d3.scale.log().domain( d3.extent( this.data, function(d){ return d.fatalitiesInt; }) ).range([ 800, 1200 ]);
		
		this.draw();

		// Initialize crosshair interaction on the main graph
		PS.Crosshair.init( this.data, this.xScale, this.yScale );
	},

	draw : function ( ) {

		var wars = this.viz.selectAll('.war').data( this.data, function(d){ return d.name; });

		this.drawAxis();

		this.drawLabels( wars );
		this.drawGroupFlower( wars );
		this.drawStem();
		this.drawFlower();
		this.addEventsFlowers();
	},

	drawLabels : function( wars ) {

		var self = this;

		var gText = wars.enter()
			.append("svg:g")
			.attr("class", "over-title")
			.attr('data-index', function(d,i){ return i;});

		gText.append("svg:text")
			.text( function(d){ return d.name;} )
			.attr('x', function(d){
				d.textWidth = this.getBBox().width;
				var baseX = self.xScale(d.endYear);
				return baseX > 640 ? baseX - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) - d.textWidth - 10 : baseX + (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) + 10;
			})
			.attr('y', function(d){return self.yScale(d.duration) + 9;});

		gText.insert("svg:rect", ".over-title text")
			.attr('x', function(d){
				var baseX = self.xScale(d.endYear);
				return baseX > 640 ? baseX - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) - d.textWidth - 10 - 3 : baseX + (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) + 10 - 3;
			})
			.attr('y', function(d){ return self.yScale(d.duration) - 9; })
			.attr('width', function(d) { return d.textWidth + 6; })
			.attr('height', 24);

	},

	drawGroupFlower : function( wars ) {

		wars.enter().append('svg:g')
			.attr('class','war')
			.attr('data-index', function(d,i){ return i; });
	},

	drawStem : function() {

		//draw stem
		var 
			self = this,
			path = this.viz.selectAll(".war").append('svg:path')
				.attr('d', function (d) { return self.calcStem(d); })
				.attr('class', 'stem');

		path
			.each( function ( d ) { d.totalLength = this.getTotalLength(); } )
			.attr("stroke-dasharray", function(d) { return d.totalLength + " " + d.totalLength; })
			.attr("stroke-dashoffset", function(d) { return d.totalLength; })
			.transition()
				.delay(function(d) { return 500 + (Math.round( d.randomness * self.data.length ) * 12); })
				.duration(self.flowerDuration)
				.ease("exp-in-out")
				.attr("stroke-dashoffset", 0);
			
		// d3.timer( $.proxy( this.animateStem, this ) );
	},

	drawFlower : function ( ) {

		var self = this;

		this.viz.selectAll(".war").append('svg:image')
			.attr('xlink:href', function(d){return PS.Graph.Poppy.getPoppy(d.location);})
			.attr('width', 0)
			.attr('height', 0)
			.attr('x', function(d){return self.xScale(d.endYear);})
			.attr('y', function(d){return self.yScale(d.duration);})
			.attr('class','flower')
			.attr('filter', 'url(#shadow)')
			.transition()
				.delay(function(d) { return 500 + ((self.flowerDuration / 2 + 100) + (Math.round( d.randomness * self.data.length ) * 12)); })
				.duration( function(d){ return self.durationScale(d.fatalitiesIntSQRT);} )
				.ease("exp-in-out")
				.attr('width', function(d){return self.fatalitiesScale(d.fatalitiesIntSQRT);})
				.attr('height', function(d){return self.fatalitiesScale(d.fatalitiesIntSQRT);})
				.attr('x', function(d){return self.xScale(d.endYear) - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2);})
				.attr('y', function(d){return self.yScale(d.duration) - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2);});
	},

	addEventsFlowers : function() {

		var self = this;

		// Usar mouseenter/mouseleave para evitar múltiples disparos
		$(".war").on("mouseenter", function(){

			var 
				$this = $(this),
				currentIndex = $this.data("index"),
				$text = $('.over-title[data-index="' + currentIndex + '"]');

			d3.select($text[0]).moveToFront();

			// Aplicar filtro de contorno a la flor
			$this.find('.flower').attr("filter", "url(#outline)");
			$text.stop(true).animate({ "opacity" : 1 }, 200);
			
			// Obtener los datos de la guerra para este índice
			var warData = self.data[currentIndex];
			
			// Si la guerra no está en el tooltip actual, actualizar el tooltip al año de la guerra
			var $row = $('.ch-tt-row[data-index="' + currentIndex + '"]');
			if ($row.length === 0 && warData && PS.Crosshair) {
				// Actualizar tooltip al endYear de esta guerra con el ítem resaltado
				PS.Crosshair.lastYear = warData.endYear;
				PS.Crosshair.buildTooltipForYear(warData.endYear, currentIndex);
			} else if ($row.length > 0) {
				// Resaltar la fila correspondiente en el tooltip
				$row.addClass('ch-tt-row-highlight');
				
				// Scroll automático a la fila resaltada en el tooltip
				var $list = $row.closest('.ch-tt-list');
				if ($list.length > 0) {
					var rowTop = $row.position().top;
					var listScrollTop = $list.scrollTop();
					var listHeight = $list.height();
					var rowHeight = $row.outerHeight();
					
					// Si la fila no está visible, hacer scroll
					if (rowTop < 0 || rowTop + rowHeight > listHeight) {
						$list.animate({
							scrollTop: listScrollTop + rowTop - (listHeight / 2) + (rowHeight / 2)
						}, 150);
					}
				}
			}
		});

		$(".war").on("mouseleave", function(){
			
			var 
				$this = $(this),
				currentIndex = $this.data("index"),
				$text = $('.over-title[data-index="' + currentIndex + '"]');

			d3.select($text[0]).moveToBack();

			// Quitar filtro de contorno
			$this.find('.flower').attr("filter", "");
			$text.stop(true).animate({ "opacity" : 0 }, 100);
			
			// Quitar resaltado de la fila del tooltip
			$('.ch-tt-row[data-index="' + currentIndex + '"]').removeClass('ch-tt-row-highlight');
		});

		$(".war").on("click", function(e){
			e.stopPropagation();  // Evitar que el click se propague al SVG

			// Quitar el contorno al hacer click
			$(this).find('.flower').attr("filter", "");

			if ( ga ) {
				ga('send', 'event', {
					'eventCategory': 'Graph',
					'eventAction': 'Click',
					'eventValue': $(this).data("index")
				});
			}

			PS.EM.trigger(PS.Event.SHOW_OVERLAY, [ self.data, $(this).data("index") ]);
		});
	},

	drawAxis : function() {

		var 
			svg = d3.select("#graph"),
			padding = 40,
			minYear = d3.min(this.data, function(d) { return d.startYear; }),
			maxYear = d3.max(this.data, function(d) { return d.endYear; });

		this.xAxis = d3.svg.axis().scale(this.xScale)
			.ticks( maxYear - minYear )
			.tickFormat( function(d) {

				var diff = maxYear - minYear;
				if ( diff > 60 ) {
					return (d % 10 === 0) ? d : "";
				} else if ( diff > 30 ) {
					return (d % 5 === 0) ? d : "";
				} else {
					return (d % 2 === 0) ? d : "";
				}
			} )
			.orient("bottom");

		this.yAxis = d3.svg.axis().scale(this.yScale)
			.tickFormat(d3.format(".2d"))
			.orient("left");

		svg.append("g").attr("class", "axis axis-x")
			.attr("transform", "translate( 0, 730 )")
			.attr("opacity", 0)
			.call(this.xAxis);

		svg.append("g").attr("class", "axis axis-y")
			.attr("transform", "translate( " + padding + ", 0 )")
			.attr("opacity", 0)
			.call(this.yAxis);

		svg.selectAll(".axis")
			.transition()
				.delay(200)
				.duration(600)
				.attr("opacity", 1);

		var text = svg.append("text");

		text
			.attr("opacity", 0)
			.attr("class", "y label")
			.attr("text-anchor", "end")
			.attr("transform", "translate(34, 80)")
			.transition()
				.delay(200)
				.duration(600)
				.attr("opacity", 1);

		var t1 = text.append("tspan");
		var t2 = text.append("tspan");

		t1
			.text("DURACIÓN")
			.attr("x", -30);
		t2
			.text("(años)")
			.attr("y", 14)
			.attr("x", -30);

		// ADD BTN SCALE
		this.addBtnScale(svg);

		// COLOR THE AXIS
		this.colorAxis( minYear, maxYear );
	},

	colorAxis : function( start, end ) {

		var ticks = this.viz.selectAll('.axis-x .tick');
		ticks.attr('class', function (d) {

			var 
				diff = end - start,
				extraClass = "";

			if ( diff > 60 ) {
				extraClass = (d % 10 === 0) ? "" : " white";
			} else if ( diff > 30 ) {
				extraClass = (d % 5 === 0) ? "" : " white";
			} else {
				extraClass = (d % 2 === 0) ? "" : " white";
			}

			return "tick" + extraClass;
		});
	},

	addBtnScale : function(svg) {

		var blockScale = svg.append("g");

		blockScale.attr("class", "block-btn block-btn-scale")
			.attr("y", 0)
			.attr("x", 0)
			.attr("transform", "translate(14, 63)");

		var icon = blockScale.append("g").attr("class", "icon");

		icon.append("rect")
			.attr("fill", "#fff")
			.attr("width", 38)
			.attr("height", 38);

		icon.append("svg:image")
			.attr("xlink:href", "img/skin/btn-scale.png")
			.attr("width", 21)
			.attr("height", 33)
			.attr("x", 8)
			.attr("y", 3);

		var links = blockScale.append("g")
			.attr("class", "links")
			.attr("transform", "translate(38, 0)");

		links.append("rect")
			.attr("fill", "#fff")
			.attr("width", 230)
			.attr("height", 38);

		links.append("rect")
			.attr("fill", "#9da2a5")
			.attr("x", 129)
			.attr("y", 13)
			.attr("width", 1)
			.attr("height", 13);

		var logScale = links.append("g")
			.attr("class", "btn log-scale btn-selected")
			.attr("data-default", "btn log-scale");

		logScale.append("rect")
			.attr("fill", "#fff")
			.attr("width", 120)
			.attr("height", 20)
			.attr("y", 9);

		logScale.append("text")
			.attr("class", "btn-text")
			.text("Escala logarítmica")
			.attr("y", 24);

		var linearScale = links.append("g")
			.attr("class", "btn linear-scale")
			.attr("data-default", "btn linear-scale");

		linearScale.append("rect")
			.attr("fill", "#fff")
			.attr("width", 83)
			.attr("height", 20)
			.attr("x", 138)
			.attr("y", 9);

		linearScale.append("text")
			.attr("class", "btn-text")
			.text("Escala lineal")
			.attr("x", 138)
			.attr("y", 24);

		icon.on("click", function() {
			var currentClass = links.attr("class");
			
			if ( currentClass == "links" )
				links.attr("class", "links visible");
			else 
				links.attr("class", "links");
		});

		var self = this;
		logScale.on("click", function() {

			var currentClass = logScale.attr("class");
			
			if ( /btn-selected/.test(currentClass) ) return;
			else {
				linearScale.attr("class", linearScale.attr("data-default"));
				logScale.attr("class", currentClass+" btn-selected");
				links.attr("class", "links");
				self.updateScale("log");
			}

		});

		linearScale.on("click", function() {

			var currentClass = linearScale.attr("class");
			
			if ( /btn-selected/.test(currentClass) ) return;
			else {
				logScale.attr("class", logScale.attr("data-default"));
				linearScale.attr("class", currentClass+" btn-selected");
				links.attr("class", "links");
				self.updateScale("linear");
			}

		});
	},

	updateScale : function( type ) {

		if ( type == "linear" ) {

			this.yScale = d3.scale.linear();

		} else {

			this.yScale = d3.scale.log()
				.base(2)
				.clamp(true);
		}

		this.yScale.range([ this.height, this.padding + 80 ]);
		this.updateGraph();
	},

	calcStem : function ( war ) {

		//start,end point
		var startPoint = [ this.xScale(war.startYear), this.height ];
		var endPoint   = [ this.xScale(war.endYear), this.yScale(war.duration) ];
		
		//calc mid point
		var midX = (endPoint[0] - startPoint[0])/2;
		var midY = (endPoint[1] - startPoint[1])/2;
		
		//control points
		var ctrl1 = [startPoint[0] + midX/20, startPoint[1] + midY/2];
		var ctrl2 = [endPoint[0] - midX/20, endPoint[1] - midY/2];
		
		//offset calc
		if(war.direction){
			war.displace(war.speed);
		}else{
			war.displace(-war.speed);
		}
		
		//update ctrl points with offset
		ctrl1[0] = ctrl1[0] + war.offsetX;
		ctrl2[0] = ctrl2[0] + war.offsetX;

		//check if the direction should change
		if(ctrl1[0] < startPoint[0] || ctrl2[0] > endPoint[0]){
			war.direction = !war.direction;
		}

		return 'M' + startPoint[0] + ',' + startPoint[1] + ' C' + ctrl1[0] + ',' + ctrl1[1] + ' ' + ctrl2[0] + ',' + ctrl2[1] + ' ' + endPoint[0] + ',' + endPoint[1];
	},

	animateStem : function() {

		if ( this.paused ) return;

		var 
			self = this,
			stems = self.viz.selectAll('.stem');

		stems.attr('d', function (d) { return self.calcStem(d); });
	},

	onDateFiltered : function( e, start, end ) {

		if ( ga ) {
			ga('send', 'event', {
				'eventCategory': 'Graph',
				'eventAction': 'FilterDate',
				'eventValue': [ start, end ]
			});
		}

		this.paused = true;

		var 
			self = this;

		this.dateHide = [];
		this.dateShow = [];

		this.originalDataSet.forEach( function(d) {

			// Show conflict if its date range overlaps with the selected range
			if ( d.startYear > end || d.endYear < start ) {
				self.dateHide.push(d);
			} else {
				self.dateShow.push(d);
			}

		} );

		this.hideFlowers();
	},

	onSearchFiltered : function(e, query) {

		this.paused = true;

		var self = this;

		this.searchHide = [];
		this.searchShow = [];

		if ( !query || query.length === 0 ) {
			this.searchShow = this.originalDataSet.slice(0);
		} else {
			var q = query.toLowerCase();
			var expandedQueries = PS.Filter.Search.expandSearchQuery ? PS.Filter.Search.expandSearchQuery(q) : [q];
			this.originalDataSet.forEach( function(d) {
				var name = (d.name || '').toLowerCase();
				var countries = (d.countries || '').toLowerCase();
				var location = (d.location || '').toLowerCase();
				var notes = (d.notes || '').toLowerCase();
				var match = false;
				for (var i = 0; i < expandedQueries.length; i++) {
					var searchTerm = expandedQueries[i];
					if ( name.indexOf(searchTerm) > -1 || countries.indexOf(searchTerm) > -1 || location.indexOf(searchTerm) > -1 || notes.indexOf(searchTerm) > -1 ) {
						match = true;
						break;
					}
				}
				if (match) {
					self.searchShow.push(d);
				} else {
					self.searchHide.push(d);
				}
			});
		}

		this.hideFlowers();
	},

	onRegionFiltered : function(e, regions) {

		if ( ga ) {
			ga('send', 'event', {
				'eventCategory': 'Graph',
				'eventAction': 'FilterRegion',
				'eventValue': regions
			});
		}

		this.paused = true;

		var self = this;

		this.regionHide = [];
		this.regionShow = [];

		this.originalDataSet.forEach( function(d) {

			var 
				location = d.location.toLowerCase().split(","),
				match = [];

			for (var i = 0; i < regions.length; i++) {
				for (var j = 0; j < location.length; j++) {
					var loc = location[j].trim().replace(" ", "-");
					if ( regions[i] == loc ) match.push(loc);
				}
			}

			if ( match.length > 0 && match.length == location.length ) {
				self.regionHide.push( d );
			} else {
				self.regionShow.push( d );
			}

		} );

		this.hideFlowers();
	},

	onFatalitiesFiltered : function( e, minDeath, maxDeath ) {

		if ( ga ) {
			ga('send', 'event', {
				'eventCategory': 'Graph',
				'eventAction': 'FilterDeath',
				'eventValue': [ minDeath, maxDeath ]
			});
		}

		this.paused = true;

		var 
			self = this;

		this.deathHide = [];
		this.deathShow = [];

		this.originalDataSet.forEach( function(d) {

			if ( d.fatalitiesInt >= minDeath.fatalitiesInt && d.fatalitiesInt <= maxDeath.fatalitiesInt ) {
				self.deathShow.push(d);
			} else {
				self.deathHide.push(d);
			}

		} );

		this.hideFlowers();
	},

	hideFlowers : function() {

		var self = this;

		// Cancel any running transitions so stale "end" callbacks
		// don't desynchronize the hidden/totalHidden counters
		this.viz.selectAll('.war .flower').interrupt().transition();
		this.viz.selectAll('.war .stem').interrupt().transition();

		this.hidden = 0;
		this.totalHidden = 0;

		this.viz.selectAll('.war')
			.each( function( d ) { 

				var 
					group = d3.select(this),
					flower = group.select(".flower"),
					stem = group.select(".stem");
				
				if ( self.dateShow.indexOf(d) > -1 && self.regionShow.indexOf(d) > -1 && self.deathShow.indexOf(d) > -1 && self.searchShow.indexOf(d) > -1 ) {
					
					// TODO something

				} else {

					self.totalHidden++;
					
					flower.transition()
						.duration(500)
						.ease("exp-in-out")
						.attr('width', 0)
						.attr('height', 0)
						.attr('x', function(){return self.xScale(d.endYear); })
						.attr('y', function(){return self.yScale(d.duration); });
					
					stem.transition()
						.duration(500)
						.delay(150)
						.ease("exp-in-out")
						.attr("stroke-dashoffset", function() { return d.totalLength; })
						.each("end", function() { self.hidden++; self.updateGraph(); } );
				}

			});

		if ( this.totalHidden == this.hidden )
			this.updateGraph();
	},

	updateGraph : function () {

		if ( this.hidden != this.totalHidden ) return;

		var toShow = $.arrayIntersect( this.dateShow, this.deathShow );
		toShow = $.arrayIntersect( toShow, this.regionShow );
		toShow = $.arrayIntersect( toShow, this.searchShow );

		if ( toShow.length === 0 ) {
			this.paused = false;
			return;
		}

		var 
			self = this,
			start = d3.min( toShow, function(d) { return d.startYear; }),
			end = d3.max( toShow, function(d) { return d.endYear; });

		// Add padding when few results so the graph centers properly
		var xSpan = end - start;
		if ( xSpan < 10 ) {
			var xPad = Math.max(5, Math.ceil((10 - xSpan) / 2));
			start = start - xPad;
			end = end + xPad;
		}

		var maxDur = d3.max( toShow, function(d) { return d.duration; });
		if ( maxDur < 2 ) maxDur = 2;

		this.xScale.domain([ start, end ]);
		this.yScale.domain([ 0.8, maxDur ]);

		// this.fatalitiesScale.domain( d3.extent( toShow, function(d){ return d.fatalitiesInt; }) );
		// this.durationScale.domain( d3.extent( toShow, function(d){ return d.fatalitiesInt; }) );

		this.viz.selectAll('.war')
			.each( function( d ) { 

				var 
					group = d3.select(this),
					flower = group.select(".flower"),
					stem = group.select(".stem");
				
				if ( self.dateShow.indexOf(d) > -1 && self.regionShow.indexOf(d) > -1 && self.deathShow.indexOf(d) > -1 && self.searchShow.indexOf(d) > -1 ) {
					
					flower
						.transition()
						.duration(300)
							.attr('width', function(d){return self.fatalitiesScale(d.fatalitiesIntSQRT);})
							.attr('height', function(d){return self.fatalitiesScale(d.fatalitiesIntSQRT);})
							.attr('x', function(d){return self.xScale(d.endYear) - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2);})
							.attr('y', function(d){return self.yScale(d.duration) - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2);});

					stem
						.attr("stroke-dashoffset", "0")
						.transition()
						.duration(300)
							.attr('d', function (d) { return self.calcStem(d); })
							.each("end", function ( d ) { 
								d.totalLength = this.getTotalLength();
								d3.select(this).attr("stroke-dasharray", d.totalLength + " " + d.totalLength );
							});
				}
			});

		self.viz.selectAll(".over-title text")
			.attr('x', function(d){
				d.textWidth = this.getBBox().width;
				var baseX = self.xScale(d.endYear);
				return baseX > 640 ? baseX - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) - d.textWidth - 10 : baseX + (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) + 10;
			})
			.attr('y', function(d){return self.yScale(d.duration) + 9;});

		self.viz.selectAll(".over-title rect")
			.attr('x', function(d){
				var baseX = self.xScale(d.endYear);
				return baseX > 640 ? baseX - (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) - d.textWidth - 10 - 3 : baseX + (self.fatalitiesScale(d.fatalitiesIntSQRT)/2) + 10 - 3;
			})
			.attr('y', function(d){ return self.yScale(d.duration) - 9; });


		self.xAxis
			.tickFormat( function(d) {

				var diff = end - start;
				if ( diff > 60 ) {
					return (d % 10 === 0) ? d : "";
				} else if ( diff > 30 ) {
					return (d % 5 === 0) ? d : "";
				} else {
					return (d % 2 === 0) ? d : "";
				}
			} );
			
		self.viz.selectAll(".axis-x")
			.transition()
			.duration(500).ease("exp-in-out")
			.call( self.xAxis.scale(self.xScale) );

		self.viz.selectAll(".axis-y")
			.transition()
			.duration(500).ease("exp-in-out")
			.call( self.yAxis.scale(self.yScale) );

		self.colorAxis( start, end );

		// Keep crosshair year list in sync with new domain
		if ( PS.Crosshair && PS.Crosshair.refresh ) PS.Crosshair.refresh();

		self.paused = false;
	},

	orderFatalities : function ( a,b ) {
		return a.fatalitiesInt > b.fatalitiesInt ? -1 : ( a.fatalitiesInt < b.fatalitiesInt ? 1 : 0 );
	},

	// Background Timer
	initBGTimer : function() {

		this.BGInterval = setInterval( $.proxy(this.updateBG, this), 20000 );
	},

	updateBG : function() {

		var secondBG = this.BGCurrent == ".bg-graph" ? ".bg-graph-2" : ".bg-graph";

		TweenLite.killTweensOf( this.BGCurrent );
		TweenLite.to( this.BGCurrent, 3, { opacity: 0 });

		TweenLite.killTweensOf(secondBG);
		TweenLite.to(secondBG, 3, { opacity: 1 });

		this.BGCurrent = secondBG;
	},

	stopBGTimer : function() {
		clearInterval( this.BGInterval );
	}
};


PS.Graph.Overlay = {

	data : null,
	
	init : function() {

		PS.EM.on(PS.Event.SHOW_OVERLAY, $.proxy(this.showOverlay, this));
	},

	showOverlay : function ( e, data, indexWar ) {

		this.data = data;
		var warData = data[indexWar];

		TweenMax.ease = Expo.easeInOut;
		TweenLite.ease = Expo.easeInOut;

		this.populateOverlay( warData );
		this.populateNav( warData );

		this.overlayAppear();

		$(".btn-close").on("click", $.proxy(this.hideOverlay, this));
		$(window).on("keyup", $.proxy( this.onKeyUp, this ));
	},

	populateOverlay : function ( warData ) {

		var $overlay = $(".graph-overlay");

		$(".graph-overlay-header-title", $overlay).text(warData.name);
		$(".graph-overlay-header-date", $overlay).text(warData.startYear + "-" + warData.endYear);

		$(".duration .content", $overlay).text( this.formatDuration(warData.durationRaw) );
		$(".fatalities .content", $overlay).text(warData.fatalities);

		if ( warData.yearlyDeaths ) {
			$(".yearly-deaths .content", $overlay).html( this.formatYearlyDeaths(warData.yearlyDeaths) );
			$(".yearly-deaths", $overlay).show();
		} else {
			$(".yearly-deaths", $overlay).hide();
		}

		$(".location .content", $overlay).html( this.formatRegions(warData.location) );
		$(".participants .list", $overlay).html( this.formatCountries(warData.countries) );

		if ( warData.links ) {
			$(".source a", $overlay).attr( "href", warData.links );
			$(".source", $overlay).show();

		} else {
			$(".source", $overlay).hide();
		}

		if ( warData.notes ) {
			$(".notes .content", $overlay).text( warData.notes );
			$(".notes", $overlay).show();
		} else {
			$(".notes", $overlay).hide();
		}


		$("#clone-graph")
			.empty()
			.css({
				"width" : $("#graph").width(),
				"height" : $("#graph").height()
			})
			.append( $(".war[data-index='" + warData.index + "']").clone() );
	},

	populateNav : function( warData ) {

		var 
			$warNav = $(".war-nav"),
			adjacentWars = this.data.filter(function( war ) {
				return war.startYear == warData.startYear && war.endYear == warData.endYear;
			});

		$warNav.empty();
		if ( adjacentWars.length <= 1 ) return;

		$.each(adjacentWars, function(i, war) {

			var $a = $("<a href='#' data-index='" + war.index + "' />")
				.attr("title", war.name)
				.attr("aria-label", "Seleccionar conflicto: " + war.name)
				.attr("data-war-name", war.name);
			if ( war == warData ) $a.addClass("selected");

			$warNav.append( $a );
		});

		$warNav.find("a").on( "click", $.proxy( this.onNavWar, this ));
	},

	onNavWar : function(e) {

		e.preventDefault();

		var 
			selectedEl = $(e.currentTarget),
			selectedIndex = selectedEl.data("index"),
			selectedWar = this.data[selectedIndex];

		if ( selectedEl.hasClass("selected") ) return;

		$(".selected").removeClass("selected");
		selectedEl.addClass("selected");

		this.hideContent( selectedWar );
	},

	hideContent : function( selectedWar ) {

		var self = this;

		TweenLite.killTweensOf(".graph-overlay-header-title, .graph-overlay-header-date, .graph-overlay .line");
		TweenLite.to(".graph-overlay-header-title, .graph-overlay-header-date, .graph-overlay .line", 0.6, { "transform" : "translateY(-50px)", "opacity" : 0, force3D: true, onComplete : function() {

			self.populateOverlay( selectedWar );
			self.formatScrollPane();
			self.showContent();
		} });

		TweenLite.killTweensOf(".graph-overlay table, .war-nav");
		TweenLite.to(".graph-overlay table, .war-nav", 0.6, { "transform" : "translateY(50px)", "opacity" : 0, force3D: true });

		TweenLite.killTweensOf(".graph-overlay .btn-close");
		TweenLite.to(".graph-overlay .btn-close", 0.6, { "opacity" : 0 });
	},

	showContent : function() {

		TweenLite.killTweensOf(".graph-overlay-header-title, .graph-overlay-header-date, .graph-overlay .line");
		TweenLite.to(".graph-overlay-header-title, .graph-overlay-header-date, .graph-overlay .line", 0.6, { "transform" : "translateY(0)", "opacity" : 1, force3D: true, delay : 0.1 });

		TweenLite.killTweensOf(".graph-overlay table, .war-nav");
		TweenLite.to(".graph-overlay table, .war-nav", 0.6, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.2, force3D: true });

		TweenLite.killTweensOf(".graph-overlay .btn-close");
		TweenLite.to(".graph-overlay .btn-close", 0.6, { "opacity" : 1 });
	},

	hideOverlay : function(e) {

		if ( e ) e.preventDefault();

		$(".btn-close").off("click", $.proxy(this.hideOverlay, this));
		this.overlayDisappear();

		$(window).off("keyup", $.proxy( this.onKeyUp, this ));
	},
	
	overlayAppear : function() {

		TweenLite.killTweensOf(".graph-overlay");
		TweenLite.fromTo(".graph-overlay", 0.4, { display : "block" }, { opacity : 1, onComplete : this.formatScrollPane });

		TweenLite.killTweensOf(".graph-overlay .line");
		TweenLite.to(".graph-overlay .line", 0.5, { opacity : 1, width : "40px", "marginLeft" : "-20px", delay : 0.6 });

		TweenLite.killTweensOf(".graph-overlay-header-title, .graph-overlay-header-date");
		TweenLite.to(".graph-overlay-header-title, .graph-overlay-header-date", 0.3, { opacity : 1, delay : 0.6 });

		TweenMax.killTweensOf(".graph-overlay tr");
		TweenMax.staggerTo(".graph-overlay tr", 0.3, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.7, force3D: true }, 0.04);

		TweenLite.killTweensOf(".graph-overlay .war-nav");
		TweenLite.to(".graph-overlay .war-nav", 0.3, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.9, force3D: true });

		TweenLite.killTweensOf(".graph-overlay .btn-close");
		TweenLite.to(".graph-overlay .btn-close", 0.3, { opacity : 1, delay : 1 });
	},
	
	overlayDisappear : function() {

		TweenLite.killTweensOf(".graph-overlay .btn-close");
		TweenLite.to(".graph-overlay .btn-close", 0.3, { opacity : 0 });

		TweenLite.killTweensOf(".graph-overlay .war-nav");
		TweenLite.to(".graph-overlay .war-nav", 0.3, { "transform" : "translateY(20px)", "opacity" : 0, force3D: true });

		TweenMax.killTweensOf(".graph-overlay tr");
		TweenMax.staggerTo(".graph-overlay tr", 0.3, { "transform" : "translateY(20px)", "opacity" : 0, force3D: true }, -0.05);

		TweenLite.killTweensOf(".graph-overlay-header-title, .graph-overlay-header-date");
		TweenLite.to(".graph-overlay-header-title, .graph-overlay-header-date", 0.3, { opacity : 0, delay : 0.2 });

		TweenLite.killTweensOf(".graph-overlay .line");
		TweenLite.to(".graph-overlay .line", 0.3, { opacity : 0, width : "200px", "marginLeft" : "-100px", delay : 0.2 });

		TweenLite.killTweensOf(".graph-overlay");
		TweenLite.to(".graph-overlay", 0.2, { opacity : 0, display : "none", delay : 0.4, onComplete : function() {

			var 
				el = $('.participants .list'),
				api = el.data("jsp");
			
			api.scrollToY(0);
			api.destroy();
			el.attr("style", null);
		} });
	},

	onKeyUp : function(e) {
		if ( e.keyCode == 27 ) this.hideOverlay();
	},

	formatCountries : function ( countryString ) {

		var countryHTML = countryString;

		countryHTML = countryHTML.replace(/, /gi, "<br>");
		countryHTML = countryHTML.replace(/\n/g, "<br>");
		countryHTML = countryHTML.replace(/•/g, "");
		// countryHTML = countryHTML.replace(" ", "");
		countryHTML = countryHTML.trim();

		return "<div>"+countryHTML+"</div>";
	},

	formatRegions : function ( region ) {

		var translations = {'Africa': 'África', 'Asia': 'Asia', 'Europe': 'Europa', 'North America': 'Norteamérica', 'South America': 'Sudamérica'};
		return region.replace(/(Asia|Africa|Europe|North America|South America)/g, function(country) { return '<span class="' + country.toDashed() + '">'+(translations[country] || country)+'</span>'; });
	},

	formatDuration : function( duration ) {
		var raw = (typeof duration === 'number' && duration <= 0.5) ? 0 : duration;
		return raw > 1 ? raw + ' años'  : ( raw <= 0.5 ? 'menos de 1 año' : '1 año' );
	},

	formatYearlyDeaths : function( yearlyStr ) {
		if ( !yearlyStr ) return '';
		var pairs = yearlyStr.split(';');
		var html = '<div class="yearly-deaths-list">';
		for ( var i = 0; i < pairs.length; i++ ) {
			var parts = pairs[i].split(':');
			var year = parts[0];
			var deaths = parseInt(parts[1], 10);
			var formatted = deaths.toLocaleString('es-CL');
			html += '<div class="yearly-item"><span class="yearly-year">' + year + ':</span> <span class="yearly-count">' + formatted + '</span></div>';
		}
		html += '</div>';
		return html;
	},

	formatScrollPane : function() {

		var $list = $('.participants .list');
		$list
			.css("height", "")
			.css("height", $list.height() + 5);
		$list.jScrollPane();
	}

};

PS.Graph.Poppy = PS.Graph.Poppy || {
	
	//lookup method for which svg image to link to
	getPoppy : function ( country ) {

		var 
			countries = country.toLowerCase().trim().split(", "),
			path = 'Global.svg';

		if ( countries.length == 2 && countries.indexOf( "asia" ) > -1 && countries.indexOf( "europe" ) > -1 ) {

			path = 'Europe-Asia.svg';

		} else if ( countries.length == 2 && countries.indexOf( "africa" ) > -1 && countries.indexOf( "europe" ) > -1 ) {

			path = 'Europe-Africa.svg';

		} else if ( countries.length == 2 && countries.indexOf( "north america" ) > -1 && countries.indexOf( "south america" ) > -1 ) {

			path = 'North-South-America.svg';

		} else if ( countries.length == 1 && countries.indexOf( "asia" ) > -1 ) {

			path = 'Asia.svg';

		} else if ( countries.length == 1 && countries.indexOf( "africa" ) > -1 ) {

			path = 'Africa.svg';

		} else if ( countries.length == 1 && countries.indexOf( "europe" ) > -1 ) {

			path = 'Europe.svg';

		} else if ( countries.length == 1 && countries.indexOf( "north america" ) > -1 ) {

			path = 'North-America.svg';

		} else if ( countries.length == 1 && countries.indexOf( "south america" ) > -1 ) {

			path = 'South-America.svg';

		} else {
			path = 'Global.svg';
		}

		return 'img/svg/' + path;

	}
};


/* =========================================================
   PS.Crosshair — Vertical guide line + shared tooltip
   on the existing poppy-field SVG (#graph).
   Shows individual conflicts active at the hovered year,
   respecting all active filters (date, region, deaths, search).
   ========================================================= */

PS.Crosshair = {

	// Colour lookup – matches PS.Colors / SVG filenames
	regionColor : {
		'Africa'        : '#AE0F0A',
		'Asia'          : '#E30613',
		'Europe'        : '#E35E06',
		'North-America' : '#B70D4D',
		'South-America' : '#D2024B',
		'Europe-Asia'   : '#E35E06',
		'Europe-Africa' : '#E35E06',
		'Global'        : '#888888'
	},

	regionLabel : {
		'Africa'        : 'África',
		'Asia'          : 'Asia',
		'Europe'        : 'Europa',
		'North-America' : 'Norteamérica',
		'South-America' : 'Sudamérica',
		'Europe-Asia'   : 'Europa / Asia',
		'Europe-Africa' : 'Europa / África',
		'Global'        : 'Global'
	},

	// References (set on init)
	wars      : null,
	xScale    : null,
	yScale    : null,
	viz       : null,
	guideLine : null,
	tooltip   : null,
	lastYear  : null,
	hideTimer : null,
	hoveringTooltip : false,
	isPinned : false,
	isOverFlower : false,

	/* ---------- public ---------- */

	init : function ( wars, xScale, yScale ) {

		this.wars   = wars;
		this.xScale = xScale;
		this.yScale = yScale;
		this.viz    = d3.select('#graph');

		this.addGuide();
		this.addOverlay();

		this.tooltip = d3.select('.ch-tooltip');
		this.bindTooltipEvents();
		this.tooltip.style('pointer-events', 'none');

		$(window).on('keyup.chCrosshair', function (e) {
			if ( e.keyCode === 27 && self.isPinned ) {
				self.unpinTooltip();
			}
		});
	},

	bindTooltipEvents : function () {
		var self = this;

		$('.ch-tooltip')
			.on('mouseenter', function () {
				self.hoveringTooltip = true;
				if ( self.hideTimer ) {
					clearTimeout(self.hideTimer);
					self.hideTimer = null;
				}
			})
			.on('mouseleave', function () {
				self.hoveringTooltip = false;
				self.onOut();
			})
			.on('click', '.ch-tt-pin', function (e) {
				e.preventDefault();
				e.stopPropagation();

				if ( self.isPinned ) {
					self.unpinTooltip();
				}
			})
			.on('mouseenter', '.ch-tt-row', function () {
				// Aplicar contorno a la flor correspondiente
				var idx = $(this).attr('data-index');
				$('.war[data-index="' + idx + '"] .flower').attr('filter', 'url(#outline)');
			})
			.on('mouseleave', '.ch-tt-row', function () {
				// Quitar contorno de la flor
				var idx = $(this).attr('data-index');
				$('.war[data-index="' + idx + '"] .flower').attr('filter', '');
			})
			.on('click', '.ch-tt-row', function (e) {
				e.preventDefault();
				e.stopPropagation();

				var idx = parseInt($(this).attr('data-index'), 10);
				if ( isNaN(idx) ) return;

				// Quitar contorno antes de mostrar overlay
				$('.war[data-index="' + idx + '"] .flower').attr('filter', '');

				self.tooltip.style('display', 'none');
				self.guideLine.style('display', 'none');
				self.lastYear = null;
				self.unpinTooltip();

				PS.EM.trigger(PS.Event.SHOW_OVERLAY, [ self.wars, idx ]);
			});
	},

	pinTooltip : function () {
		this.isPinned = true;
		this.tooltip.classed('is-pinned', true).style('pointer-events', 'auto');
		this.tooltip.select('.ch-tt-pin').text('Desfijar');
		this.tooltip.select('.ch-tt-hint').text('Año fijado. Haz clic en un conflicto para ver detalles.');
	},

	unpinTooltip : function () {
		this.isPinned = false;
		this.tooltip.classed('is-pinned', false).style('pointer-events', 'none');
		this.tooltip.select('.ch-tt-hint').text('Haz clic en el grafico para fijar este ano y seleccionar con calma.');
	},

	/* ---------- helpers ---------- */

	/** Return the list of wars currently passing all filters */
	getVisibleWars : function () {
		var g = PS.Graph;
		var visible = [];
		for ( var i = 0; i < this.wars.length; i++ ) {
			var w = this.wars[i];
			if ( g.dateShow.indexOf(w) > -1 &&
			     g.regionShow.indexOf(w) > -1 &&
			     g.deathShow.indexOf(w) > -1 &&
			     g.searchShow.indexOf(w) > -1 ) {
				visible.push(w);
			}
		}
		return visible;
	},

	/** Primary region key for a war (first listed in location) */
	primaryRegion : function ( w ) {
		var loc = (w.location || '').split(',')[0].trim();
		return loc || 'Global';
	},

	/** Colour for a war based on its primary region */
	colorFor : function ( w ) {
		var key = this.primaryRegion(w);
		return this.regionColor[key] || this.regionColor['Global'];
	},

	/** Format fatalities compactly: 123 → 123, 12345 → 12.3K, 1234567 → 1.23M */
	fmtFatalities : function ( n ) {
		if ( n >= 1000000 ) return (n / 1000000).toFixed(n >= 10000000 ? 1 : 2) + 'M';
		if ( n >= 1000 )    return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K';
		return String(n);
	},

	/* ---------- SVG elements ---------- */

	addGuide : function () {
		this.guideLine = this.viz.append('line')
			.attr('class', 'ch-guide')
			.attr('y1', 80)
			.attr('y2', 730)
			.style('display', 'none');
	},

	addOverlay : function () {
		var self = this;

		// Escuchar eventos directamente en el SVG (no en un overlay invisible)
		this.viz
			.on('mousemove',  function () { self.onMove( this ); })
			.on('click',      function () { self.onClick( this ); })
			.on('mouseleave', function () { self.onOut(); })
			.on('touchmove',  function () { d3.event.preventDefault(); self.onMove( this ); })
			.on('touchend',   function () { self.onOut(); });
		
		// Escuchar cuando el mouse entra/sale de las flores para desactivar el crosshair
		var $graph = $('#graph');
		$graph.on('mouseenter', '.war', function() {
			self.isOverFlower = true;
			// Ocultar guía cuando estamos sobre una flor
			if (self.guideLine) {
				self.guideLine.style('display', 'none');
			}
		});
		$graph.on('mouseleave', '.war', function() {
			self.isOverFlower = false;
		});
	},

	/* ---------- pointer handlers ---------- */

	onMove : function ( node ) {

		if ( this.isPinned ) return;
		if ( this.isOverFlower ) return;  // No procesar si estamos sobre una flor

		var mouse = d3.mouse( node );
		var xPx   = mouse[0];

		if ( xPx < 75 || xPx > 1205 ) { this.onOut(); return; }

		if ( this.hideTimer ) {
			clearTimeout(this.hideTimer);
			this.hideTimer = null;
		}

		var x0   = this.xScale.invert( xPx );
		var year = Math.round( x0 );

		var dom = this.xScale.domain();
		if ( year < Math.ceil(dom[0]) )  year = Math.ceil(dom[0]);
		if ( year > Math.floor(dom[1]) ) year = Math.floor(dom[1]);

		var snappedX = this.xScale( year );

		// Move guide line
		this.guideLine
			.attr('x1', snappedX).attr('x2', snappedX)
			.style('display', null);

		// Skip heavy rebuild if same year
		if ( year === this.lastYear ) {
			this.positionTooltip();
			return;
		}
		this.lastYear = year;

		this.buildTooltipForYear(year);
	},

	/** Build and display tooltip for a specific year */
	buildTooltipForYear : function ( year, highlightIndex ) {

		// ---- Collect conflicts active in this year ----
		var visible = this.getVisibleWars();
		var active  = [];
		for ( var i = 0; i < visible.length; i++ ) {
			var w = visible[i];
			if ( w.startYear <= year && w.endYear >= year ) {
				active.push(w);
			}
		}

		// Sort by fatalities descending
		active.sort(function (a, b) {
			return (b.fatalitiesInt || 0) - (a.fatalitiesInt || 0);
		});

		// ---- Build tooltip HTML ----
		var html = '<div class="ch-tt-year">' + year + '</div>'
			+ '<div class="ch-tt-actions">'
			+ (this.isPinned ? '<button type="button" class="ch-tt-pin" aria-label="Desfijar año">Desfijar</button>' : '')
			+ '</div>'
			+ '<div class="ch-tt-total">'
			+ '<span class="ch-tt-total-label">Conflictos activos</span>'
			+ '<span class="ch-tt-total-val">' + active.length + '</span>'
			+ '</div>';

		if ( active.length > 0 ) {
			html += '<div class="ch-tt-list">';
			var self = this;
			var max = Math.min(active.length, 25); // cap for performance
			for ( var j = 0; j < max; j++ ) {
				var w = active[j];
				var color = self.colorFor(w);
				var region = self.regionLabel[ self.primaryRegion(w) ] || self.primaryRegion(w);
				var fat = w.fatalitiesInt ? self.fmtFatalities(w.fatalitiesInt) : '—';
				var isHighlighted = (highlightIndex !== undefined && w.index == highlightIndex);

				html += '<div class="ch-tt-row' + (isHighlighted ? ' ch-tt-row-highlight' : '') + '" data-index="' + w.index + '" title="Abrir: ' + w.name + '">'
					+ '<span class="ch-tt-swatch" style="background:' + color + '"></span>'
					+ '<span class="ch-tt-name" title="' + w.name + '">' + w.name + '</span>'
					+ '<span class="ch-tt-val">' + fat + '</span>'
					+ '</div>';
			}
			if ( active.length > max ) {
				html += '<div class="ch-tt-more">+ ' + (active.length - max) + ' más</div>';
			}
			html += '</div>';
		} else {
			html += '<div class="ch-tt-empty">Sin conflictos este año</div>';
		}

		html += '<div class="ch-tt-hint">Haz clic en el grafico para fijar este ano y seleccionar con calma.</div>';

		this.tooltip.html( html ).style('display', 'block');
		this.positionTooltip();
		
		// Scroll to highlighted row if needed
		if (highlightIndex !== undefined) {
			var $row = $('.ch-tt-row[data-index="' + highlightIndex + '"]');
			if ($row.length > 0) {
				var $list = $row.closest('.ch-tt-list');
				if ($list.length > 0) {
					var rowTop = $row.position().top;
					var listHeight = $list.height();
					var rowHeight = $row.outerHeight();
					if (rowTop < 0 || rowTop + rowHeight > listHeight) {
						$list.scrollTop($list.scrollTop() + rowTop - (listHeight / 2) + (rowHeight / 2));
					}
				}
			}
		}
	},

	onClick : function ( node ) {
		var evt = d3.event;
		if ( !evt ) return;
		
		// Si estamos sobre una flor, no procesar el click (las flores tienen su propio handler)
		if ( this.isOverFlower ) return;

		if ( this.isPinned ) {
			this.unpinTooltip();
			return;
		}

		if ( this.lastYear !== null ) {
			this.pinTooltip();
			return;
		}
	},

	positionTooltip : function () {
		var evt   = d3.event;
		if ( !evt ) return;
		var pageX = ( evt.pageX !== undefined ) ? evt.pageX : ( evt.touches ? evt.touches[0].pageX : 0 );
		var pageY = ( evt.pageY !== undefined ) ? evt.pageY : ( evt.touches ? evt.touches[0].pageY : 0 );

		var ttNode = this.tooltip.node();
		var ttW    = ttNode.offsetWidth;
		var ttH    = ttNode.offsetHeight;
		var winW   = window.innerWidth;
		var winH   = window.innerHeight;

		var left = pageX + 16;
		var top  = pageY - ttH / 2;

		if ( left + ttW > winW - 10 ) left = pageX - ttW - 16;
		if ( top < 6 )                top = 6;
		if ( top + ttH > winH - 6 )   top = winH - ttH - 6;

		this.tooltip
			.style('left', left + 'px')
			.style('top',  top  + 'px');
	},

	onOut : function () {
		var self = this;

		if ( this.isPinned ) return;

		if ( this.hideTimer ) {
			clearTimeout(this.hideTimer);
		}

		this.hideTimer = setTimeout(function () {
			if ( self.hoveringTooltip ) return;
			self.guideLine.style('display', 'none');
			self.tooltip.style('display', 'none');
			self.lastYear = null;
			self.hideTimer = null;
		}, 120);
	},

	/* Called when filters change — reset cached year */
	refresh : function () {
		if ( this.isPinned ) {
			this.unpinTooltip();
			this.tooltip.style('display', 'none');
			this.guideLine.style('display', 'none');
		}
		this.lastYear = null;
	}
};


/** Parse the csv data into a workable javascript hash **/
PS.Graph.War = function ( options ) {

	var war = {};
	
	war.index = options.index;
	war.randomness = Math.random();
	war.name = options.wars;
	war.startYear = parseInt( options.from );
	war.endYear = parseInt( options.to );
	war.fatalities = options.fatalities;
	war.fatalitiesInt = options.fatalitiesInt;
	war.fatalitiesIntSQRT = options.fatalitiesIntSQRT;
	war.durationRaw = (war.endYear - war.startYear);
	war.duration = Math.max(war.durationRaw, 0.5);
	war.continent = options.who;

	war.countries = options.participation;
	war.location = options.where;

	war.notes = options.notes;
	war.links = options.links;
	war.yearlyDeaths = options.yearly_deaths || '';

	war.offsetX = 0.0;
	war.offsetY = 0.0;
	war.offsetDirection = 0;
	war.speed = Math.random() / 10;

	war.displace = function(offsetAddition){
		this.offsetX += offsetAddition;
	};

	return war;
};

PS.Filter.Date = PS.Filter.Date || {

	init : function ( minYear, maxYear ) {

		this.$date = $(".date-indicator");
		this.$dateText = $(".indicator-text");
		this.$date.hide();

		$('.filter-date').slider({ 
			min: minYear, 
			max: maxYear, 
			range: true, 
			values: [ minYear, maxYear ] 
		});

		$('.ui-slider-handle').each(function() {
			$(this).addClass('slider-'+$(this).index());     
		});

		$('.ui-slider-handle')
			.on('mouseenter', $.proxy(this.onHandlerOver, this))
			.on('mouseleave', $.proxy(this.onHandlerOut, this));

		$('.filter-date')
			.on('slide', $.proxy(this.onSlide, this))
			.on('slidechange', $.proxy(this.onSlideChange, this));

		TweenLite.killTweensOf('.block-filter-date');
		TweenLite.to('.block-filter-date', 0.8, { opacity : 1, transform : "translateY(0)", force3D : true, delay : 4, ease : Expo.easeInOut });
	},

	onSlide : function ( e, ui ) {

		this.$date
			.css("left", $(ui.handle).css("left") )
			.show();

		this.$dateText.text( ui.value );
	},

	onSlideChange : function ( e, ui ) {
		
		this.$date.hide();

		PS.EM.trigger(PS.Event.DATE_FILTERED, [ ui.values[0], ui.values[1] ]);
	}
};


PS.Filter.Death = PS.Filter.Death || {

	deathRange : null,

	init : function ( deathRange ) {

		deathRange.sort( this.orderFatalities );
		this.deathRange = deathRange;
		
		this.$deathMin = $(".death-min");
		this.$deathMax = $(".death-max");

		this.initSlider();
	},

	initSlider : function() {

		$('.filter-death').slider({
			min: 0,
			max: this.deathRange.length-1,
			range: true,
			values: [ 0, this.deathRange.length-1 ]
		});

		$('.filter-death')
			.on('slide', $.proxy(this.onSlide, this))
			.on('slidechange', $.proxy(this.onSlideChange, this));

		this.$deathMin.text( this.formatNumber(this.deathRange[0]) );
		this.$deathMax.text( this.formatNumber(this.deathRange[this.deathRange.length-1]) );
	},

	onSlide : function ( e, ui ) {
		
		this.$deathMin.text( this.formatNumber(this.deathRange[ ui.values[0] ]) );
		this.$deathMax.text( this.formatNumber(this.deathRange[ ui.values[1] ]) );
	},

	onSlideChange : function ( e, ui ) {

		PS.EM.trigger(PS.Event.FATALITIES_FILTERED, [ this.deathRange[ ui.values[0] ], this.deathRange[ ui.values[1] ] ]);
	},

	orderFatalities : function ( a,b ) {
		return a.fatalitiesInt > b.fatalitiesInt ? 1 : ( a.fatalitiesInt < b.fatalitiesInt ? -1 : 0 );
	},

	formatNumber : function ( d ) {
		
		if ( d.fatalitiesInt >= 1000000 ) {
			var fatalities = d.fatalitiesInt.toString();
			return fatalities.substring(0, fatalities.length - 6) + " Millones";
		}
		return d.fatalities;
	},

	reset : function() {

		var resetArray = [ 0, this.deathRange.length-1 ];

		this.onSlide(null, { values : resetArray });
		$(".filter-death").slider( "values", resetArray);
	}
};

PS.Filter.Panel = PS.Filter.Panel || {

	init : function ( data ) {

		this.currentFilters = [];
		this.$blockFilters = $(".block-filter-death-inside");

		this.$blockFilters.on("click", $.proxy(this.onBtnFilterClicked, this));

		PS.EM.on( PS.Event.REGION_CLICKED, $.proxy(this.onRegionClicked, this) );

		PS.Filter.Region.init();
		PS.Filter.Death.init( data.slice(0) );
		PS.Filter.Search.init( data.slice(0) );
	},

	onBtnFilterClicked : function(e) {

		e.preventDefault();
		$(e.currentTarget).toggleClass("open");
	}
};


PS.Filter.Region = PS.Filter.Region || {

	init : function() {

		$(".block-filter-regions a").on("click", $.proxy(this.onItemClicked, this));
	},

	onItemClicked : function(e) {

		e.preventDefault();

		$(e.currentTarget).toggleClass("unselected");

		var 
			$unselected = $(".block-filter-regions .unselected"),
			regions = [];

		if ( $unselected.length === 5 ) {

			$(".unselected").removeClass("unselected");
			regions = [];

		} else {

			$unselected.each(function ( i, el ) {
				regions.push( $(el).data("region") );
			});
		}
		
		PS.EM.trigger(PS.Event.REGION_FILTERED, [ regions ]);
	}
};


PS.Filter.Search = PS.Filter.Search || {

	// Mapeo de países inglés ↔ español para búsquedas
	countryTranslations : {
		'ukraine': 'ucrania', 'ucrania': 'ukraine',
		'russia': 'rusia', 'rusia': 'russia',
		'syria': 'siria', 'siria': 'syria',
		'mexico': 'méxico', 'méxico': 'mexico',
		'ethiopia': 'etiopía', 'etiopía': 'ethiopia',
		'yemen': 'yemen',
		'iraq': 'irak', 'irak': 'iraq',
		'afghanistan': 'afganistán', 'afganistán': 'afghanistan',
		'nigeria': 'nigeria',
		'sudan': 'sudán', 'sudán': 'sudan',
		'south sudan': 'sudán del sur', 'sudán del sur': 'south sudan',
		'somalia': 'somalia',
		'democratic republic of the congo': 'república democrática del congo', 'república democrática del congo': 'democratic republic of the congo',
		'drc': 'rdc', 'rdc': 'drc',
		'colombia': 'colombia',
		'myanmar': 'birmania', 'birmania': 'myanmar', 'burma': 'birmania',
		'pakistan': 'pakistán', 'pakistán': 'pakistan',
		'india': 'india',
		'israel': 'israel',
		'palestine': 'palestina', 'palestina': 'palestine',
		'turkey': 'turquía', 'turquía': 'turkey',
		'egypt': 'egipto', 'egipto': 'egypt',
		'libya': 'libia', 'libia': 'libya',
		'algeria': 'argelia', 'argelia': 'algeria',
		'morocco': 'marruecos', 'marruecos': 'morocco',
		'mali': 'malí', 'malí': 'mali',
		'niger': 'níger', 'níger': 'niger',
		'chad': 'chad',
		'cameroon': 'camerún', 'camerún': 'cameroon',
		'central african republic': 'república centroafricana', 'república centroafricana': 'central african republic',
		'south africa': 'sudáfrica', 'sudáfrica': 'south africa',
		'mozambique': 'mozambique',
		'angola': 'angola',
		'zimbabwe': 'zimbabue', 'zimbabue': 'zimbabwe',
		'rwanda': 'ruanda', 'ruanda': 'rwanda',
		'burundi': 'burundi',
		'uganda': 'uganda',
		'kenya': 'kenia', 'kenia': 'kenya',
		'tanzania': 'tanzania',
		'eritrea': 'eritrea',
		'lebanon': 'líbano', 'líbano': 'lebanon',
		'jordan': 'jordania', 'jordania': 'jordan',
		'saudi arabia': 'arabia saudita', 'arabia saudita': 'saudi arabia',
		'iran': 'irán', 'irán': 'iran',
		'china': 'china',
		'japan': 'japón', 'japón': 'japan',
		'philippines': 'filipinas', 'filipinas': 'philippines',
		'indonesia': 'indonesia',
		'thailand': 'tailandia', 'tailandia': 'thailand',
		'vietnam': 'vietnam',
		'north korea': 'corea del norte', 'corea del norte': 'north korea',
		'south korea': 'corea del sur', 'corea del sur': 'south korea',
		'united states': 'estados unidos', 'estados unidos': 'united states', 'usa': 'estados unidos', 'eeuu': 'united states',
		'united kingdom': 'reino unido', 'reino unido': 'united kingdom', 'uk': 'reino unido',
		'france': 'francia', 'francia': 'france',
		'germany': 'alemania', 'alemania': 'germany',
		'spain': 'españa', 'españa': 'spain',
		'italy': 'italia', 'italia': 'italy',
		'poland': 'polonia', 'polonia': 'poland',
		'greece': 'grecia', 'grecia': 'greece',
		'serbia': 'serbia',
		'croatia': 'croacia', 'croacia': 'croatia',
		'bosnia': 'bosnia',
		'kosovo': 'kosovo',
		'georgia': 'georgia',
		'armenia': 'armenia',
		'azerbaijan': 'azerbaiyán', 'azerbaiyán': 'azerbaijan',
		'tajikistan': 'tayikistán', 'tayikistán': 'tajikistan',
		'sri lanka': 'sri lanka',
		'nepal': 'nepal',
		'bangladesh': 'bangladés', 'bangladés': 'bangladesh',
		'peru': 'perú', 'perú': 'peru',
		'brazil': 'brasil', 'brasil': 'brazil',
		'argentina': 'argentina',
		'chile': 'chile',
		'venezuela': 'venezuela',
		'ecuador': 'ecuador',
		'bolivia': 'bolivia',
		'haiti': 'haití', 'haití': 'haiti',
		'cuba': 'cuba',
		'guatemala': 'guatemala',
		'el salvador': 'el salvador',
		'honduras': 'honduras',
		'nicaragua': 'nicaragua',
		'burkina faso': 'burkina faso'
	},

	init : function( data ) {

		this.data = data;
		this.$input = $(".search-input");
		this.$clear = $(".search-clear");
		this.$results = $(".search-results");
		this.debounceTimer = null;

		this.$input.on("input", $.proxy(this.onInput, this));
		this.$input.on("focus", $.proxy(this.onFocus, this));
		this.$clear.on("click", $.proxy(this.onClear, this));

		// Close dropdown when clicking outside
		$(document).on("click", $.proxy(function(e) {
			if (!$(e.target).closest(".search-wrapper").length) {
				this.$results.hide();
			}
		}, this));
	},

	// Expandir búsqueda con traducciones
	expandSearchQuery : function(query) {
		var q = query.toLowerCase();
		var queries = [q];
		
		// Agregar traducción si existe
		if (this.countryTranslations[q]) {
			queries.push(this.countryTranslations[q]);
		}
		
		// Buscar coincidencias parciales en las traducciones
		for (var key in this.countryTranslations) {
			if (key.indexOf(q) > -1 || this.countryTranslations[key].indexOf(q) > -1) {
				if (queries.indexOf(key) === -1) queries.push(key);
				if (queries.indexOf(this.countryTranslations[key]) === -1) queries.push(this.countryTranslations[key]);
			}
		}
		
		return queries;
	},

	onInput : function(e) {
		var self = this;
		var query = this.$input.val().trim();

		// Show/hide clear button
		if ( query.length > 0 ) {
			this.$clear.show();
		} else {
			this.$clear.hide();
		}

		// Debounce
		clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(function() {
			self.doSearch(query);
		}, 200);
	},

	onFocus : function(e) {
		var query = this.$input.val().trim();
		if ( query.length > 0 ) {
			this.showSuggestions(query);
		} else {
			// Mostrar países populares cuando el campo está vacío
			this.showPopularCountries();
		}
	},

	onClear : function(e) {
		this.$input.val("");
		this.$clear.hide();
		this.$results.hide();
		PS.EM.trigger(PS.Event.SEARCH_FILTERED, [ "" ]);
	},

	showPopularCountries : function() {
		var countryCounts = {};
		
		// Contar conflictos por país
		for (var i = 0; i < this.data.length; i++) {
			var d = this.data[i];
			var countries = (d.countries || '').split(',');
			for (var j = 0; j < countries.length; j++) {
				var c = countries[j].trim();
				if (c) {
					countryCounts[c] = (countryCounts[c] || 0) + 1;
				}
			}
		}
		
		// Convertir a array y ordenar por cantidad
		var sorted = [];
		for (var country in countryCounts) {
			sorted.push({ name: country, count: countryCounts[country] });
		}
		sorted.sort(function(a, b) { return b.count - a.count; });
		sorted = sorted.slice(0, 15);
		
		this.$results.empty();
		this.$results.append('<div class="search-section-title">Países con más conflictos</div>');
		
		var self = this;
		for (var k = 0; k < sorted.length; k++) {
			var item = sorted[k];
			var $item = $('<div class="search-item search-country">' +
				'<span class="search-item-flag">🌍</span>' +
				'<span class="search-item-name">' + item.name + '</span>' +
				'<span class="search-item-count">' + item.count + ' conflictos</span>' +
			'</div>');
			$item.data('country', item.name);
			$item.on('click', function() {
				var country = $(this).data('country');
				self.$input.val(country);
				self.$clear.show();
				self.$results.hide();
				PS.EM.trigger(PS.Event.SEARCH_FILTERED, [ country ]);
			});
			this.$results.append($item);
		}
		
		this.$results.show();
	},

	doSearch : function(query) {
		PS.EM.trigger(PS.Event.SEARCH_FILTERED, [ query ]);
		if ( query.length > 0 ) {
			this.showSuggestions(query);
		} else {
			this.$results.hide();
		}
	},

	showSuggestions : function(query) {
		var q = query.toLowerCase();
		var expandedQueries = this.expandSearchQuery(q);
		var matchesByName = [];
		var matchesByCountry = [];
		var matchingCountries = {};

		for (var i = 0; i < this.data.length; i++) {
			var d = this.data[i];
			var name = (d.name || '').toLowerCase();
			var countries = (d.countries || '').toLowerCase();
			var location = (d.location || '').toLowerCase();
			var notes = (d.notes || '').toLowerCase();
			
			var nameMatch = false;
			var countryMatch = false;
			
			// Buscar con todas las variantes de la consulta
			for (var qi = 0; qi < expandedQueries.length; qi++) {
				var searchTerm = expandedQueries[qi];
				if (name.indexOf(searchTerm) > -1 || notes.indexOf(searchTerm) > -1) {
					nameMatch = true;
				}
				if (countries.indexOf(searchTerm) > -1 || location.indexOf(searchTerm) > -1) {
					countryMatch = true;
				}
			}
			
			if ( nameMatch ) {
				matchesByName.push(d);
			} else if ( countryMatch ) {
				matchesByCountry.push(d);
				// Extraer los países que coinciden
				var countryList = (d.countries || '').split(',');
				for (var k = 0; k < countryList.length; k++) {
					var c = countryList[k].trim();
					var cLower = c.toLowerCase();
					for (var qj = 0; qj < expandedQueries.length; qj++) {
						if (cLower.indexOf(expandedQueries[qj]) > -1) {
							matchingCountries[c] = (matchingCountries[c] || 0) + 1;
							break;
						}
					}
				}
			}
		}

		// Sort by fatalities descending
		matchesByName.sort(function(a, b) { return (b.fatalitiesInt || 0) - (a.fatalitiesInt || 0); });
		matchesByCountry.sort(function(a, b) { return (b.fatalitiesInt || 0) - (a.fatalitiesInt || 0); });
		
		matchesByName = matchesByName.slice(0, 8);
		matchesByCountry = matchesByCountry.slice(0, 8);

		this.$results.empty();
		var self = this;
		var locTranslations = {'Africa': 'África', 'Asia': 'Asia', 'Europe': 'Europa', 'North America': 'Norteamérica', 'South America': 'Sudamérica'};

		// Mostrar países que coinciden primero
		var countryKeys = Object.keys(matchingCountries);
		if (countryKeys.length > 0) {
			this.$results.append('<div class="search-section-title">Países</div>');
			countryKeys = countryKeys.slice(0, 5);
			for (var ci = 0; ci < countryKeys.length; ci++) {
				var countryName = countryKeys[ci];
				var $countryItem = $('<div class="search-item search-country">' +
					'<span class="search-item-flag">🌍</span>' +
					'<span class="search-item-name">' + countryName + '</span>' +
					'<span class="search-item-count">' + matchingCountries[countryName] + ' conflictos</span>' +
				'</div>');
				$countryItem.data('country', countryName);
				$countryItem.on('click', function() {
					var country = $(this).data('country');
					self.$input.val(country);
					self.$clear.show();
					self.$results.hide();
					PS.EM.trigger(PS.Event.SEARCH_FILTERED, [ country ]);
				});
				this.$results.append($countryItem);
			}
		}

		// Mostrar conflictos que coinciden por nombre
		if (matchesByName.length > 0) {
			this.$results.append('<div class="search-section-title">Conflictos</div>');
			for (var j = 0; j < matchesByName.length; j++) {
				var m = matchesByName[j];
				var fat = m.fatalities || '';
				var years = m.startYear + (m.endYear !== m.startYear ? '-' + m.endYear : '');
				var locDisplay = locTranslations[m.location] || m.location;
				var $item = $('<div class="search-item">' +
					'<span class="search-item-name">' + m.name + '</span>' +
					'<span class="search-item-meta">' + years + ' &middot; ' + fat + ' muertes &middot; ' + locDisplay + '</span>' +
				'</div>');
				$item.data('warName', m.name);
				$item.on('click', function() {
					var warName = $(this).data('warName');
					self.$input.val(warName);
					self.$clear.show();
					self.$results.hide();
					PS.EM.trigger(PS.Event.SEARCH_FILTERED, [ warName ]);
				});
				this.$results.append($item);
			}
		}

		// Mostrar conflictos que solo coinciden por país
		if (matchesByCountry.length > 0 && matchesByName.length === 0) {
			this.$results.append('<div class="search-section-title">Conflictos en ese país</div>');
			for (var jc = 0; jc < matchesByCountry.length; jc++) {
				var mc = matchesByCountry[jc];
				var fatC = mc.fatalities || '';
				var yearsC = mc.startYear + (mc.endYear !== mc.startYear ? '-' + mc.endYear : '');
				var locDisplayC = locTranslations[mc.location] || mc.location;
				var $itemC = $('<div class="search-item">' +
					'<span class="search-item-name">' + mc.name + '</span>' +
					'<span class="search-item-meta">' + yearsC + ' &middot; ' + fatC + ' muertes &middot; ' + locDisplayC + '</span>' +
				'</div>');
				$itemC.data('warName', mc.name);
				$itemC.on('click', function() {
					var warName = $(this).data('warName');
					self.$input.val(warName);
					self.$clear.show();
					self.$results.hide();
					PS.EM.trigger(PS.Event.SEARCH_FILTERED, [ warName ]);
				});
				this.$results.append($itemC);
			}
		}

		if (matchesByName.length === 0 && matchesByCountry.length === 0 && countryKeys.length === 0) {
			this.$results.append('<div class="search-item search-empty">Sin resultados</div>');
		}

		this.$results.show();
	}
};


PS.Animation = PS.Animation || {

	baseDuration : 1,
	baseDelay : 0.3,

	toState0 : function() {

		// Hide STATE 1
		this.hideState1();

		TweenLite.killTweensOf(".main-flower");
		TweenLite.to(".main-flower", this.baseDuration / 2, { "transform" : "translateY(0)", "width" : 0, "margin" : 0, force3D: true });

		// SHOW State 0
		$(".block-intro")
			.show()
			.css("z-index", 100);

		$(".down-arrow").addClass("white");

		d3.select(".bg-inside circle")
			.transition()
			.duration(1000)
			.ease("exp-in-out")
			.attr("r", "100%");

		TweenLite.killTweensOf(".block-intro .subtitle");
		TweenLite.to(".block-intro .subtitle", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.5, force3D: true });

		TweenLite.killTweensOf(".down-arrow");
		TweenLite.to(".down-arrow", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 1, force3D: true });

		TweenMax.killTweensOf(".overlay-btns .btn-overlay:not(.back)");
		TweenMax.staggerTo(".overlay-btns .btn-overlay:not(.back)", this.baseDuration, { "transform" : "translateX(114px)", "opacity" : 1, delay : 1.1, force3D: true }, 0.04);

		TweenMax.killTweensOf(".scroll-indicator .scroll-state");
		TweenMax.staggerTo(".scroll-indicator .scroll-state", this.baseDuration, { "transform" : "translateX(0)", "opacity" : 1, delay : 1.2, force3D: true }, 0.04);

	},

	toState1 : function( index ) {

		// Hide titles and text from STATE 0
		this.hideState0();
		this.hideState2();

		$(".down-arrow").removeClass("white");
		
		// SHOW titles and text from STATE 1
		$(".block-caption")
			.show()
			.css("z-index", 100);

		var delay = ( index == 2 ) ? 0 : 0.5;
		TweenLite.killTweensOf(".main-flower");
		TweenLite.to(".main-flower", this.baseDuration, { "transform" : "translateY(0)", "width" : 170, "margin" : "-85px 0 0 -85px", delay: delay, force3D : true, onComplete : $.proxy(this.toState1_1, this) });

	},

	toState1_1 : function() {

		TweenLite.killTweensOf(".main-flower");
		TweenLite.to(".main-flower", this.baseDuration, { "transform" : "translateY(-180px)", force3D : true });

		TweenLite.killTweensOf(".caption-stem");
		TweenLite.to(".caption-stem", this.baseDuration, { height : "359px", delay : 0.3 } );

		TweenLite.killTweensOf(".caption-start");
		TweenLite.to(".caption-start", this.baseDuration, { "opacity" : 1, delay : 0.55 });

		TweenLite.killTweensOf(".caption-line");
		TweenLite.to(".caption-line", this.baseDuration, { "height" : "416px", delay : 0.8 });
		
		TweenLite.killTweensOf(".caption-end");
		TweenLite.to(".caption-end", this.baseDuration, { "opacity" : 1, delay : 1.05 });

		TweenLite.killTweensOf(".caption-duration");
		TweenLite.to(".caption-duration", this.baseDuration, { "opacity" : 1, delay : 1.05 });

		TweenLite.to(".main-flower", this.baseDuration/2, { "transform" : "translateY(-180px)", "width" : 218, "margin" : "-109px 0 0 -109px", delay : 1.8 });

		TweenLite.killTweensOf(".caption-circle");
		TweenLite.to(".caption-circle", this.baseDuration, { "opacity" : 1, delay : 1.85 });

		TweenLite.killTweensOf(".caption-death");
		TweenLite.to(".caption-death", this.baseDuration, { "opacity" : 1, delay : 1.9 });

		TweenLite.killTweensOf(".block-caption-text");
		TweenLite.to(".block-caption-text", this.baseDuration, { "opacity" : 1, delay : 2.1 });

	},

	toState2 : function() {

		// Hide STATE 1
		this.hideState1();
		this.hideState3();
		
		// SHOW
		$(".block-text")
			.show()
			.css("z-index", 100);

		TweenLite.killTweensOf( ".down-arrow" );
		TweenLite.to( ".down-arrow", this.baseDuration, { opacity : 1, transform: "translateY(0)", ease : Expo.easeInOut, force3D : true, delay : 0.05 } );

		TweenLite.killTweensOf(".main-flower");
		TweenLite.to(".main-flower", this.baseDuration, { "transform" : "translateY(-85px)", "width" : 170, "margin" : "-85px 0 0 -85px", force3D: true });

		TweenLite.killTweensOf(".block-text .date");
		TweenLite.to(".block-text .date", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.25, force3D : true });

		TweenLite.killTweensOf(".block-text .text");
		TweenLite.to(".block-text .text", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.25, force3D : true });

	},

	toState3 : function() {

		// HIDE
		this.hideState2();
		this.hideState4();
		
		TweenLite.killTweensOf( ".down-arrow" );
		TweenLite.to( ".down-arrow", this.baseDuration, { opacity : 0, transform: "translateY(10px)", ease : Expo.easeInOut, force3D : true, delay : 0.05 } );
		
		// SHOW
		$(".block-explore")
			.show()
			.css("z-index", 100);

		TweenLite.killTweensOf(".block-explore .date");
		TweenLite.to(".block-explore .date", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.25, force3D : true });

		TweenLite.killTweensOf(".block-explore .text");
		TweenLite.to(".block-explore .text", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.25, force3D : true });

		TweenLite.killTweensOf(".block-explore-btn");
		TweenLite.to(".block-explore-btn", this.baseDuration, { "transform" : "translateY(0)", "opacity" : 1, delay : 0.35, force3D : true });
		
	},

	hideState0 : function() {

		$(".block-intro").css("z-index", "");

		d3.select(".bg-inside circle")
			.transition()
			.duration(1400)
			.ease("exp-out")
			.attr("r", "0%")
			.each("end", function() {
				TweenLite.killTweensOf(".block-intro .subtitle");
				TweenLite.to(".block-intro .subtitle", 0, { "transform" : "translateY(30px)", "opacity" : 0 });
			});

	},

	hideState1 : function() {

		$(".block-caption").css("z-index", "");

		TweenLite.killTweensOf(".caption-stem");
		TweenLite.to(".caption-stem", this.baseDuration/2, { height : 0 } );

		TweenLite.killTweensOf(".caption-line");
		TweenLite.to(".caption-line", this.baseDuration/2, { "height" : 0 });

		TweenLite.killTweensOf(".caption-circle");
		TweenLite.to(".caption-circle", this.baseDuration/2, { "opacity" : 0 });

		TweenLite.killTweensOf(".caption-start");
		TweenLite.to(".caption-start", this.baseDuration/2, { "opacity" : 0 });

		TweenLite.killTweensOf(".caption-end");
		TweenLite.to(".caption-end", this.baseDuration/2, { "opacity" : 0 });

		TweenLite.killTweensOf(".caption-death");
		TweenLite.to(".caption-death", this.baseDuration/2, { "opacity" : 0 });

		TweenLite.killTweensOf(".caption-duration");
		TweenLite.to(".caption-duration", this.baseDuration/2, { "opacity" : 0 });

		TweenLite.killTweensOf(".block-caption-text");
		TweenLite.to(".block-caption-text", this.baseDuration/2, { "opacity" : 0 });
		
	},

	hideState2 : function() {

		$(".block-text").css("z-index", "");

		TweenLite.killTweensOf(".block-text .date");
		TweenLite.to(".block-text .date", this.baseDuration, { "transform" : "translateY(-100px)", "opacity" : 0, force3D : true });

		TweenLite.killTweensOf(".block-text .text");
		TweenLite.to(".block-text .text", this.baseDuration, { "transform" : "translateY(100px)", "opacity" : 0, force3D : true });
		
	},

	hideState3 : function() {

		$(".block-explore").css("z-index", "");

		TweenLite.killTweensOf(".block-explore .date");
		TweenLite.to(".block-explore .date", this.baseDuration, { "transform" : "translateY(-100px)", "opacity" : 0, force3D : true });

		TweenLite.killTweensOf(".block-explore .text");
		TweenLite.to(".block-explore .text", this.baseDuration, { "transform" : "translateY(100px)", "opacity" : 0, force3D : true });

		TweenLite.killTweensOf(".block-explore-btn");
		TweenLite.to(".block-explore-btn", this.baseDuration, { "transform" : "translateY(150px)", "opacity" : 0, force3D : true });

	},

	hideState4 : function() {

		TweenLite.killTweensOf(".main-flower");
		TweenLite.to(".main-flower", this.baseDuration, { "transform" : "translateY(-85px)", "opacity" : 1, "width" : 170, "margin" : "-85px 0 0 -85px", force3D : true });

		TweenMax.killTweensOf(".scroll-indicator .scroll-state");
		TweenMax.staggerTo(".scroll-indicator .scroll-state", this.baseDuration, { "transform" : "translateX(0)", "opacity" : 1, force3D: true }, 0.04);

	},

	toState4 : function() {
		
		var index = 0;

		// HIDE
		this.hideState3();

		TweenLite.killTweensOf(".main-flower");
		TweenLite.to(".main-flower", this.baseDuration, { "transform" : "translateY(-140px)", "opacity" : 0, force3D : true });

		TweenMax.killTweensOf(".overlay-btns .btn-overlay.back");
		TweenMax.to(".overlay-btns .btn-overlay.back", this.baseDuration, { "transform" : "translateX(114px)", "opacity" : 1, force3D: true });

		TweenMax.killTweensOf(".scroll-indicator .scroll-state");
		TweenMax.staggerTo(".scroll-indicator .scroll-state", this.baseDuration, { "transform" : "translateX(20px)", "opacity" : 0, force3D: true, onComplete : function() {
			index++;
			if ( index == 3 ) PS.EM.trigger(PS.Event.INTRO_HIDDEN);
		} }, 0.04);
	},

	hideGraph : function() {

		TweenLite.killTweensOf(".bg-graph");
		TweenLite.to(".bg-graph", 1, { opacity: 0 });

		TweenLite.killTweensOf(".bg-graph-2");
		TweenLite.to(".bg-graph-2", 1, { opacity: 0 });

		TweenLite.killTweensOf('#graph');
		TweenLite.to('#graph', 0.8, { opacity : 0, delay : 0.3, ease : Expo.easeInOut, onComplete : function() {
			
			PS.EM.trigger(PS.Event.GRAPH_HIDDEN);
		}  });

		TweenLite.killTweensOf('.block-filter-date');
		TweenLite.to('.block-filter-date', 0.8, { opacity : 0, transform : "translateY(50px)", force3D : true, ease : Expo.easeInOut });

		TweenLite.killTweensOf(".block-filter-top");
		TweenLite.to(".block-filter-top", 0.8, { opacity : 0, transform : "translateY(-175px)", force3D : true, ease : Expo.easeInOut });

		TweenMax.killTweensOf(".overlay-btns .btn-overlay.back");
		TweenMax.to(".overlay-btns .btn-overlay.back", this.baseDuration, { "transform" : "translateX(150px)", "opacity" : 0, force3D: true });
	},

	reset : function() {

		// GENERAL
		TweenLite.killTweensOf(".main-flower");
		$(".main-flower").attr("style", "");

		TweenMax.killTweensOf(".scroll-indicator .scroll-state");
		$(".scroll-indicator .scroll-state").attr("style", "");
		$(".scroll-indicator .scroll-state.selected").removeClass("selected");
		$(".scroll-indicator .scroll-state-0").addClass("selected");

		// BLOCKS CONTENT
		$(".block-intro, .block-caption, .block-text, .block-explore").attr("style", "");

		// Block Caption
		TweenLite.killTweensOf(".caption-stem");
		TweenLite.killTweensOf(".caption-line");
		TweenLite.killTweensOf(".caption-circle");
		TweenLite.killTweensOf(".caption-start");
		TweenLite.killTweensOf(".caption-end");
		TweenLite.killTweensOf(".caption-death");
		TweenLite.killTweensOf(".caption-duration");
		TweenLite.killTweensOf(".block-caption-text");
		$(".caption-stem, .caption-line, .caption-circle, .caption-start, .caption-end, .caption-death, .caption-duration, .block-caption-text")
			.attr("style", "");

		// Block Text
		TweenLite.killTweensOf(".block-text .date");
		TweenLite.killTweensOf(".block-text .text");
		$(".block-text .date, .block-text .text").attr("style", "");

		// Block Explore
		TweenLite.killTweensOf(".block-explore .date");
		TweenLite.killTweensOf(".block-explore .text");
		TweenLite.killTweensOf(".block-explore-btn");
		$(".block-explore .date, .block-explore .text, .block-explore-btn").attr("style", "");

	}
};

PS.Buttons = PS.Buttons || {

	currentIndex : 0,

	init : function() {

		this.initInfo();
		this.initSocial();

		TweenMax.ease = Expo.easeInOut;
		TweenLite.ease = Expo.easeInOut;
	},

	initInfo : function() {

		this.$overlayInfo = $(".overlay-content");

		$(".info").on("click", $.proxy(this.onInfoClicked, this));
		$(".back").on("click", $.proxy(this.onBackClicked, this));
		this.$overlayInfo.delegate(".btn-close-overlay", "click", $.proxy(this.onInfoClose, this));
	},

	onInfoClicked : function(e) {

		e.preventDefault();

		if ( ga ) {
			ga('send', 'event', {
				'eventCategory': 'Intro',
				'eventAction': 'Click',
				'eventValue': 'info'
			});
		}

		TweenLite.killTweensOf(".overlay-content");
		TweenLite.to(".overlay-content", 1, { opacity : 1, display: "block" });

		TweenLite.killTweensOf(".overlay-content .block-quote");
		TweenLite.to(".overlay-content .block-quote", 0.8, { opacity : 1, transform : "translateY(0)", delay : 0.7 });

		TweenMax.killTweensOf(".overlay-content .right-col, .overlay-content .left-col");
		TweenMax.staggerTo(".overlay-content .right-col, .overlay-content .left-col", 0.8, { "transform" : "translateY(0)", "opacity" : 1, delay : 1, force3D: true }, 0.08);

		$("html, body").css("height", "100%");
		PS.Controls.reset();
	},

	onBackClicked : function(e) {

		e.preventDefault();

		if ( ga ) {
			ga('send', 'event', {
				'eventCategory': 'Intro',
				'eventAction': 'Click',
				'eventValue': 'back'
			});
		}

		PS.Animation.hideGraph();
	},

	onInfoClose : function(e) {

		e.preventDefault();

		TweenLite.killTweensOf(".overlay-content");
		TweenLite.to(".overlay-content", 1, { opacity : 0, display: "none", delay : 0.7, onComplete : function() {
			$(window).trigger("resize");
		} });

		TweenLite.killTweensOf(".overlay-content .block-quote");
		TweenLite.to(".overlay-content .block-quote", 0.8, { opacity : 0, transform : "translateY(40px)" });

		TweenMax.killTweensOf(".overlay-content .right-col, .overlay-content .left-col");
		TweenMax.staggerTo(".overlay-content .right-col, .overlay-content .left-col", 0.8, { "transform" : "translateY(40px)", "opacity" : 0, force3D: true }, 0.04);
	},

	initSocial : function () {

		$(".btn-facebook, .btn-twitter", ".overlay-btns")
			.on("click", function(e) {
				e.preventDefault();
			});

		$(".fb, .tw, .info, .back", ".overlay-btns")
			.on("mouseenter", $.proxy( this.onOver, this ))
			.on("mouseleave", $.proxy( this.onOut, this ));

	},

	onOver : function(e) {

		TweenLite.killTweensOf( e.currentTarget );
		TweenLite.to(e.currentTarget, 0.4, { transform : "translateX(0)", force3D : true, ease : Expo.easeInOut });
	},

	onOut : function(e) {

		TweenLite.killTweensOf( e.currentTarget );
		TweenLite.to(e.currentTarget, 0.3, { transform : "translateX(114px)", force3D : true, ease : Expo.easeInOut });
	}
};

PS.Controls = PS.Controls || {

	index : null,
	$wrapper : null,

	init : function() {

		TweenLite.defaultEase = Expo.easeInOut;

		this.$wrapper = $("#wrapper");
		this.scrollPosition = $(".scroll-position", this.$wrapper);
		
		PS.Buttons.init();
		
		this.initCircleBG();
		this.initDownArrow();
		this.initKeyArrow();
		this.initDots();
		this.initExplore();

		this.addEvents();

		this.resize();
		this.onScroll();
	},

	initCircleBG : function() {

		d3.select(".bg-inside").append("circle")
			.attr("cx","50%")
			.attr("cy","50%")
			.attr("r","100%")
			.attr("fill","black");
	},

	initDownArrow : function() {

		$(".down-arrow").on("click", function(e) {
			e.preventDefault();

			var 
				scrollTop = $(document).scrollTop(),
				target = 901;

			if ( scrollTop > 2400 ) {

				return;

			} else if ( scrollTop > 1600 ) {

				target = 2401;

			} else if ( scrollTop > 800 ) {

				target = 1601;
			}

			TweenLite.killTweensOf( window );
			TweenLite.to(window, 1, { scrollTo:{ y:target }, force3D : true });
		});
	},

	initKeyArrow : function() {

		$(window).on("keyup", function(e) {
			e.preventDefault();

			var 
				scrollTop = $(document).scrollTop(),
				target = null;

			if ( e.keyCode == 38 ) {

				if ( scrollTop > 2400 ) {

					target = 2400;

				} else if ( scrollTop > 1600 ) {

					target = 1600;

				} else if ( scrollTop > 900 ) {

					target = 900;

				} else {
					
					target = 0;
				}
			}

			if ( e.keyCode == 40 ) {

				if ( scrollTop > 2400 ) {

					return;

				} else if ( scrollTop > 1600 ) {

					target = 2401;

				} else if ( scrollTop > 800 ) {

					target = 1601;
				} else {

					target = 901;
				}
			}

			TweenLite.killTweensOf( window );
			TweenLite.to(window, 1, { scrollTo:{ y:target }, force3D : true });
		});

	},

	initDots : function() {

		var scrollValues = [ 0, 801, 1601, 2401, 3201 ];

		$(".scroll-state").on("click", function(e) {
			
			e.preventDefault();
			
			var target = scrollValues[ $(this).data("index") ];

			TweenLite.killTweensOf( window );
			TweenLite.to(window, 1, { scrollTo:{ y:target }, force3D : true });
		});
	},

	initExplore : function() {

		var self = this;
		$(".btn-explore").on("click", function(e) {
			
			e.preventDefault();

			if ( ga ) {
				ga('send', 'event', {
					'eventCategory': 'Intro',
					'eventAction': 'Click',
					'eventValue': 'explore'
				});
			}

			self.removeScrollEvent();
			PS.Animation.toState4();
		});
	},

	addEvents : function() {

		$(window).on("resize", function() {
			PS.Controls.resize();
		});

		PS.EM.on(PS.Event.INTRO_HIDDEN, $.proxy(this.onIntroHidden, this));
		$(window).on("scroll", $.proxy(this.onScroll, this));
	},

	removeScrollEvent : function() {

		$(window).off("scroll", $.proxy(this.onScroll, this));
	},

	onIntroHidden : function() {

		$(".block-caption, .block-explore, .block-text").hide();
		$(".block-graph").show();

		$(window).off("resize");
		$("html, body").css("height", "100%");
		$("html").css("overflow-y", "scroll");
		
		PS.EM.off(PS.Event.INTRO_HIDDEN, $.proxy(this.onIntroHidden, this));
		PS.EM.on(PS.Event.GRAPH_HIDDEN, $.proxy(this.onGraphHidden, this));
		PS.Graph.init();
	},

	onGraphHidden : function() {

		PS.Graph.stopBGTimer();
		PS.Animation.reset();
		$(".intro").show();
		$(".block-graph").hide();
		$("#graph > :not(defs)").remove();

		PS.Animation.toState0( 0 );
		PS.Controls.addEvents();
		$(window).trigger("resize");
	},

	onScroll : function() {

		var scrollTop = $(document).scrollTop();
		
		if ( scrollTop > 2400 ) {

			if ( this.index == 3 ) return;
			PS.Animation.toState3( this.index );
			this.index = 3;

			$(".scroll-state.selected").removeClass("selected");
			$(".scroll-state-3").addClass("selected");

		} else if ( scrollTop > 1600 ) {

			if ( this.index == 2 ) return;
			PS.Animation.toState2( this.index );
			this.index = 2;

			$(".scroll-state.selected").removeClass("selected");
			$(".scroll-state-2").addClass("selected");

		} else if ( scrollTop > 800 ) {

			if ( this.index == 1 ) return;
			PS.Animation.toState1( this.index );
			this.index = 1;

			$(".scroll-state.selected").removeClass("selected");
			$(".scroll-state-1").addClass("selected");
		
		} else {

			if ( this.index === 0 ) return;
			PS.Animation.toState0( this.index );
			this.index = 0;

			$(".scroll-state.selected").removeClass("selected");
			$(".scroll-state-0").addClass("selected");
		}
	},

	resize : function() {

		if ( $(".overlay-content").css("display") == "block" ) return;
		
		this.WHEIGHT = $(window).height();
		$("html, body").css("height", 3200 + this.WHEIGHT);
		$("#wrapper").css("height", this.WHEIGHT);
	},

	reset : function() {

		PS.Animation.reset();
	}

};

/*
 *
 *
 * D3 UTILS
 *
 *
 *
 */

if ( d3 ) {
	
	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	};

	d3.selection.prototype.moveToBack = function() { 
		return this.each(function() { 
			var firstChild = this.parentNode.firstChild; 
			if (firstChild) { 
				this.parentNode.insertBefore(this, firstChild); 
			} 
		});
	};

}

/*
 *
 *
 * GLOBAL UTILS
 *
 *
 *
 */

$.arrayIntersect = function(a, b) {
  return $.grep(a, function(i) {
    return $.inArray(i, b) > -1;
  });
};

if (!String.prototype.trim) {
  (function(){  
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function () {
      return this.replace(rtrim, "");
    };
  })();
}

String.prototype.toCamelCase = function() {
  return this
      .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
      .replace(/\s/g, '')
      .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
};

String.prototype.toDashed = function() {
  return this.replace(/\s+/g, '-').toLowerCase();
};

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

  Array.prototype.forEach = function(callback, thisArg) {

    var T, k;

    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = thisArg;
    }

    // 6. Let k be 0
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}