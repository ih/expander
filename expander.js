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
            alert('hello');
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
            return '<span class="fragment-marker '+ type + ' ' + fragment.id 
                + '"></span>';
        }
        
        function insertMarker (marker, content, insertionPoint) {
            return content.splice(insertionPoint, 0, marker);
        }

        var contentCopy = _.clone(content);
        //create fragment markers for each fragment and insert them into
        //the copy of content, which then gets returned
        _.each(fragments, function (fragment) {
            //for now only applies for text
            var startMarker = createMarker(fragment, 'open');
            contentCopy = 
                insertMarker(startMarker, contentCopy, fragment.border.open);
            var endMarker = createMarker(fragment, 'close');
            contentCopy = 
                insertMarker(endMarker, contentCopy, fragment.border.close);
        });

        return contentCopy;
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
