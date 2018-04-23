import Utils from './utils';

export default class DetailsPane {
	constructor(idPrefix, pallette, height) {
		this._idPrefix = idPrefix;
		this._color = pallette;
		this._height = height;
	}
	
	setFactsheet(factsheet) {
		this._factsheet = factsheet;
	}
	
	updatePane(data) {
		let idPrefix = this._idPrefix;
		this._articlesList = data;
		$("#" + this._idPrefix + "-list").text("");
		for(let articleId in this._articlesList) {
			this._addNewArticle(this._articlesList[articleId], articleId, this._articlesList.length);
		}
		$("#" + this._idPrefix + "-0").show();
		$(".next-article").click(function() {
			let currId = parseInt($(this).data("article-id"));
			let nextId = currId + 1;
			if(nextId === data.length) {
				nextId = 0;
			}
			$("#" + idPrefix + "-" + nextId).show();
			$("#" + idPrefix + "-" + currId).hide();
		});
	}
	
	_addNewArticle(data, articleId, total) {
		let idPrefix = this._idPrefix;
		let highlightEntities = this._highlightEntities;
		let color = this._color;
		let annotateFactsheet = this._annotateFactsheet;
		let factsheet = this._factsheet;
		let height = this._height;
		$("#" + idPrefix + "-list").append(
			'<div id="' + idPrefix + '-' + articleId + '" style="display:none;">' +
				'<div class="row article-header">' +
					'<div class="ui large labels">' +
						'<div class="ui label">' +
							'<span>Title:&nbsp;</span>' +
							'<span>' + data.title + '</span>' +
						'</div>' +
						(data.author !== "" ? '<div class="ui label">' +
							'<span>Author:&nbsp;</span>' +
							'<span>' + data.author + '</span>' +
						'</div>' : '') +
						'<div class="ui label">' +
							'<span>Date:&nbsp;</span>' +
							'<span>' + data.date + '</span>' +
						'</div>' +
						'<div class="ui label">' +
							'<span>Type:&nbsp;</span>' +
							'<span>' + data.type + '</span>' +
						'</div>' +
						'<a class="ui label next-article" data-article-id="' + articleId + '">' +
							'<span>' + (parseInt(articleId) + 1) + '/' + total + '>></span>' +
						'</a>' +
					'</div>' +
				'</div>' +
				'<div class="row details-text" style="height:' + height + 'px"><p>' + highlightEntities(data.text, data.entities, factsheet, color) + '</p></div>' +
			'</div>');
		for(let fact in factsheet) {
			$(".fact-" + Utils.hashCode(fact)).click(function() {
				$('#' + idPrefix + '-fact-modal > .header').text(Utils.capitalizeFirstLetter(fact));
				$('#' + idPrefix + '-fact-modal > .content').html("<p>" + factsheet[fact] + "</p>");
				$('#' + idPrefix + '-fact-modal').modal('show');
			});
		}
	}
	
	_highlightEntities(text, entities, factsheet, color) {
		let searchStart = 0;
		for(let entityType in entities) {
			for(let entityId in entities[entityType]) {
				let start = text.indexOf(entities[entityType][entityId], searchStart);
				let end = start + entities[entityType][entityId].length;
				if(start != -1) {
					let result = [text.slice(0, end), "</span>", text.slice(end)].join('');
					text = [result.slice(0, start), '<span class="entity-' + entityType + '-' + Utils.hashCode(entities[entityType][entityId]) + '" style="background-color:' + color(entityType + "-brush") + '">', result.slice(start)].join('');
					searchStart = end;
				}
			}
		}
		
		searchStart = 0;
		for(let fact in factsheet) {
			let start = text.toLowerCase().indexOf(fact.toLowerCase(), searchStart);
			let end = start + fact.length;
			if(start != -1) {
				console.log(fact + ":" + start);
				let result = [text.slice(0, end), "</span>", text.slice(end)].join('');
				text = [result.slice(0, start), '<span class="popup fact-' + Utils.hashCode(fact) + '">', result.slice(start)].join('');
			}
		}
		return text;
	}
}