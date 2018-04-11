import d3 from 'd3';

export default class ArcDiagram {
	constructor(data, id) {
		this._graph = data;
		this._id = id;
		this._margin = 20;															// amount of margin around plot area
		this._pad = this._margin / 2;												// actual padding amount
		this._radius = 4;															// fixed node radius
		this._width  = $("#" + this._id).parent().width() - this._margin;			// width of svg image
		this._height = this._width / 2.4;         									// height of svg image
		this._yfixed = this._height - this._pad - this._radius;						// y position for all nodes
		this._baseColor = "#cccccc";
		this._brushedColor = "#888888";
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
			d.state.brushed = false;
		});

		// must be done AFTER links are fixed
		this._linearLayout(this._graph.nodes);

		// draw links first, so nodes appear on top
		this._drawLinks(this._graph.links);

		// draw nodes last
		this._drawNodes(this._graph.nodes);
	}
	
	redraw(event, color) {
		let baseColor = this._baseColor;
		let brushedColor = color;
		d3.select("#" + this._id + "-g").selectAll(".node")
			.attr("fill", function(d, i) {
				if(d.state.brushed || d.state.selected) {
					return brushedColor;
				} else {
					return baseColor;
				}
			});
		d3.select("#" + this._id + "-g").selectAll(".link")
			.attr("stroke", function(d, i) {
				if(d.source.state.brushed || d.target.state.brushed) {
					return brushedColor;
				} else {
					return baseColor;
				}
			})
			.attr("stroke-opacity", function(d, i) {
				if(d.source.state.brushed || d.target.state.brushed) {
					return "1";
				}
				return "0.5";
			})
			.attr("opacity", function(d, i) {
				if(!(d.source.state.brushed || d.target.state.brushed) && event !== "brushOut") {
					return "0";
				}
				return "1";
			});
	}
	
	brush(event, entity, value, color) {
		for(let nodeId in this._graph.nodes) {
			for(let articleId in this._graph.nodes[nodeId].articles) {
				if(this._graph.nodes[nodeId].articles[articleId].hasOwnProperty(entity)) {
					if(Array.isArray(this._graph.nodes[nodeId].articles[articleId][entity])) {
						console.log(this._graph.nodes[nodeId].articles[articleId][entity]);
						for(let entityId in this._graph.nodes[nodeId].articles[articleId][entity]) {
							if(this._graph.nodes[nodeId].articles[articleId][entity][entityId] === value) {
								this._graph.nodes[nodeId].state.brushed = (event === "brushOver"? true : false);
							}
						}
					} else {
						if(this._graph.nodes[nodeId].articles[articleId][entity] === value) {
							this._graph.nodes[nodeId].state.brushed = (event === "brushOver"? true : false);
						}
					}
				}
			}
		}
		this.redraw(event, color);
	}
	
	select(event) {
		this.redraw(event, this._brushedColor);
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
			d.state.brushed = false;
		});
	}
	
	_drawNodes(nodes) {
		let raiseEvent = this._raiseEvent;
		let baseColor = this._baseColor;
		let brushedColor = this._brushedColor;
		d3.select("#" + this._id + "-g").selectAll(".node")
			.data(nodes)
			.enter()
			.append("circle")
			.attr("class", "node")
			.attr("cx", function(d, i) { return d.x; })
			.attr("cy", function(d, i) { return d.y; })
			.attr("r",  function(d, i) { return 0.4 * d.articles.length + 1.6; })
			.attr("fill", function(d, i) {
				return baseColor;
			})
			.attr("stroke", function(d, i) {
				return brushedColor;
			})
			.on("mouseover", function(d) { 
				raiseEvent("brushOver", d, brushedColor);
			})
			.on("mouseout", function(d) { 
				raiseEvent("brushOut", d, brushedColor);
			})
			.on("click", function(d) {
				if(d.state.selected) {
					d.state.selected = false;
					raiseEvent("removeSelection", d, brushedColor);
				} else {
					d.state.selected = true;
					raiseEvent("addSelection", d, brushedColor);
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
		let yshift = this._yfixed;
		let raiseEvent = this._raiseEvent;
		let raiseEventForPath = this._raiseEventForPath;
		let baseColor = this._baseColor;
		let brushedColor = this._brushedColor;
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
			.attr("stroke", function(d, i) {
				return baseColor;
			})
			.attr("stroke-opacity", function(d, i) {
				return "0.5"
			})
			.attr("stroke-width", function(d, i) {
				return "1px";
			})
			.on("mouseover", function(d) { 
				raiseEvent("brushOver", d.source, brushedColor);
				raiseEvent("brushOver", d.target, brushedColor);
				raiseEventForPath("brushOver", d, brushedColor);
			})
			.on("mouseout", function(d) { 
				raiseEvent("brushOut", d.source, brushedColor);
				raiseEvent("brushOut", d.target, brushedColor);
				raiseEventForPath("brushOut", d, brushedColor);
			})
			.on("click", function(d) {
				if(d.state.selected) {
					d.state.selected = false;
					raiseEvent("removeSelection", d.source, brushedColor); 
					raiseEvent("removeSelection", d.target, brushedColor); 
					raiseEventForPath("removeSelection", d, brushedColor);
				} else {
					d.state.selected = true;
					raiseEvent("addSelection", d.source, brushedColor);
					raiseEvent("addSelection", d.target, brushedColor);
					raiseEventForPath("addSelection", d, brushedColor);
				}
			});
	}
	
	_raiseEvent(e, d, color) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "Date",
				value: d.date,
				color: color
			}
		}));
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "Articles",
				value: d.articles,
				color: color
			}
		}));
		let authors = [];
		for(let articleId in d.articles) {
			if(d.articles[articleId].hasOwnProperty("Authors") && d.articles[articleId].Authors !== "") {
				window.dispatchEvent(new CustomEvent('visEvent', { 
					detail: {
						event: e,
						entity: "Authors",
						value:  d.articles[articleId].Authors,
						color: color
					}
				}));
			}
		}
	}
	
	_raiseEventForPath(e, d, color) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "Connection",
				value: d,
				color: color
			}
		}));
	}
}