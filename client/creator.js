Template.expanderCreator.events({
    'click button': function (event, template) {
        var self = this;
        var newContent = template.find('textarea').value;
        //create a new expander
        var newExpanderId = Expanders.insert({
            //TODO rename parentId
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
