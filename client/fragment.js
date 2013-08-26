// based on
// http://stackoverflow.com/questions/5143534/get-the-position-of-text-within-an-element
// basically put an empty span in the position of the closing border, get its
// position when rendered then remove it
function getIndicatorCoordinates(fragment) {
	// get the html element of the plain content for the expander
	var $expanderContentElement =
			$('#expander-' +
			  fragment.parentExpanderId +
			  ' .view-mode .content pre');
	var indicatorPosition = fragment.border.close;
	var textWithSpan = $expanderContentElement
			.html()
			.splice(
				fragment.border.close, 
				0, '<span class="position-span"></span>');

	// reset the content element so the position of the new span can be found
	$expanderContentElement.html(textWithSpan);
	// var $positionSpan = $expanderContentElement.find('.position-span');
	var $positionSpan = $('.position-span');
	console.log($positionSpan);
	var coordinates = $positionSpan.offset();
	console.log(coordinates);
	$positionSpan.remove();
	console.log(coordinates);
	return coordinates;
}
function positionIndicator(fragment) {
	var coordinates = getIndicatorCoordinates(fragment);
	$('#fragment-indicator-' + fragment.id).offset(coordinates);
}

Template.fragment.rendered = function() {
	var self = this;
	positionIndicator(self.data);
};

Template.fragment.getIndicatorValue = function() {
	var self = this;
	var thisExpanderIndicators = Session.getObjectValue(
		'indicators', self.parentExpanderId);
	if(!thisExpanderIndicators || thisExpanderIndicators === {}) {
		return 0;
	}
	return thisExpanderIndicators[self.border.close];
};
