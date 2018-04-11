import Utils from './utils';
import d3 from 'd3';
import ArcDiagram from './arc';
import DetailsPane from './details';
import EntityPanel from './entity';

$(function() {
	
	var arcDiagram = null;
	d3.json("data/timeline.json", function(data) {
		arcDiagram = new ArcDiagram(data, "arc-timeline");
		arcDiagram.draw();
	});
	
	var color = d3.scale.category10();
	
	var entityObj = {};
	d3.json("data/entities.json", function(data) {
		for(let entityType in data) {
			entityObj[entityType] = new EntityPanel('entities');
			entityObj[entityType].addEntity(entityType, data[entityType], color(entityType));
		}
	});
	
	var detailsPane = new DetailsPane("article");
	window.addEventListener('visEvent', function (e) {
		if(e.detail.entity === "Articles") {
			if(e.detail.event === "addSelection") {
				detailsPane.updatePane(e.detail.value);
			} else if(e.detail.event === "removeSelection"){
				detailsPane.updatePane([]);
			}
			arcDiagram.select(e.detail.event);
		}
		
		for(let entityType in entityObj) {
			if((e.detail.event === "brushOver" || e.detail.event === "brushOut") && e.detail.entity === entityType && e.detail.value !== "") {
				arcDiagram.brush(e.detail.event, e.detail.entity, e.detail.value, e.detail.color);
				entityObj[entityType].update(e.detail.event, entityType, e.detail.value, e.detail.color);
			}
		}
	});
});
