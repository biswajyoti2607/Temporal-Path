export default class EntityPanel {
	constructor(idPrefix) {
		this._idPrefix = idPrefix;
	}
	
	addEntity(name, data, color) {
		let idPrefix = this._idPrefix;
		let entityListDiv = $('<div class="ui card">' +
				'<div class="content">' + 
					'<div class="header">' + 
						'<span><i class="left floated square icon" style="color:' + color + ';"></i></span>' +
						'<span>' + name + '</span>' +
					'</div>' +
				'</div>' +
			'</div>');
		entityListDiv.find(".header").each(function() {
			let checkEntity = $('<span><i class="right floated check square outline icon"></i></span>');
			$(checkEntity).click(function() {
				checkEntity.find("i").each(function() {
					if($(this).hasClass("check")) {
						$(this).removeClass("check");
					} else {
						$(this).addClass("check");
					}
				});
			});
			$(this).append(checkEntity);
		});
		let entityList = $('<div class="content">' +
					'<div class="ui list">' +
					'</div>' +
				'</div>');
		let raiseEvent = this._raiseEvent;
		for(let entityVal in data) {
			let entityDiv = $('<div class="item">' + entityVal + '</div>');
			entityDiv.mouseover(function() {
				raiseEvent("brushOver", name, entityVal);
			});
			entityDiv.mouseout(function() {
				raiseEvent("brushOut", name, entityVal);
			});
			entityDiv.click(function() {
				if(entityDiv.attr("data-state-selected") === "true") {
					entityDiv.attr("data-state-selected", "false");
					raiseEvent("removeSelection", name, entityVal);
				} else {
					entityDiv.attr("data-state-selected", "true");
					raiseEvent("addSelection", name, entityVal);
				}
			});
			$(entityList).find(".list").each(function() {
				$(this).append(entityDiv);
			});
		}
		entityListDiv.append(entityList);
				
		$("#" + idPrefix + "-col").append(entityListDiv);
	}
	
	_raiseEvent(e, key, val) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: key,
				value: val
			}
		}));
	}
}