// move all fragment boundaries after the caretPosition forward or backward 
var adjustFragmentBoundaries = 
	function(lengthDelta, caretPosition, expander) {
		_.each(expander.fragments, function(fragment) {
			console.log(fragment.border);
		});
	};

Template.expanderEditor.helpers ({
	editingExpander: function () {
		return Session.get('editingExpander');
	}
});

// prevent the editing area from losing focus as updated
Template.expanderEditor.preserve(['.editor textarea']);

Template.expanderEditor.events({
	'input .editor textarea': function(event, template) {
		var self = this;
		// every time a change to the editor happens trigger an
		// insertion or deletion event
		var newContent = event.target.value;
		var oldContent = Session.getObjectValue('editingExpander', 'content');
		// insertion also in the equal length case since deleting text always
		// decreases the length
		var lengthDelta = newContent.length - oldContent.length;
		var caretPosition = $('.editor textarea').caret();
		if(lengthDelta >= 0) {
			// insertion event so increase the fragment boundaries after
			// the caret
			console.log('insertion');
			adjustFragmentBoundaries(lengthDelta, caretPosition, self);
		}
		else {
			// deletion event so decrease the fragment boundaries after
			// the caret
			console.log('deletion');
		}
		Session.setObjectValue('editingExpander', 'content', newContent);
	}
});



/*
 get
*/

// http://stackoverflow.com/questions/14153205/->
// how-to-trigger-a-custom-event-with-meteor-js

	// function attachEvents () {
	// var editorSelector = '.editor textarea';
	// $(editorSelector).on('insertion', function() {
	// 	console.log('insertion');
	// });
	// $(editorSelector).on('deletion', function() {
	// 	console.log('deletion');
	// });

	// every time a change to the editor happens trigger an
	// insertion or deletion event
		/* 
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
		 */
	
// }

// Template.expanderEditor.rendered = function (){
// 	attachEvents ();
// };


