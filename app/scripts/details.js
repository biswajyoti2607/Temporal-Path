export default class DetailsPane {
	constructor(idPrefix) {
		this._idPrefix = idPrefix;
	}
	
	updatePane(data) {
		this._articlesList = data;
		$("#" + this._idPrefix + "-list").text("");
		for(let articleId in this._articlesList) {
			this._addNewArticle(this._articlesList[articleId], articleId, this._articlesList.length);
		}
	}
	
	_addNewArticle(data, articleId, total) {
		let idPrefix = this._idPrefix;
		$("#" + idPrefix + "-list").append(
			'<div class="side + ' + (articleId == 0 ? 'active' : '') + '">' +
				'<div class="row">' +
					'<div class="ui large labels">' +
						'<div class="ui label">' +
							'<span>Title:&nbsp;</span>' +
							'<span>' + data.title + '</span>' +
						'</div>' +
						'<div class="ui label">' +
							'<span>Author:&nbsp;</span>' +
							'<span>' + data.author + '</span>' +
						'</div>' +
						'<div class="ui label">' +
							'<span>Date:&nbsp;</span>' +
							'<span>' + data.date + '</span>' +
						'</div>' +
						'<div class="ui label">' +
							'<span>Type:&nbsp;</span>' +
							'<span>' + data.type + '</span>' +
						'</div>' +
						'<a class="ui label next-article" onClick="$(\'#' + idPrefix + '-pane\').shape(\'flip right\')">' +
							'<span>' + (parseInt(articleId) + 1) + '/' + total + '>></span>' +
						'</a>' +
					'</div>' +
				'</div>' +
				'<div class="row"><p>' + data.text + '</p></div>' +
			'</div>');
	}
}