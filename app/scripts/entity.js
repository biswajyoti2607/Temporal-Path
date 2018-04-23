import Utils from './utils';

export default class EntityPanel {
	constructor(idPrefix, name, color, brushColor, selection, selectionCallback) {
		this._idPrefix = idPrefix;
		this._name = name;
		this._color = color;
		this._brushColor = brushColor;
		this._selection = selection;
		this._selectionCallback = Utils.isFunction(selectionCallback) ? selectionCallback : Utils.emptyFunction;
	}
	
	create(data) {
		let idPrefix = this._idPrefix;
		let name = this._name;
		let selection = this._selection;
		let color = this._color;
		let brushColor = this._brushColor;
		let entityListDiv = $('<div class="ui card">' +
				'<div class="content">' + 
					'<div class="header">' + 
						'<span><i class="left floated square icon" style="color:' + color + ';"></i></span>' +
						'<span>' + Utils.capitalizeFirstLetter(name) + '</span>' +
					'</div>' +
				'</div>' +
			'</div>');
		let selectionCallback = this._selectionCallback;
		let cb = function() {
			/* try {
				selectionCallback();
			} catch(e) {
				Utils.log("entity.js :: Exception in cb : selectionCallback :: " + e);
			} */
			selectionCallback();
		}
		entityListDiv.find(".header").each(function() {
			let checkEntity = $('<span><i class="right floated ' + (selection ? 'check' : '') + 
				' square outline icon mouse-pointer ' + idPrefix + '-' + name + '-selection' + '"></i></span>');
			$(checkEntity).click(function() {
				checkEntity.find("i").each(function() {
					if(!$(this).hasClass("check")) {
						$(this).addClass("check");
						cb();
					}
				});
			});
			$(this).append(checkEntity);
		});
		let entityList = $('<div class="content">' +
					'<div class="ui list entities-type">' +
					'</div>' +
				'</div>');
		let raiseEvent = this._raiseEvent;
		let sortable = [];
		for(let entityVal in data) {
			if(entityVal != "" && entityVal != "Alderwood") {
				sortable.push([entityVal, data[entityVal]]);
			}
		}
		sortable.sort(function(a, b) {
			return b[1] - a[1];
		});
		
		for(let id in sortable) {
			let entityVal = sortable[id][0];
			let entityDiv = $('<div class="item entities-item mouse-pointer ' + idPrefix + '-' + name + '-item" data-state-selected="false" data-state-filtered="false" title="' + data[entityVal] + '" data-entity-count="' + data[entityVal] + '">' + entityVal + '</div>');
			entityDiv.mouseover(function() {
				raiseEvent("brushOver", name, entityVal);
			});
			entityDiv.mouseout(function() {
				raiseEvent("brushOut", name, entityVal);
			});
			entityDiv.click(function() {
				if(entityDiv.attr("data-state-filtered") === "false") {
					entityDiv.attr("data-state-filtered", "true");
					raiseEvent("addEntityFilter", name, entityVal);
				} else {
					entityDiv.attr("data-state-filtered", "false");
					raiseEvent("removeEntityFilter", name, entityVal);
				}
			});
			$(entityList).find(".list").each(function() {
				$(this).append(entityDiv);
			});
		}
		entityListDiv.append(entityList);
				
		$("#" + idPrefix + "-col").append(entityListDiv);
	}
	
	changeSelection(state) {
		this._selection = state;
		let idPrefix = this._idPrefix;
		let name = this._name;
		$("." + idPrefix + "-" + name + "-selection").each(function() {
			if(state) {
				$(this).addClass("check");
			} else {
				$(this).removeClass("check");
			}
		});
	}
	
	clearFilter(data) {
		$("." + this._idPrefix + "-" + this._name + "-item").each(function() {
			for(let dataId in data) {
				$(this).attr("data-state-filtered", "false");
			}
		});
	}
	
	update(event, data, shouldScroll) {
		let idPrefix = this._idPrefix;
		let name = this._name;
		let color = this._color;
		let brushColor = this._brushColor;
		let maxCount = 0;
		let maxCountEle = null;
		//OLD LOGIC - Look through all elements
		$("." + idPrefix + "-" + name + "-item").each(function() {
			for(let dataId in data) {
				if($(this).text() === data[dataId] && $(this).attr("data-state-selected") == "false") {
					if(event === "brushOver" || event == "addEntitySelection") {
						$(this).css("background-color", brushColor);
						$(this).css("color", "#ffffff");
						if(maxCount < parseInt($(this).attr("data-entity-count"))) {
							maxCount = parseInt($(this).attr("data-entity-count"));
							maxCountEle = $(this);
						}
					} else {
						$(this).css("background-color", "");
						$(this).css("color", "");
					}
				}
			}
		})
		.promise()
		.done(function() {
			if(maxCountEle != null && shouldScroll) {
				let parent = maxCountEle.parent();
				parent.animate({
					scrollTop:  parent.scrollTop() - parent.offset().top + maxCountEle.offset().top
				}, 50);
			}
		});
		
		//NEW LOGIC - Iterate over data
		/* for(let dataId in data) {
			let ele = $("." + idPrefix + "-" + name + "-item[data-state-selected='false']:contains('" + data[dataId] + "')");
			let entityCount = parseInt(ele.attr("data-entity-count"));
			if(event === "brushOver" || event == "addEntitySelection") {
				ele.css("background-color", brushColor);
				ele.css("color", "#ffffff");
				if(maxCount < entityCount) {
					maxCount = entityCount;
					maxCountEle = ele;
				}
			} else {
				ele.css("background-color", "");
				ele.css("color", "");
			}
		}
		if(maxCountEle != null && shouldScroll) {
			let parent = maxCountEle.parent();
			parent.animate({
				scrollTop:  parent.scrollTop() - parent.offset().top + maxCountEle.offset().top
			}, 50);
		} */
	}
	
	_raiseEvent(e, key, val) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: key,
				value: [val],
				shouldScroll: false
			}
		}));
	}
}