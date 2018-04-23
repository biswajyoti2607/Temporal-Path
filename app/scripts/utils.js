const DEBUG = true;

/////////////////////
/// devices helper //
/////////////////////

// < IE9
var isOldBrowser = !(('querySelector' in document) && ('localStorage' in window) && ('addEventListener' in window)),
  // includes tables and smartphones
  isMobile = !isUndefined(window.orientation),
  // smartphone detection (android,iphone,blackberry,windows phone)
  isSmartphone = /android.*mobile|mobile.*android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  // device depending click event
  clickEvent = isMobile ? 'touchstart' : 'click';



///////////////////////
/// helper functions //
///////////////////////

function isUndefined(obj) {
  return typeof obj === 'undefined';
}

function isFunction(obj) {
	return !!(obj && obj.constructor && obj.call && obj.apply);
}

function emptyFunction() {
	return;
}

function isNumeric(number) {
  if(isUndefined(number)){
    return false;
  }

  return !isNaN(number) && isFinite(number);
}

function numberFormat(number) {

  if (!isNumeric(number)) {
    return false;
  }

  return number.toLocaleString('en-EN');
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// add some classes to the html element
function addHelperClasses() {
  let htmlElement = document.getElementsByTagName('html')[0],
    className = [];

  if (isOldBrowser) {
    className.push('is-oldbrowser');
  }

  if (isMobile) {
    className.push('is-mobile');
  }

  if (isSmartphone) {
    className.push('is-smartphone');
  }

  htmlElement.className = className.join(' ');
}

function log(){
  if(!DEBUG) {
    return false;
  }
  
  let args = Array.prototype.slice.call(arguments);

  if(args.length === 1){
    args = args[0];
  }

  console.log(args);  
}

function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}

export default {
  isMobile,
  isSmartphone,
  isOldBrowser,
  clickEvent,
  isUndefined,
  isFunction,
  emptyFunction,
  isNumeric,
  numberFormat,
  capitalizeFirstLetter,
  addHelperClasses,
  log,
  hashCode
};