var highlightAllFragments = function (expander) {
	_.each(expander.fragments, function(fragment) {
        Session.setObjectValue('highlightStates', fragment.id,
							   true);
    });
};

Template.expander.events({
    'mouseup .content' : function (event, template) {
        var selection = window.getSelection();
        var selectionString = selection.toString();
		// TODO order these so open is always the smaller one (can be
		// reversed if selected from left to right)
        var border = { open : selection.baseOffset,
                       close : selection.extentOffset };
        Session.set('selectMode', false);
        if(selectionString.length > 0) {
            Session.set('showCreator', true);
            Session.set('fragmentData', {selectionString : selectionString,
                                         parent : this,
                                         border : border});
        }
    },
    'mousedown .content' : function (event, template) {
        Session.set('selectMode', true);
    },
    'mousemove' : function (event, template) {
        var caretPosition =
                document.caretRangeFromPoint(event.x, event.y).endOffset;
        highlightFragment(caretPosition);
    },
    'click .highlight-all-fragments' : function (event, template) {
        var self = this;
        highlightAllFragments (self);
        event.stopImmediatePropagation();
    },
	'click .clear-all-highlights': function (event, template) {
        var self = this;
        _.each(self.fragments, function(fragment) {
            Session.setObjectValue('highlightStates', fragment.id,
								   false);
        });

		event.stopImmediatePropagation();
	},
	'click .highlight-selected' : function (event, template) {
		var self = this;
		_.each (self.fragments, function (fragment) {
			//TODO move to utilities?
			function isIntersecting(border1, border2) {
				return border1.open < border2.close &&
					border1.close > border2.open;
			}
			if (isIntersecting (fragment.border,
								Session.get ('fragmentData').border)) {
				Session.setObjectValue ('highlightStates', fragment.id, true);
			}
		});
		event.stopImmediatePropagation ();
	},
    'click .edit' : function (event, template) {
		var self = this;
	    // clear the fragmentData so we know if it is present it is
	    // intended for this edit, probably want to hide creator too
		Session.set ('fragmentData', undefined);
			// Session.set ('editingExpanderId', this._id);

		// make a deep copy of the expander and put it in the session
		var expanderCopy = $.extend (true, {}, self);
		Session.set ('editingExpander', expanderCopy);
		highlightAllFragments (expanderCopy);
    },
    'click .save' : function (event, template) {
	    // TODO try to intelligently modify the fragments of the
	    // updated expander when content is edited
		var expanderData = template.data;
		expanderData.title = template.find('.title-input').value;
		expanderData.content = template.find ('textarea').value;
		Meteor.call ('updateExpander', {
			updatedExpander: expanderData,
			fragmentData: Session.get ('fragmentData')
		});
		Session.set ('editingExpander', undefined);
		event.stopImmediatePropagation();
    },
    'click .cancel' : function (event, template) {
		Session.set ('editingExpander', undefined);
    },
	'click .delete' : function (event, template) {
		event.preventDefault ();
		if (confirm ("Delete expander?")) {
			Meteor.call ('deleteExpander',
						 {expanderId: this._id, parentId: this.parent});
		}
		event.stopImmediatePropagation ();
	}
});


Template.expander.renderContent = function () {
	var renderingExpander = this;
		// this editMode is incorrect
	var editingExpander = Session.get ('editingExpander');
	if (editingExpander && editingExpander._id === renderingExpander._id) {
		renderingExpander = Session.get ('editingExpander');

	}

    if (renderingExpander.content) {
        //assume content is a linear indexable structure
        var renderedContent = insertFragmentMarkers(renderingExpander.content,
                                                    renderingExpander.fragments);
        return renderedContent;
    }
    else {
        return '';
    }
};

Template.expander.selectMode = function () {
    return Session.get('selectMode');
};

Template.expander.editMode = function () {
	/*determine whether this expander is the one being edited*/
    var self = this;
	if (Session.get ('editingExpander')) {
		return Session.get ('editingExpander')._id === self._id;
	}
	else {
		return false;
	}
};

Template.expander.rendered = function () {
    var colorMap = Session.get('colorMap');
    _.each(_.keys(colorMap), function(fragmentId) {
        $('span.'+fragmentId).css('color', colorMap[fragmentId]);
    });
};

function highlightFragment(caretPosition) {
    /* Determines which fragments should (not) be highlighted based on mouse
     position
     */

}


function insertFragmentMarkers (content, fragments) {
    function createMarker (fragment, type) {
        var colorMap = Session.get('colorMap');
        var highlightStates = Session.get('highlightStates');
        if (colorMap[fragment.id] === undefined) {
            var newColor = randomColor();
            colorMap[fragment.id] = newColor;
        }
        Session.set('colorMap', colorMap);
        var marker = type === 'open' ? '[' : ']';
        var hidden = highlightStates[fragment.id] ? '' : 'hide';
        return '<span class="'+hidden+' fragment-marker '+ type + ' ' +
			fragment.id + '">'+ marker +'</span>';
    }
    function createMarkerDictionary (fragments) {
        /*
         A dictionary where the positions in the content and the values are
         spans open spans should always come after closing spans when
         rendering.
         */
        var markerDictionary = {};
        _.each(fragments, function (fragment) {
            if (markerDictionary[fragment.border.open] === undefined) {
                markerDictionary[fragment.border.open] = {open : [],
                                                          close : []};
            }
            if (markerDictionary[fragment.border.close] === undefined) {
                markerDictionary[fragment.border.close] = {open : [],
                                                           close : []};
            }
            var beginMarker = createMarker(fragment, 'open');
            markerDictionary[fragment.border.open]['open'].push(beginMarker);
            var endMarker = createMarker(fragment, 'close');
            markerDictionary[fragment.border.close]['close'].push(endMarker);
        });
        return markerDictionary;
    }

    var markerDictionary = createMarkerDictionary(fragments);
    var newContent = '';
    /*
     Insert fragment markers by iterating over content instead of fragments
     since adding markers will change the length of the new content and
     make the fragment border information incorrect
     */
	for (var index = 0; index <= content.length; index ++ ) {
		var character = content[index];
		var spanList = markerDictionary[index];
        if (spanList) {
            _.each(spanList['close'].concat(spanList['open']),
                   function(span) {
                       newContent += span;
                   });
        }
		// don't try to add any characters after content is over
		if (index < content.length) {
			newContent += character;
		}
	}
    return newContent;
}
