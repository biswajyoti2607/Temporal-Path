export default class DetailsPane {
	constructor(idPrefix) {
		this._idPrefix = idPrefix;
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
		$("#" + idPrefix + "-list").append(
			'<div id="' + this._idPrefix + '-' + articleId + '" style="display:none;">' +
				'<div class="row">' +
					'<div class="ui large labels">' +
						'<div class="ui label">' +
							'<span>Title:&nbsp;</span>' +
							'<span>' + data.title + '</span>' +
						'</div>' +
						'<div class="ui label">' +
							'<span>Author:&nbsp;</span>' +
							'<span>' + data.Authors + '</span>' +
						'</div>' +
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
				'<div class="row details-text"><p>' + data.text + '</p></div>' +
			'</div>');
	}
}