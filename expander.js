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
                Session.set('fragmentData', {selectionString : selectionString, parent : this,
                                             border : border});
            }
        },
        'mousedown .content' : function (event, template) {
            Session.set('selectMode', true);
        },
        '' : function (event, template) {
        }
    });

    Template.expander.renderContent = function () {
        var self = this;
        
        if (self.content) {
            //assume content is a linear indexable structure
            var renderedContent = insertSpans(self.content, self.fragments);
            return renderedContent;
        }
        else {
            return '';
        }
    };

    Template.expander.selectMode = function () {
        return Session.get('selectMode');
    };



    function insertSpans (content, fragments) {
        function createSpanDictionary (fragments) {
            /*
             A dictionary where the positions in the content and the values are spans
             open spans should always come after closing spans when rendering
             */
            var spanDictionary = {};
            _.each(fragments, function (fragment) {
                if (spanDictionary[fragment.border.open] === undefined) {
                    spanDictionary[fragment.border.open] = {open : [], close : []};
                }
                if (spanDictionary[fragment.border.close] === undefined) {
                    spanDictionary[fragment.border.close] = {open : [], close : []};
                }
                spanDictionary[fragment.border.open]['open'].push('<span data-id="'+fragment.id+'">');
                spanDictionary[fragment.border.close]['close'].push('</span>');
            });
            return spanDictionary;
        }

        var spanDictionary = createSpanDictionary(fragments);
        var newContent = '';
        _.each(content, function (character, index) {
            var spanList = spanDictionary[index];
            if (spanList) {
                _.each(spanList['close'].concat(spanList['open']), function(span) {
                    newContent += span;
                });
            }
            newContent += character;
        });
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
            Expanders.update({_id : self.parent._id}, { $push: { fragments : fragment }});
        }
    });

    //***CREATOR END ***//
}

