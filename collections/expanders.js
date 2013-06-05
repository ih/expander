// declared without var so accessible outside this file
Expanders = new Meteor.Collection('expanders');

Expanders.allow ({
    update: ownsDocument,
    remove: ownsDocument
});

Meteor.methods ({
	// TODO could add check on content size
    createExpander:  function (dataFromClient) {
	var user = Meteor.user ();
	if (!user) {
	    throw new Meteor.Error (401, 'You need to log in to create a new expander');
	}
	    // pick out the whitelisted keys
	    // TODO rename parent to parentId
	var expanderData = _.pick (dataFromClient.newExpanderData,
				   'parent', 'content', 'parentFragment');
	    // add additional data to the new expander
	var additionalExpanderData = {
	    creatorId: user._id,
	    creationDate: new Date ().getTime (),
	    fragments: []
	};
	_.extend (expanderData, additionalExpanderData);
	var newExpanderId = Expanders.insert (expanderData);
	var fragment = dataFromClient.fragment;
	fragment.id = newExpanderId;
	Expanders.update (expanderData.parent, {$push: {fragments: fragment}});
    },
    updateExpander: function (dataFromClient) {
	
    }
});
