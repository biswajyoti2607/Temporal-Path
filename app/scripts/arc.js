import d3 from 'd3';

export default class ArcDiagram {
	constructor(data, id) {
		this._graph = data;
		this._id = id;
		this._width  = 1500;           // width of svg image
		this._height = 600;           // height of svg image
		this._margin = 20;            // amount of margin around plot area
		this._pad = this._margin / 2;       // actual padding amount
		this._radius = 4;             // fixed node radius
		this._yfixed = this._height - this._pad - this._radius;  // y position for all nodes
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
		// sort nodes by group
		/*
		nodes.sort(function(a, b) {
			return a.group - b.group;
		})
		*/

		// used to scale node index to x position
		var xscale = d3.scale.linear()
			.domain([0, nodes.length - 1])
			.range([this._radius, this._width - this._margin - this._radius]);

		// calculate pixel location for each node
		var yshift = this._yfixed;
		nodes.forEach(function(d, i) {
			d.x = xscale(i);
			d.y = yshift;
			d.state = {};
			d.state.selected = false;
		});
	}
	
	_drawNodes(nodes) {
		let radius = this._radius;
		d3.select("#" + this._id + "-g").selectAll(".node")
			.data(nodes)
			.enter()
			.append("circle")
			.attr("class", "node")
			.attr("cx", function(d, i) { return d.x; })
			.attr("cy", function(d, i) { return d.y; })
			.attr("r",  function(d, i) { return radius; })
			.style("fill",   function(d, i) { return "#ccc"; })
			.on("mouseover", function(d) { window.dispatchEvent(new CustomEvent('dateBrushOver', { detail: d })); })
			.on("mouseout", function(d) { window.dispatchEvent(new CustomEvent('dateBrushOut', { detail: d })); })
			.on("click", function(d) {
				if(d.state.selected) {
					d.state.selected = false;
					window.dispatchEvent(new CustomEvent('dateRemoveSelection', { detail: d })); 
				} else {
					d.state.selected = true;
					window.dispatchEvent(new CustomEvent('dateAddSelection', { detail: d })); 
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
		var yshift = this._yfixed;
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
			.on("mouseover", function(d) { window.dispatchEvent(new CustomEvent('dateConnectionBrushOver', { detail: d })); })
			.on("mouseout", function(d) { window.dispatchEvent(new CustomEvent('dateConnectionBrushOut', { detail: d })); })
			.on("click", function(d) {
				if(d.state.selected) {
					d.state.selected = false;
					window.dispatchEvent(new CustomEvent('dateConnectionRemoveSelection', { detail: d })); 
				} else {
					d.state.selected = true;
					window.dispatchEvent(new CustomEvent('dateConnectionAddSelection', { detail: d })); 
				}
			});
	}
}