// declared without var so accessible outside this file
Expanders = new Meteor.Collection('expanders');

/**
{
	title: 'A title',
	content: 'The body of the expander',
	fragments: [{
		border: {
			open: 13,
			close: 20
		},
		toExpanderId: 'expander123'
	}],
	fromExpanderIds: ['expander121', 'expander122'],
	creationTime: 12345,
}
*/

var ownsDocument = function(userId, doc) {
	return doc && doc.userId === userId;
};

Expanders.allow ({
    update: ownsDocument,
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
								   'fromExpanderIds', 'content', 'title');
	    // add additional data to the new expander
		var additionalExpanderData = {
			creatorId: user._id,
			creationTime: new Date ().getTime (),
			lastEditTime: new Date ().getTime (),
			fragments: []
		};
		_.extend (expanderData, additionalExpanderData);
		var newExpanderId = Expanders.insert (expanderData);
		if (dataFromClient.fragment) {
			var fragment = dataFromClient.fragment;
			fragment.toExpanderId = newExpanderId;
			Expanders.update (expanderData.fromExpanderIds[0],
							  {$push: {fragments: fragment}});
		}
    },
    updateExpander: function (dataFromClient) {
	    // this expanderData has updated content
		var updatedExpander = dataFromClient.updatedExpander;
	    // if there is fragmentData then we need to adjust the connections
	    // to other expanders
		if (dataFromClient.fragmentData !== undefined) {
			addAsFragment (updatedExpander, dataFromClient.fragmentData);
		}
		var originalExpander = Expanders.findOne(updatedExpander._id);
		adjustIfFragmentsChanged(originalExpander, updatedExpander);
		updatedExpander.lastEditTime = new Date().getTime();
		Expanders.update (updatedExpander._id,
						  {$set: _.omit (updatedExpander, '_id')});

		function addAsFragment (updatedExpander, fragmentData) {
			// create a fragment and add it to the new parent's fragment
			// list
			var newFragment = {
				border: fragmentData.border,
				toExpanderId: updatedExpander._id
			};
			Expanders.update (fragmentData.fromExpander._id,
							  {$push: {fragments: newFragment}});
		}
    },
	deleteExpander: function (dataFromClient) {
		var targetExpander = dataFromClient.expander;
		if (targetExpander.fromExpanderIds.length > 0) {
 			removeFromExpanderFragments (targetExpander);
		}
		Expanders.remove (targetExpander._id);
		function removeFromExpanderFragments (expander) {
			// replace with batch find in mongo?
			_.each(expander.fromExpanderIds, function(fromExpanderId) {
				var fromExpander = Expanders.findOne (fromExpanderId);
				var targetFragments = _.filter(fromExpander.fragments, function (fragment) {
					return fragment.toExpanderId === expander._id;
				});
				// TODO is there a way to do this without getting the parent first?
				_.each(targetFragments, function (targetFragment) {
					Expanders.update (fromExpanderId, {$pull: {fragments: targetFragment}});
				});
			});
		}
	},
	/**
	 * dataFromClient:
	 * {
	 *
	 *}
	 */
	linkExpanders: function (clientData) {
		var toExpander = Expanders.findOne(
			clientData.fragment.toExpanderId);
		if (toExpander === undefined) {
			throw Meteor.Error(404, 'no target expander');
		}

		// adjust the fragments of the source expander
		Expanders.update(
			clientData.fragment.parentExpanderId,
			{$push: {fragments: clientData.fragment}});

		// adjust the parents of the target expander
		toExpander.parents[clientData.fragment.parentExpanderId] = {
			creationTime: new Date().getTime()
		};
	}
});
