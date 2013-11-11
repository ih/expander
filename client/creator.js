Template.expanderCreator.events({
    'submit form': function (event, template) {
	event.preventDefault ();
        var self = this;

	    // if there is no selection then create a new expander
	var fragment = undefined;
	var newExpanderData = {
	    fromExpanderIds: [],
		title: template.find ('.title-input').value,
	    content: template.find('textarea').value
	};
	    //if there is selection data then add it to the expander
	if (self.fromExpander) {
	    fragment = {
			border: self.border,
			toExpanderid: undefined
		};
	    newExpanderData.fromExpanderIds.push(self.fromExpander._id);
	}

        //create a new expander
	// server-side createExpander will fill in fragment's id attribute
	// if there was a parent
	Meteor.call ('createExpander',
		     {newExpanderData:  newExpanderData,
		      fragment: fragment
		     },
		     function (error, id) {
			 if (error) {
			     return alert (error.reason);
			 }
			 return true;
		     });
    },
    'click .clear': function (event, template) {
	event.preventDefault ();
	Session.set ('fragmentData', undefined);
	template.find ('textarea').value = '';
    }
});
