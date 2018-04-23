import Utils from './utils';

export default class FilterPanel {
	constructor(idPrefix) {
		this._idPrefix = idPrefix;
		this._filterSet = new Set();
	}
	
	add(entityType, entityValue, cb) {
		$("." + this._idPrefix + "-box").append('<a class="ui label ' + this._idPrefix + '-label" data-entity-type="' + entityType + '" data-entity-value="' + entityValue + '">' + entityValue + '<i class="icon close"></i></a>');
		this._filterSet.add(JSON.stringify({entityType: entityType, entityValue: entityValue}));
		cb = Utils.isFunction(cb) ? cb : Utils.emptyFunction;
		cb(this._filterSet);
		$('[data-entity-type="' + entityType + '"][data-entity-value="' + entityValue + '"] > .close', "." + this._idPrefix + "-box").click(function() {
			window.dispatchEvent(new CustomEvent('visEvent', { 
				detail: {
					event: "removeEntityFilter",
					entity: entityType,
					value: [entityValue]
				}
			}));
		});
	}
	
	remove(entityType, entityValue, cb) {
		$('[data-entity-type="' + entityType + '"][data-entity-value="' + entityValue + '"]', "." + this._idPrefix + "-box").remove();
		this._filterSet.delete(JSON.stringify({entityType: entityType, entityValue: entityValue}));
		cb = Utils.isFunction(cb) ? cb : Utils.emptyFunction;
		cb(this._filterSet);
	}
}