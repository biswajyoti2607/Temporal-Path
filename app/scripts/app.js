import Utils from './utils';
import d3 from 'd3';
import ArcDiagram from './arc';
import DetailsPane from './details';

$(function() {
	var arcDiagram = null;
	d3.json("data/timeline.json", function(data) {
		arcDiagram = new ArcDiagram(data, "arc-timeline");
		arcDiagram.draw();
	});
	
	var detailsPane = new DetailsPane("article");
	window.addEventListener('dateAddSelection', function (e) {
		detailsPane.updatePane(e.detail);
	});
});
