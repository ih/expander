

if (Meteor.is_client){
    /*** HELPERS BEGIN ***/
    Handlebars.registerHelper('hide', function (condition) {
        return condition ? 'hide' : '';
    });

    Handlebars.registerHelper('show', function (condition) {
        return condition ? '' : 'hide';
    });

    // TODO is there a way to access Session variables directly in the template?
    Handlebars.registerHelper ('getSelectedFragmentData',  function () {
	return Session.get('fragmentData') ||  {};
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
                $(fragmentMarkerClass).removeClass('hide');
            }
            else {
                $(fragmentMarkerClass).addClass('hide');
            }
        });
    }

    Deps.autorun(highlightFragments);
    //***DISPLAY LOGIC END***//


    //***FRAGMENTS VIEWER BEGIN***//
    Template.fragmentsViewer.getExpander = function (id) {
        return Expanders.findOne(id);
    };

    Template.fragmentsViewer.getHighlightedFragments = function () {
        var self = this;
        try {
            var highlightedFragments = _.filter(self.fragments, function (fragment) {
                return Session.get('highlightStates')[fragment.id];
            });
            return highlightedFragments;
        }
        catch (error) {
            console.log('could not return fragments for selected expander');
            return [];
        }
    };
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

    Template.fragmentsViewer.rendered = function () {
        var colorMap = Session.get('colorMap');
        _.each(_.keys(colorMap), function(fragmentId) {
            $('.fragment.'+fragmentId).css('border-color', colorMap[fragmentId]);
        });
    };
    //***FRAGMENTS VIEWER END***//
    //***FRAGMENT BEGIN***//
    Template.fragment.getExpander = function() {
        self = this;
        return Expanders.findOne(self.id) || {};
    };

    Template.fragment.events({
        'change, keyup, blur .border': function(event) {
            //TODO move this to utility library
             function updateFragmentBorder(parentExpander, expanderId,
                                           borderType, newValue) {
                //modify the border of the fragment in question
                _.each(parentExpander.fragments, function (fragment) {
                    if(expanderId === self.id) {
                        fragment.border[borderType] = Number(newValue);
                    }
                });
                Expanders.update(parentExpander._id,
                                 {$set: {fragments: expander.fragments}});
            }
            self = this;
            var expanderId = self.id;
            //TODO(irvin) better way to determine whether open/close border?
            var newValue = $(event.currentTarget).val();
            var expander = Expanders.findOne(self.id);
            var parentExpander = Expanders.findOne(expander.parent);
            if(_.contains(event.currentTarget.classList, 'open')) {
                updateFragmentBorder(parentExpander, self.id, 'open', newValue);
            }
            else {
                updateFragmentBorder(parentExpander, self.id, 'close', newValue);
            }
        }
    });
    //***FRAGMENT END***//
}
