var highlightAllFragments = function (expander) {
	_.each(expander.fragments, function(fragment) {
        Session.setObjectValue('highlightStates', fragment.id,
							   true);
    });
};

// from http://stackoverflow.com/a/4652824
function getSelectionHtml(selection) {
    var html = "";
	if (selection.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = selection.rangeCount; i < len; ++i) {
                container.appendChild(selection.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    return html;
}

function removeAnnotations(htmlString) {
	// from http://stackoverflow.com/a/12110097
	function removeFromHtmlString(htmlString, selector) {
		var $wrapped = $('<div>'+htmlString+'</div>');
		$wrapped.find(selector).remove();
		return $wrapped.html();
	}
	htmlString = removeFromHtmlString(htmlString, '.fragment-indicator');
	htmlString = removeFromHtmlString(htmlString,  '.fragment-border');
	return htmlString;
}

function determineBorder(selection, content) {
}


function getBorderAndSelectedContent(selectionMarkers, contentHtmlString) {
	var nonAnnotatedMarkedContent = removeAnnotations(contentHtmlString);
	var border = {
		'open': nonAnnotatedMarkedContent.indexOf(selectionMarkers.open),
		'close': nonAnnotatedMarkedContent.indexOf(selectionMarkers.close) -
			selectionMarkers.open.length
	};

	var selectedContent = nonAnnotatedMarkedContent.slice(
		border.open+selectionMarkers.open.length,
		border.close+selectionMarkers.open.length);
	return {border: border, selectedContent: selectedContent};
}

function insertSelectionMarkers(selection) {
	function createMarkers() {
		// need a string that probably does not appear in the content
		// so that we can use indexOf to find it
		var uniqueString = new Date().getTime();
		var openMarker = 
			'<span class="selectionMarker" id="open'+uniqueString+'"></span>';
		var closeMarker = 
			'<span class="selectionMarker" id="close'+uniqueString+'"></span>';
		// [0] since they are jquery created and you need to extract the dom 
		// node for insertNode
		return {open: openMarker, close: closeMarker};
	}
	var markers = createMarkers();
	// insert the opening marker at the beginning of the selection
	var range = selection.getRangeAt(0);
	range.insertNode($(markers.open)[0]);
	// insert the closing marker at the end of the selection
	range.collapse(false);
	range.insertNode($(markers.close)[0]);
	return markers;
}

function removeSelectionMarkers() {
	$('.selectionMarker').remove();
}

Template.expander.events({
    'mouseup .content' : function (event, template) {
        var selection = window.getSelection();
		var markers = insertSelectionMarkers(selection);
		// TODO find a more robust way of getting contentHtml
		var contentHtmlString = $(event.target).html();
		var processedSelection = getBorderAndSelectedContent(
			markers, contentHtmlString);
		removeSelectionMarkers();
		var border = processedSelection.border;
		var selectedContent = processedSelection.selectedContent;
		// TODO order these so open is always the smaller one (can be
		// reversed if selected from left to right)
        Session.set('selectMode', false);
        if(selectedContent) {
            Session.set('showCreator', true);
            Session.set('fragmentData', {selectionString : selectedContent,
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
		var borderDictionary = createBorderDictionary(
			renderingExpander.fragments);
        var renderedContent = insertFragmentBorders(
			renderingExpander.content, borderDictionary);
		renderedContent = insertFragmentIndicators(
			renderedContent, borderDictionary);
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

function setFragmentIndicatorValues(expander) {
	var indicatorValues = {};
	_.each(expander.fragments, function(fragment) {
		incrementCounterDictionary(indicatorValues, fragment.border.close);
	});
	Session.setObjectValue('indicators', expander._id, indicatorValues);
}

Template.expander.rendered = function () {
	var self = this;
    var colorMap = Session.get('colorMap');
    _.each(_.keys(colorMap), function(fragmentId) {
        $('span.'+fragmentId).css('color', colorMap[fragmentId]);
    });
	if(!Session.get('indicators')) {
		Session.set('indicators', {});
	}
	setFragmentIndicatorValues(self.data);
};

function highlightFragment(caretPosition) {
    /* Determines which fragments should (not) be highlighted based on mouse
     position
     */

}

function createBorderDictionary (fragments) {
    /*
     A dictionary where the keys are positions in the content and the 
	 values are spans representing the borders of the fragments
	 open spans should always come after closing spans when
     rendering.
     */
    function createBorder (fragment, type) {
        var colorMap = Session.get('colorMap');
        var highlightStates = Session.get('highlightStates');
        if (colorMap[fragment.id] === undefined) {
            var newColor = randomColor();
            colorMap[fragment.id] = newColor;
        }
        Session.set('colorMap', colorMap);
        var border = type === 'open' ? '[' : ']';
        var hidden = highlightStates[fragment.id] ? '' : 'hide';
        return '<span class="'+hidden+' fragment-border '+ type + ' ' +
			fragment.id + '">'+ border +'</span>';
    }


    var borderDictionary = {};
    _.each(fragments, function (fragment) {
        if (borderDictionary[fragment.border.open] === undefined) {
            borderDictionary[fragment.border.open] = {open : [],
                                                      close : []};
        }
        if (borderDictionary[fragment.border.close] === undefined) {
            borderDictionary[fragment.border.close] = {open : [],
                                                       close : []};
        }
        var beginBorder = createBorder(fragment, 'open');
        borderDictionary[fragment.border.open]['open'].push(beginBorder);
        var endBorder = createBorder(fragment, 'close');
        borderDictionary[fragment.border.close]['close'].push(endBorder);
    });
    return borderDictionary;
}


function insertFragmentBorders (content, borderDictionary) {
    var newContent = '';
    /*
     Insert fragment borders by iterating over content instead of fragments
     since adding borders will change the length of the new content and
     make the fragment border information incorrect
     */
	for (var index = 0; index <= content.length; index++ ) {
		var character = content[index];
		var spanList = borderDictionary[index];
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

function insertFragmentIndicators(content, borderDictionary) {
	/*
	 Fragment indicators are visual cues for where fragments occur in the
	 content and how many end at a particular location

	 This function modifies content by inserting an indicator at the end of a
	 series of closing borders
	 */
	_.each(_.keys(borderDictionary),  function(position) {
		var closingBorders = borderDictionary[position]['close'];
		var fragmentCount = closingBorders.length;
		if(fragmentCount > 0) {
			var lastClosingBorder = _.last(closingBorders);
			var newIndicatorPosition = (
				content.indexOf(lastClosingBorder) + lastClosingBorder.length);
			var indicator = '<sup class=\"fragment-indicator\">'+fragmentCount+'</sup>';
			content = content.splice(newIndicatorPosition, 0, indicator);
		}
	});
	return content;
}
	/* 

*/
