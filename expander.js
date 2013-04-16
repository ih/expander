//TODO (irvin) why is expanders already taken?
Expanders = new Meteor.Collection('expanders');

/* uncomment when autopublish package removed
Meteor.subscribe('expanders');
*/
if (Meteor.is_client){
    /*** HELPERS BEGIN ***/
    Handlebars.registerHelper('hide', function (condition) {
        return condition ? 'hide' : '';
    });

    Handlebars.registerHelper('show', function (condition) {
        return condition ? '' : 'hide';
    });

    //convenience function for setting object values in the Session
    //if this is slow then perhaps "flatten" objects when storing them in
    //the Session
    Session.setObjectValue = function (objectName, key, value) {
        var sessionObject = Session.get(objectName);
        sessionObject[key] = value;
        Session.set(objectName, sessionObject);
    };

    Session.getObjectValue = function (objectName, key) {
        try {
            var sessionObject = Session.get(objectName);
            return sessionObject[key];
        }
        catch (error) {
            console.log('error getting object value in session returning empty');
            return {};
        }
    };
    /*** HELPERS END ***/

    Session.set('selectMode', false);
    Template.page.fragmentData = function () {
        return Session.get('fragmentData') || {};
    };


    Template.expanderKeys.getAllExpanders = function () {
        return Expanders.find();
    };

    Template.expanderSelector.events({
        'click button': function (event, template) {
            var expanderKey =  template.find('input').value;
            Session.set('selectedExpanderKey', expanderKey);
        }
    });

    Template.expanderViewer.selectedExpander = function () {
        return Expanders.findOne(Session.get("selectedExpanderKey"));
    };

    //***DISPLAY LOGIC BEGIN***//
    /*
     Display logic that crosses that may affect more than one template
     */
    //used to store color for fragment markers
    Session.set('colorMap', {});
    //used to determine whether a fragment is currently highlighted or not
    Session.set('highlightStates', {});
    function highlightFragments() {
        //update display for fragments with highlight state true
        var highlightStates = Session.get('highlightStates');
        _.each(_.keys(highlightStates), function (fragmentId) {
            var fragmentMarkerClass = '.fragment-marker.' + fragmentId;
            if ( highlightStates[fragmentId] ) {
                $(fragmentMarkerClass).show();
            }
            else {
                $(fragmentMarkerClass).hide();
            }
        });
    }

    Deps.autorun(highlightFragments);
    //***DISPLAY LOGIC END***//

    //***EXPANDER BEGIN***//
    
    Template.expander.events({
        'mouseup .content' : function (event, template) {
            var selection = window.getSelection();
            var selectionString = selection.toString();
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
                var highlightState = Session.getObjectValue('highlightStates', fragment.id);
                Session.setObjectValue('highlightStates', fragment.id, !highlightState);
                //TODO(irvin) this seems like an odd place to set the css color
                var colorMap = Session.get('colorMap');
                $('.'+fragment.id).css('color', colorMap[fragment.id]);
            });
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

    function highlightFragment(caretPosition) {
        /* Determines which fragments should (not) be highlighted based on mouse 
         position
         */

    }


    function insertFragmentMarkers (content, fragments) {
        function createMarker (fragment, type) {
            var colorMap = Session.get('colorMap');
            if (colorMap[fragment.id] === undefined) {
                var newColor = randomColor();
                colorMap[fragment.id] = newColor;
            }
            Session.set('colorMap', colorMap);
            var marker = type === 'open' ? '[' : ']';
            return '<span class="hide fragment-marker '+ type + ' ' + fragment.id 
                + '">'+ marker +'</span>';
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

    
    //***EXPANDER END***//

    //***FRAGMENTS VIEWER BEGIN***//
    Template.fragmentsViewer.getHighlightedExpanders = function () {
        var self = this;
        try {
            var highlightedFragments = _.filter(self.fragments, function (fragment) {
                return Session.get('highlightStates')[fragment.id];
            });
            var fragmentIds = _.pluck(highlightedFragments, 'id');
            var highlightedExpanders = _.map(fragmentIds, function(id) {
                return Expanders.findOne(id);
            });
            return highlightedExpanders;
            //see if there is a query/find that can take multiple ids
            //return Expanders.find(fragmentIds);
        }
        catch (error) {
            console.log('could not return fragments for selected expander');
            return [];
        }
    };
    //***FRAGMENTS VIEWER END***//

    //***CREATOR BEGIN ***//
    Template.expanderCreator.events({
        'click button': function (event, template) {
            var self = this;
            var newContent = template.find('textarea').value;
            //create a new expander
            var newExpanderId = Expanders.insert({
                parent : self.parent._id, 
                content : newContent, 
                parentFragment : self.selectionString,
                fragments : []
            });
            //add fragment information to current expander
            var fragment = {border : self.border, id : newExpanderId};
            Expanders.update({_id : self.parent._id}, 
                             { $push: { fragments : fragment }});
        }
    });

    //***CREATOR END ***//
}
//MOVE TO UTIL FILE
//http://stackoverflow.com/questions/4313841/javascript-how-can-i-insert-a-string-at-a-specific-index
String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

function randomColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
}
