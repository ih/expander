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
        //go through all the fragments and create a color
        //for any that have not been applied
        _.each(self.fragments, function(fragment) {
            var highlightState = Session.getObjectValue('highlightStates',
							fragment.id);
            Session.setObjectValue('highlightStates', fragment.id,
				   !highlightState);
            //TODO(irvin) this seems like an odd place to set the css color

        });
        event.stopImmediatePropagation();
    },
    'click .edit' : function (event, template) {
	var self = this;
	    // clear the fragmentData so we know if it is present it is
	    // intended for this edit, probably want to hide creator too
	Session.set ('fragmentData', undefined);
	Session.set ('editingExpanderId', this._id);
    },
    'click .save' : function (event, template) {
	    // TODO try to intelligently modify the fragments of the
	    // updated expander when content is edited
	var expanderData = template.data;
	expanderData.content = template.find ('textarea').value;
	Meteor.call ('updateExpander', {
	    udpatedExpander: expanderData,
	    fragmentData: Session.get ('fragmentData')
	});
	Session.set ('editingExpanderId', undefined);
    },
    'click .cancel' : function (event, template) {
	Session.set ('editingExpanderId', undefined);
    }
});


Template.expander.renderContent = function () {
    var self = this;

    if (self.content) {
        //assume content is a linear indexable structure
        var renderedContent = insertFragmentMarkers(self.content,
                                                    self.fragments);
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
    return Session.get ('editingExpanderId') === self._id;
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
    _.each(content, function (character, index) {
        var spanList = markerDictionary[index];
        if (spanList) {
            _.each(spanList['close'].concat(spanList['open']),
                   function(span) {
                       newContent += span;
                   });
        }
        newContent += character;
    });
    //TODO(irvin) take care of the case for inserting markers after the last
    //character in content
    return newContent;
}
