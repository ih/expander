Template.expanderCreator.events({
    'submit form': function (event, template) {
	event.preventDefault ();
        var self = this;
        var newContent = template.find('textarea').value;
        //create a new expander
	// server-side createExpander will fill in fragment's id attribute
	var fragment = {border : self.border, id : undefined};
	var newExpanderData = {
	    parent : self.parent._id,
            content : newContent,
            parentFragment : self.selectionString
	};
	Meteor.call ('createExpander', {newExpanderData:  newExpanderData,  fragment: fragment}, 
		     function (error, id) {
			 if (error) {
			     return alert (error.reason);
			 }
			 return true;
		     });
    }
});
