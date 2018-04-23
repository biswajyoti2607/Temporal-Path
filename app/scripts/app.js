import d3 from 'd3';
import SimpleModule from 'simple-module';
import Simditor from 'simditor';
import ArcDiagram from './arc';
import DetailsPane from './details';
import EntityPanel from './entity';
import FilterPanel from './filter';
import NotesBox from './notes';

$(function() {
	
	var color = d3.scale.category20();
	var globalFilterSet = new Set();
	var isAggregateOn = false;
	var arcDiagram = null;
	var entityObj = {};
	let entitySelection = {};
	d3.json("data/data.json", function(data) {
		let entitiesList = Object.keys(data.entities_list);
		entitiesList.sort();
		for(let entityId in entitiesList) {
			let entityType = entitiesList[entityId];
			let selection = (entityId == 0);
			entitySelection[entityType] = selection;
			entityObj[entityType] = new EntityPanel('entities', entityType, color(entityType + "-base"), color(entityType + "-brush"), selection, function() {
				entitySelection[entityType] = true;
				for(let selectedType in entitySelection) {
					if(entityType !== selectedType) {
						entitySelection[selectedType] = false;
						entityObj[selectedType].changeSelection(false);
					}
				}
				arcDiagram.init(isAggregateOn, entityType, color(entityType + "-brush"), color(entityType + "-base"));
				arcDiagram.filter("brushOut", globalFilterSet);
			});
			entityObj[entityType].create(data.entities_list[entityType]);
		}
		
		arcDiagram = new ArcDiagram(data, "arc-timeline");
		arcDiagram.init(isAggregateOn, entitiesList[0], color(entitiesList[0] + "-brush"), color(entitiesList[0] + "-base"));
		arcDiagram.filter("brushOut", globalFilterSet);
		
		$('#timeline-range').css('width', $('#arc-timeline').css('width'));
	});
	
	let height = $(window).height() - 150;
	$(".arc-parent").height((2*height)/3);
	var detailsPane = new DetailsPane("article", color, height/3);
	$.getJSON("data/data_factsheets.json", function(data) {
		detailsPane.setFactsheet(data);
	});
	var filterPanel = new FilterPanel("filter");
	window.addEventListener('visEvent', function (e) {
		if(e.detail.event === "addDateSelection" || e.detail.event === "removeDateSelection") {
			if(e.detail.event === "addDateSelection" && e.detail.entity === "articles") {
				setTimeout(function() {
					detailsPane.updatePane(e.detail.value);
				}, 0);
			} else if(e.detail.event === "removeDateSelection" && e.detail.entity === "articles"){
				setTimeout(function() {
					detailsPane.updatePane([]);
				}, 0);
			}
			setTimeout(function() {
				arcDiagram.select(e.detail.event);
			}, 0);
		} else if(e.detail.event === "brushOver" || e.detail.event === "brushOut") {
			if(e.detail.entity === "articles") {
				//TODO
			} else if(e.detail.entity === "connection") {
				//TODO
			} else if (e.detail.entity === "date") {
				//TODO
			} else {
				setTimeout(function() {
					arcDiagram.brush(e.detail.event, e.detail.entity, e.detail.value);
				}, 100);
				setTimeout(function() {
					entityObj[e.detail.entity].update(e.detail.event, e.detail.value, e.detail.shouldScroll);
				}, 100);
			}
		} else if(e.detail.event === "addEntityFilter" || e.detail.event === "removeEntityFilter") {
			if(e.detail.event === "addEntityFilter") {
				for(let valueId in e.detail.value) {
					setTimeout(function() {
						filterPanel.add(e.detail.entity, e.detail.value[valueId], function(filterSet) {
							arcDiagram.filter(e.detail.event, filterSet);
							globalFilterSet = filterSet;
						});
					}, 0);
				}
			} else {
				for(let valueId in e.detail.value) {
					setTimeout(function() {
						filterPanel.remove(e.detail.entity, e.detail.value[valueId], function(filterSet) {
							arcDiagram.filter(e.detail.event, filterSet);
							globalFilterSet = filterSet;
						});
					}, 0);
				}
				setTimeout(function() {
					entityObj[e.detail.entity].clearFilter(e.detail.value);
				}, 0);
			}
		}
	});
	
	$('#timeline-range').slider({
		range: true,
		min: 1,
		max: 366,
		values: [ 1, 366 ],
		slide: function( event, ui ) {
			if(arcDiagram != null) {
				setTimeout(function() {
					arcDiagram.filterByRange(ui.values[0], ui.values[1]);
				}, 10);
			}
		}
    });
	
	function aggregate(state) {
		isAggregateOn = state;
		for(let selectedType in entitySelection) {
			if(entitySelection[selectedType]) {
				setTimeout(function() {
					arcDiagram.init(isAggregateOn, selectedType, color(selectedType + "-brush"), color(selectedType + "-base"));
					arcDiagram.filter("brushOut", globalFilterSet);
				}, 10);
				break;
			}
		}
		if(state) {
			$('#timeline-range').hide();
		} else {
			$('#timeline-range').show();
		}
		$('#timeline-range').slider("values", 0, 1);
		$('#timeline-range').slider("values", 1, 366);
	}
	
	$('.aggregate-radio').checkbox({
		onChecked: function() {
			aggregate(true);
		},
		onUnchecked: function() {
			aggregate(false);
		}
	});
	
	Simditor.locale = 'en-US';
	let selectedEditor = new Simditor({textarea: $('#notes-selected-text'), toolbar: ['bold','italic','underline','strikethrough','fontScale','color','ol','ul','blockquote','table','link','image','hr','indent','outdent','alignment']});
	let currentEditor = new Simditor({textarea: $('#notes-current-text'), toolbar: ['bold','italic','underline','strikethrough','fontScale','color','ol','ul','blockquote','table','link','image','hr','indent','outdent','alignment']});
	let notesBox = new NotesBox("notes");
	$('#notes-button').click(function() {
		$('#notes-modal').modal('show');
	});
	$(window).on('beforeunload', function(){
		notesBox.saveSession(currentEditor.getValue());
	});
	$('.note-date').checkbox({
		onChange: function() {
			selectedEditor.setValue(notesBox.getSessionNote($('input[name=note-date-name]:checked').next().text()));
		}
	});
});
