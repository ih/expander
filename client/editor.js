// move all fragment boundaries after the caretPosition forward or backward 
var adjustFragmentBoundaries = 
	function(lengthDelta, caretPosition, expander) {
		_.each(expander.fragments, function(fragment) {
			// only need to adjust fragments after the point of edit
			if(fragment.border.open > caretPosition) {
				fragment.border.open += lengthDelta;
			}
			if(fragment.border.close > caretPosition) {
				fragment.border.close += lengthDelta;
			}
		});
		return expander.fragments;
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
		/*
		 * Compare the length before and after a change, if the content grew
		 * then text was inserted so increase the fragment borders after
		 * the point of insertion, do the opposite if the content shrank i.e.
		 * some text was deleted
		 */
		var self = this;
		var newContent = event.target.value;
		var oldContent = Session.getObjectValue('editingExpander', 'content');
		// insertion also in the equal length case since deleting text always
		// decreases the length
		var lengthDelta = newContent.length - oldContent.length;
		var caretPosition = $('.editor textarea').caret();
		// TODO update expander properties all at once if 
		// efficiency an issue
		var newFragments =
				adjustFragmentBoundaries(lengthDelta, caretPosition, self);
		Session.setObjectValue('editingExpander', 'fragments', newFragments);
		Session.setObjectValue('editingExpander', 'content', newContent);
	},
	'click .submit': function(event, template) {
		Meteor.call('updateExpander', {
			updatedExpander: Session.get('editingExpander'),
			// TODO remove when fragments are adjusted in the new way
			fragmentsData:  Session.get('fragmentsData')
		});
		Session.set ('editingExpander', undefined);
	},
    'click .cancel' : function (event, template) {
		Session.set ('editingExpander', undefined);
    },
	'click .delete' : function (event, template) {
		event.preventDefault();
		var editingExpander = Session.get('editingExpander');
		if (confirm ("Delete expander?")) {
			Meteor.call (
				'deleteExpander',
				{
					expanderId: editingExpander._id,
					parentId: editingExpander.parent
				});
			Session.set('editingExpander', undefined);
		}
		event.stopImmediatePropagation ();
	}
});


