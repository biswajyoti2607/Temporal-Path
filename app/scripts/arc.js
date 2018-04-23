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
		this._redrawDuration = 500;
		this._drawDuration = 1000;
	}
	
	init(state, selectedEntityType, baseColor, brushColor) {
		this._baseColor = baseColor;
		this._brushedColor = brushColor;
		let svg  = d3.select("#" + this._id)
		svg.selectAll("*").remove()
		svg.attr("width", this._width)
			.attr("height", this._height);

		// create plot area within svg image
		let plot = svg.append("g")
			.attr("id", this._id + "-g")
			.attr("transform", "translate(" + this._pad + ", " + this._pad + ")");

		// fix graph links to map to objects instead of indices
		let graph = this._graph;
		if(!graph.hasOwnProperty('linearNodes')) {
			graph.linearNodes = [];
			for(let nodeId in graph.nodes) {
				graph.linearNodes[nodeId] = $.extend(true, {}, graph.nodes[nodeId]);
			}
		}
		let nodeIdMap = {};
		if(state) {
			let newNodes = [];
			for(let i = 0; i < 12; i++) {
				newNodes[i] = { date : i, articles : []}
			}
			for(let nodeId in this._graph.linearNodes) {
				let month = (new Date(this._graph.linearNodes[nodeId].date)).getMonth();
				newNodes[month].articles = newNodes[month].articles.concat(this._graph.linearNodes[nodeId].articles);
				nodeIdMap[nodeId] = month;
			}
			this._graph.nodes = newNodes;
		} else {
			this._graph.nodes = this._graph.linearNodes;
			for(let nodeId in this._graph.linearNodes) {
				nodeIdMap[nodeId] = nodeId;
			}
		}
		
		let compositeLinks = {};
		graph.compositeLinks = [];
		for(let sourceId in graph.links[selectedEntityType]) {
			for(let targetId in graph.links[selectedEntityType][sourceId]) {
				let newSourceId = nodeIdMap[sourceId];
				let newtargetId = nodeIdMap[targetId];
				if(!compositeLinks.hasOwnProperty(newSourceId)) {
					compositeLinks[newSourceId] = {};
				}
				if(!compositeLinks[newSourceId].hasOwnProperty(newtargetId)) {
					compositeLinks[newSourceId][newtargetId] = 0;
				}
				compositeLinks[newSourceId][newtargetId] = compositeLinks[newSourceId][newtargetId] + 1;
			}
		}
		for(let sourceId in compositeLinks) {
			for(let targetId in compositeLinks[sourceId]) {
				graph.compositeLinks.push({source: graph.nodes[sourceId], target: graph.nodes[targetId], count: compositeLinks[sourceId][targetId], sourceId: sourceId, targetId: targetId});
			}
		}
		
		let initState = this._initState;
		graph.compositeLinks.forEach(function(d, i) {
			initState(d);
		});
		
		this._draw(state);
	}
	
	redraw(event) {
		let baseColor = this._baseColor;
		let brushedColor = this._brushedColor;
		d3.select("#" + this._id + "-g").selectAll(".node")
			.attr("fill", function(d, i) {
				if(d.state.brushed && d.state.selected) {
					return brushedColor;
				} else {
					return baseColor;
				}
			})
			.attr("opacity", function(d, i) {
				if(!d.state.filtered || !d.state.filteredByRange) {
					return "0";
				}
				return "1";
			});
		d3.select("#" + this._id + "-g").selectAll(".link")
			.attr("stroke", function(d, i) {
				if(d.source.state.brushed && d.target.state.brushed) {
					return brushedColor;
				} else {
					return baseColor;
				}
			})
			.attr("stroke-opacity", function(d, i) {
				if(!d.source.state.filtered || !d.target.state.filtered || !d.source.state.filteredByRange || !d.target.state.filteredByRange) {
					return "0";
				}
				if(d.source.state.brushed && d.target.state.brushed) {
					return "1";
				}
				return "0.5";
			})
			.attr("opacity", function(d, i) {
				if(!d.source.state.filtered || !d.target.state.filtered || !d.source.state.filteredByRange || !d.target.state.filteredByRange) {
					return "0";
				}
				if(!(d.source.state.brushed && d.target.state.brushed) && event !== "brushOut" && event !== "removeEntityFilter" && event !== "filterByRange") {
					return "0";
				}
				return "1";
			});
	}
	
	brush(event, entity, value) {
		for(let nodeId in this._graph.nodes) {
			if(!this._graph.nodes[nodeId].state.filtered || !this._graph.nodes[nodeId].state.filteredByRange) {
				continue;
			}
			let nodeProcessed = false;
			for(let articleId in this._graph.nodes[nodeId].articles) {
				if(nodeProcessed) break;
				for(let entityId in this._graph.nodes[nodeId].articles[articleId]["entities"][entity]) {
					if(nodeProcessed) break;
					for(let valueId in value) {
						if(nodeProcessed) break;
						if(this._graph.nodes[nodeId].articles[articleId]["entities"][entity][entityId] === value[valueId]) {
							this._graph.nodes[nodeId].state.brushed = (event === "brushOver" ? true : false);
							nodeProcessed = true;
						}
					}
				}
			}
		}
		this.redraw(event);
	}
	
	select(event) {
		this.redraw(event);
	}
	
	filter(event, filterSet) {
		if(filterSet.size == 0) {
			for(let nodeId in this._graph.nodes) {
				this._graph.nodes[nodeId].state.filtered = true;
			}
			this.redraw(event);
			return;
		}
		for(let nodeId in this._graph.nodes) {
			this._graph.nodes[nodeId].state.filtered = false;
			let allFilteredItemPresent = true;
			for(let filteredItem of filterSet) {
				filteredItem = JSON.parse(filteredItem);
				let isFilteredItemPresentInAnyArticle = false;
				for(let articleId in this._graph.nodes[nodeId].articles) {
					if(this._graph.nodes[nodeId].articles[articleId]["entities"][filteredItem.entityType].includes(filteredItem.entityValue)) {
						isFilteredItemPresentInAnyArticle = true;
						break;
					}
				}
				if(!isFilteredItemPresentInAnyArticle) {
					allFilteredItemPresent = false;
					break;
				}
			}
			if(allFilteredItemPresent) {
				this._graph.nodes[nodeId].state.filtered = true;
			}
		}
		this.redraw(event);
	}
	
	filterByRange(start, end) {
		for(let nodeId in this._graph.nodes) {
			let dayOfYear = (this._graph.nodes[nodeId].modDate - new Date(2004, 0, 0))/(1000 * 60 * 60 * 24);
			if(start <= dayOfYear && dayOfYear <= end) {
				this._graph.nodes[nodeId].state.filteredByRange = true;
			} else {
				this._graph.nodes[nodeId].state.filteredByRange = false;
			}
		}
		this.redraw("filterByRange");
	}
	
	_draw(isAggregated) {
		// must be done AFTER links are fixed
		if(isAggregated) {
			this._aggregatedLayout(this._graph.nodes);
		} else {
			this._linearLayout(this._graph.nodes);
		}

		// draw links first, so nodes appear on top
		this._drawLinks(this._graph.compositeLinks);

		// draw nodes last
		this._drawNodes(this._graph.nodes);
	}
	
	_linearLayout(nodes) {
		// used to scale node index to x position
		let xscale = d3.time.scale()
			.domain([new Date(2004,0,1), new Date(2004,11,31)])
			.range([this._radius, this._width - this._margin - this._radius]);

		// calculate pixel location for each node
		let yshift = this._yfixed;
		let initState = this._initState;
		nodes.forEach(function(d, i) {
			let currDate = new Date(d.date);
			let modDate = new Date(2004, currDate.getMonth(), currDate.getDate());
			d.modDate = modDate;
			d.x = xscale(modDate);
			d.y = yshift;
			initState(d);
		});
	}
	
	_aggregatedLayout(nodes) {
		const monthNames = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];
		
		let xscale = d3.scale.linear()
			.domain([0, 11])
			.range([this._radius, this._width - this._margin - this._radius]);

		// calculate pixel location for each node
		let yshift = this._yfixed;
		let initState = this._initState;
		nodes.forEach(function(d, i) {
			let currDate = new Date(d.date);
			d.modDate = monthNames[d.date];
			d.x = xscale(d.date);
			d.y = yshift;
			initState(d);
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
			.style("cursor", function(d) {
				if(d.state.filtered && d.state.filteredByRange) {
					return "pointer";
				} else {
					return "default";
				}
			})
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
				if(d.state.filtered && d.state.filteredByRange) {
					raiseEvent("brushOver", d);
				}
			})
			.on("mouseout", function(d) {
				if(d.state.filtered && d.state.filteredByRange) {
					raiseEvent("brushOut", d);
				}
			})
			.on("click", function(d) {
				if(d.state.filtered && d.state.filteredByRange) {
					if(d.state.selected) {
						d.state.selected = false;
						raiseEvent("removeDateSelection", d);
					} else {
						d.state.selected = true;
						raiseEvent("addDateSelection", d);
					}
				}
			})
			.append("title")
			.text(function(d, i) {
				return d.modDate;
			});;
	}
	
	_drawLinks(links) {
		// scale to generate radians (just for lower-half of circle)
		let radians = d3.scale.linear()
			.range([0, 2 * Math.PI]);

		// path generator for arcs (uses polar coordinates)
		let arc = d3.svg.line.radial()
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
				let xshift = d.source.x + (d.target.x - d.source.x) / 2;
				return "translate(" + xshift + ", " + yshift + ")";
			})
			.attr("d", function(d, i) {
				// get x distance between source and target
				let xdist = Math.abs(d.source.x - d.target.x);

				// set arc radius based on x distance
				arc.radius(xdist / 2);

				// want to generate 1/3 as many points per pixel in x direction
				let points = d3.range(0, Math.ceil(xdist / 3));

				// set radian scale domain
				radians.domain([0, points.length - 1]);

				// return path for arc
				return arc(points);
			})
			.style("cursor", function(d) {
				if(d.source.state.filtered && d.target.state.filtered && d.source.state.filteredByRange && d.target.state.filteredByRange) {
					return "pointer";
				} else {
					return "default";
				}
			})
			.attr("stroke", function(d, i) {
				return baseColor;
			})
			.attr("stroke-opacity", function(d, i) {
				return "0.5"
			})
			.attr("stroke-width", function(d, i) {
				return (0.4927*d.count+0.5072) + "px";
			})
			.on("mouseover", function(d) {
				if(d.source.state.filtered && d.target.state.filtered && d.source.state.filteredByRange && d.target.state.filteredByRange) {
					raiseEvent("brushOver", d.source);
					raiseEvent("brushOver", d.target);
					raiseEventForPath("brushOver", d);
				}
			})
			.on("mouseout", function(d) {
				if(d.source.state.filtered && d.target.state.filtered && d.source.state.filteredByRange && d.target.state.filteredByRange) {
					raiseEvent("brushOut", d.source);
					raiseEvent("brushOut", d.target);
					raiseEventForPath("brushOut", d);
				}
			})
			.on("click", function(d) {
				if(d.source.state.filtered && d.target.state.filtered && d.source.state.filteredByRange && d.target.state.filteredByRange) {
					if(d.state.selected) {
						d.state.selected = false;
						raiseEvent("removeDateSelection", d.source); 
						raiseEvent("removeDateSelection", d.target); 
						raiseEventForPath("removeDateSelection", d);
					} else {
						d.state.selected = true;
						raiseEvent("addDateSelection", d.source);
						raiseEvent("addDateSelection", d.target);
						raiseEventForPath("addDateSelection", d);
					}
				}
			});
	}
	
	_raiseEvent(e, d) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "date",
				value: d.date
			}
		}));
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "articles",
				value: d.articles
			}
		}));
		let authors = [];
		for(let articleId in d.articles) {
			for(let entity in d.articles[articleId].entities) {
				window.dispatchEvent(new CustomEvent('visEvent', { 
					detail: {
						event: e,
						entity: entity,
						value:  d.articles[articleId].entities[entity],
						shouldScroll: true
					}
				}));
			}
		}
	}
	
	_raiseEventForPath(e, d, color) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: "connection",
				value: d
			}
		}));
	}
	
	_initState(d) {
		d.state = {};
		d.state.selected = false;
		d.state.brushed = false;
		d.state.filtered = true;
		d.state.filteredByRange = true;
	}
}