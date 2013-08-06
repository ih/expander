// based on 
// http://stackoverflow.com/questions/5143534/get-the-position-of-text-within-an-element
function getIndicatorCoordinates() {
	// expanderElement = $()
	return {top: 40, left: 130};
}
function positionIndicator(fragment) {
	var coordinates = getIndicatorCoordinates(fragment.border);
	$('#fragment-indicator-' + fragment.id).offset(coordinates);
}
Template.fragment.rendered = function() {
	positionIndicator(this.data);
};
