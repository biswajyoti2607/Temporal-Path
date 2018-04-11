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
			let checkEntity = $('<span><i class="right floated check square outline icon mouse-pointer"></i></span>');
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
			let entityDiv = $('<div class="item entities-item mouse-pointer ' + idPrefix + '-' + name + '-item">' + entityVal + '</div>');
			entityDiv.mouseover(function() {
				raiseEvent("brushOver", name, entityVal, color);
			});
			entityDiv.mouseout(function() {
				raiseEvent("brushOut", name, entityVal, color);
			});
			entityDiv.click(function() {
				if(entityDiv.attr("data-state-selected") === "true") {
					entityDiv.attr("data-state-selected", "false");
					raiseEvent("removeFilter", name, entityVal, color);
				} else {
					entityDiv.attr("data-state-selected", "true");
					raiseEvent("addFilter", name, entityVal, color);
				}
			});
			$(entityList).find(".list").each(function() {
				$(this).append(entityDiv);
			});
		}
		entityListDiv.append(entityList);
				
		$("#" + idPrefix + "-col").append(entityListDiv);
	}
	
	update(event, name, data, color) {
		$("." + this._idPrefix + "-" + name + "-item").each(function() {
			if($(this).text() === data) {
				if(event === "brushOver") {
					$(this).css("background-color", color);
					$(this).css("color", "#ffffff");
				} else {
					$(this).css("background-color", "");
					$(this).css("color", "");
				}
			}
		});
	}
	
	clear(name, data, color) {
		$("." + this._idPrefix + "-" + name + "-item").each(function() {
			if($(this).text() === data) {
				$(this).css("background-color", color);
				$(this).css("color", "#ffffff");
			} else {
				$(this).css("background-color", "");
				$(this).css("color", "");
			}
		});
	}
	
	_raiseEvent(e, key, val, color) {
		window.dispatchEvent(new CustomEvent('visEvent', { 
			detail: {
				event: e,
				entity: key,
				value: val,
				color: color
			}
		}));
	}
}