import d3 from 'd3';

export default class ArcDiagram {
	constructor(data, id) {
		this._graph = data;
		this._id = id;
		this._margin = 20;															// amount of margin around plot area
		this._pad = this._margin / 2;												// actual padding amount
		this._radius = 3;															// fixed node radius
		this._width  = $("#" + this._id).parent().width();			// width of svg image
		this._height = this._width / 2.4;         						// height of svg image
		this._yfixed = this._height - this._pad - this._radius;						// y position for all nodes
	}
	
	draw() {
		var svg  = d3.select("#" + this._id)
			.attr("width", this._width)
			.attr("height", this._height);

		// create plot area within svg image
		var plot = svg.append("g")
			.attr("id", this._id + "-g")
			.attr("transform", "translate(" + this._pad + ", " + this._pad + ")");

		// fix graph links to map to objects instead of indices
		let graph = this._graph;
		graph.links.forEach(function(d, i) {
			d.source = isNaN(d.source) ? d.source : graph.nodes[d.source];
			d.target = isNaN(d.target) ? d.target : graph.nodes[d.target];
			d.state = {};
			d.state.selected = false;
		});

		// must be done AFTER links are fixed
		this._linearLayout(this._graph.nodes);

		// draw links first, so nodes appear on top
		this._drawLinks(this._graph.links);

		// draw nodes last
		this._drawNodes(this._graph.nodes);
	}
	
	_linearLayout(nodes) {
		// used to scale node index to x position
		var xscale = d3.time.scale()
			.domain([new Date(2004,0,1), new Date(2004,11,31)])
			.range([this._radius, this._width - this._margin - this._radius]);

		// calculate pixel location for each node
		var yshift = this._yfixed;
		nodes.forEach(function(d, i) {
			let currDate = new Date(d.date);
			let modDate = new Date(2004, currDate.getMonth(), currDate.getDate());
			d.x = xscale(modDate);
			d.y = yshift;
			d.state = {};
			d.state.selected = false;
		});
	}
	
	_drawNodes(nodes) {
		let radius = this._radius;
		let raiseEvent = this._raiseEvent;
		d3.select("#" + this._id + "-g").selectAll(".node")
			.data(nodes)
			.enter()
			.append("circle")
			.attr("class", "node")
			.attr("cx", function(d, i) { return d.x; })
			.attr("cy", function(d, i) { return d.y; })
			.attr("r",  function(d, i) { return 0.4 * d.articles.length + 1.6; })
			.on("mouseover", function(d) { 
				raiseEvent("brushOver", d);
			})
			.on("mouseout", function(d) { 
				raiseEvent("brushOut", d);
			})
			.on("click", function(d) {
				if(d.state.selected) {
					d.state.selected = false;
					raiseEvent("removeSelection", d);
				} else {
					d.state.selected = true;
					raiseEvent("addSelection", d);
				}
			});
	}
	
	_drawLinks(links) {
		// scale to generate radians (just for lower-half of circle)
		var radians = d3.scale.linear()
			.range([0, 2 * Math.PI]);

		// path generator for arcs (uses polar coordinates)
		var arc = d3.svg.line.radial()
			.interpolate("basis")
			.tension(0)
			.angle(function(d) { return radians(d); });

		// add links
		var yshift = this._yfixed - 3;
		var raiseEvent = this._raiseEvent;
		var raiseEventForPath = this._raiseEventForPath;
		d3.select("#" + this._id + "-g").selectAll(".link")
			.data(links)
			.enter()
			.append("path")
			.attr("class", "link")
			.attr("transform", function(d, i) {
				// arc will always be drawn around (0, 0)
				// shift so (0, 0) will be between source and target
				var xshift = d.source.x + (d.target.x - d.source.x) / 2;
				return "translate(" + xshift + ", " + yshift + ")";
			})
			.attr("d", function(d, i) {
				// get x distance between source and target
				var xdist = Math.abs(d.source.x - d.target.x);

				// set arc radius based on x distance
				arc.radius(xdist / 2);

				// want to generate 1/3 as many points per pixel in x direction
				var points = d3.range(0, Math.ceil(xdist / 3));

				// set radian scale domain
				radians.domain([0, points.length - 1]);

				// return path for arc
				return arc(points);
			})
			.on("mouseover", function(d) { 
				raiseEvent("brushOver", d.source);
				raiseEvent("brushOver", d.target);
				raiseEventForPath("brushOver", d);
			})
			.on("mouseout", function(d) { 
				raiseEvent("brushOut", d.source);
				raiseEvent("brushOut", d.target);
				raiseEventForPath("brushOut", d);
			})
			.on("click", function(d) {
				if(d.state.selected) {
					d.state.selected = false;
					raiseEvent("removeSelection", d.source); 
					raiseEvent("removeSelection", d.target); 
					raiseEventForPath("removeSelection", d);
				} else {
					d.state.selected = true;
					raiseEvent("addSelection", d.source);
					raiseEvent("addSelection", d.target);
					raiseEventForPath("addSelection", d);
				}
			});
	}
	
	_raiseEvent(e, d) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "Date",
				value: d.date
			}
		}));
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "Articles",
				value: d.articles
			}
		}));
		for(let articleId in d.articles) {
			if(d.articles[articleId].hasOwnProperty("author")) {
				window.dispatchEvent(new CustomEvent('visEvent', { 
					detail: {
						event: e,
						entity: "Author",
						value: d.articles[articleId].author
					}
				}));
			}
		}
	}
	
	_raiseEventForPath(e, d) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "Connection",
				value: d
			}
		}));
	}
}