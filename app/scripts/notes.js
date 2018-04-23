import Utils from './utils';

export default class NotesBox {
	constructor(idPrefix) {
		this._idPrefix = idPrefix;
		for(let i = 0; i < localStorage.length; i++){
			let date = localStorage.key(i);
			$("#" + this._idPrefix + "-list").append('<div class="field">' +
						'<div class="ui radio checkbox note-date">' +
							'<input type="radio" name="note-date-name">' +
							'<label>' + date + '</label>' +
						'</div>' +
					'</div>');
		}
	}
	
	getSessionNote(date) {
		return localStorage.getItem(date);
	}
	
	saveSession(sessionNote) {
		let now = new Date();
		let nowStr = now.getMonth() + '/' + now.getDate() + '/' + now.getFullYear() + ' ' + now.getHours() + ':' + now.getMinutes();
		localStorage.setItem(nowStr, sessionNote);
	}
}