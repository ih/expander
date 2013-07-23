Template.expanderEditor.helpers ({
	editingExpander: function () {
		return Session.get('editingExpander');
	}
});

// prevent the editing area from losing focus as updated
Template.expanderEditor.preserve(['.editor textarea']);

Template.expanderEditor.events({
	'input .editor textarea': function(event, template) {
		console.log('input!');
		var newContent = event.target.value;
		Session.setObjectValue('editingExpander', 'content', newContent);

	}
});

/*
 get
*/
function getTextChangeEventData() {

}

// http://stackoverflow.com/questions/14153205/how-to-trigger-a-custom-event-with-meteor-js
	/* 
function attachEvents () {
	var editorSelector = '.editor textarea';
	$(editorSelector).on('insertion', function() {
		console.log('insertion');
	});
	$(editorSelector).on('deletion', function() {
		console.log('deletion');
	});

	// every time a change to the editor happens trigger an
	// insertion or deletion event
	$(editorSelector).bind('input propertychange', function (eventObject) {
		var eventData = getTextChangeEventData();
		var rando = choose([1, 2]);
		if(rando === 1) {
			$(editorSelector).trigger('insertion');
		}
		else {
			$(editorSelector).trigger('deletion');
		}
		var newContent = eventObject.target.value;
		Session.setObjectValue('editingExpander', 'content', newContent);
	});

	
}

Template.expanderEditor.rendered = function (){
		attachEvents ();
};

*/
