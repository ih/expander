// declared without var so accessible outside this file
Expanders = new Meteor.Collection('expanders');

var ownsDocument = function(userId, doc) {
  return doc && doc.userId === userId;
};

Expanders.allow ({
    remove: ownsDocument
});

Meteor.methods ({
	// TODO could add check on content size
    createExpander:  function (dataFromClient) {
	var user = Meteor.user ();
	if (!user) {
	    throw new Meteor.Error (401, 'You need to log in to create a new' + 
				    'expander');
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
	    // this expanderData has updated content
	var updatedExpander = dataFromClient.updatedExpander;

	function removeAsFragment (updatedExpander) {
	    if (updatedExpander.parent !== undefined) {
		// remove the expander corresponding to expanderId from its
		// parent fragments 
		var parentExpander = Expanders.findOne (updatedExpander.parent);
		function sameId (fragment) {
		    return fragment.id === updatedExpander._id;
		};
		parentExpander.fragments = _.reject (parentExpander, sameId);
		Expanders.update (parentExpander._id, {$set: parentExpander});
		// remove information about the parent from the expander
		updatedExpander.parentFragment = undefined;
	    }
	}

	function addAsFragment (updatedExpander, fragmentData) {
		// create a fragment and add it to the new parent's fragment 
		// list
	    var newFragment = {
		border: fragmentData.border, 
		id: updatedExpander._id
	    };
	    Expanders.update (fragmentData.parent._id, 
			      {$push: {fragments: newFragment}});
		// update the parentFragment field in the expander
	    updatedExpander.parentFragment = fragmentData.selectionString;
	}

	    // if there is fragmentData then we need to adjust the connections
	    // to other expanders
	if (dataFromClient.fragmentData !== undefined) {
	    removeAsFragment (updatedExpander);
	    addAsFragment (updatedExpander, dataFromClient.fragmentData);
	}
	Expanders.update (dataFromClient.expanderId, 
			  {$set: dataFromClient.expanderData});
    }
});
