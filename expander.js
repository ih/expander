//TODO (irvin) why is expanders already taken?
Expanders = new Meteor.Collection('expanders');

/* uncomment when autopublish package removed
Meteor.subscribe('expanders');
*/
if (Meteor.is_client){
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
        'mouseup .content': function (event, template) {
            var selection = window.getSelection();
            if(selection.length > 0) {
                Session.set('showCreator', true);
                Session.set('fragmentData', {selection: selection, parent: this});
            }
        }
    });

    Template.expander.renderContent = function () {
        var self = this;
        
        if (self.content) {
            //assume content is a linear indexable structure
            var renderedContent = insertSpans(self.content, self.fragments);
            return '<b>'+renderedContent+'</b>';
        }
        else {
            return '';
        }
    };

    function insertSpans (content, fragments) {
        function createSpanDictionary (fragments) {
            var spanDictionary = {};
            _.each(fragments, function (fragment) {
                spanDictionary[fragment.border.open] = '<span data-id="'+fragment.id+'">';
                spanDictionary[fragment.border.close] = '</span>';
            });
            return spanDictionary;
        }

        var spanDictionary = createSpanDictionary(fragments);
        var newContent = '';
        _.each(content, function (character, index) {
            var span = spanDictionary[index];
            if (span) {
                newContent += span + character;
            }
            else {
                newContent += character;
            }
        });
        return newContent;
    }
    //***EXPANDER END***//

    Template.expanderCreator.events({
        'click button': function (event, template) {
            var self = this;
            var newContent = template.find('textarea').value;
            //create a new expander
            newExpanderId = Expanders.insert({
                parent: self.parent._id, 
                content: newContent, 
                parentFragment: self.selection
            });
            //add fragment information to current expander
            //var fragment
        }
    });
}

