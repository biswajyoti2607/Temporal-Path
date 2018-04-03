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
		if(e.detail.event === "addSelection" && e.detail.entity === "Articles") {
			detailsPane.updatePane(e.detail.value);
		}
	});
});
