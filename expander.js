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

    //***EXPANDER BEGIN***//
    //used to store color for fragment markers
    Session.set('colorMap', {});
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
            $('.fragment-marker').toggle();
            _.each(self.fragments, function(fragment) {
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
            return '<span class="hide fragment-marker '+ type + ' ' + fragment.id 
                + '">|</span>';
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
