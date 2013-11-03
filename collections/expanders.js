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
	parentFragment: 'from the parent'
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
								   'parent', 'content', 'parentFragment', 'title');
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
			Expanders.update (expanderData.parent,
							  {$push: {fragments: fragment}});
		}
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
					return fragment.toExpanderId === updatedExpander._id;
				};
				parentExpander.fragments = _.reject (
					parentExpander.fragments, sameId);
				// can't update _id so pick out the fields that actally need
				// updating
				Expanders.update (parentExpander._id,
								  {$set: _.omit (parentExpander, '_id')});
				// remove information about the parent from the expander
				updatedExpander.parentFragment = undefined;
			}
		}

		function addAsFragment (updatedExpander, fragmentData) {
			// create a fragment and add it to the new parent's fragment
			// list
			var newFragment = {
				border: fragmentData.border,
				toExpanderId: updatedExpander._id
			};
			Expanders.update (fragmentData.parent._id,
							  {$push: {fragments: newFragment}});
			// update the parentFragment field in the expander
			updatedExpander.parentFragment = fragmentData.selectionString;
		}

		function adjustIfFragmentsChanged(originalExpander, updatedExpander) {
			function findChangedFragments(originalExpander, updatedExpander) {
				/*
				 * compares the old expander with the new to see if the
				 * content of the fragments has changed
				 * returns a changedFragmentData object for each changed
				 * fragment, which contains the fragment expander id along
				 * with the changed content of that fragment
				 */
				function getFragmentContent(fragment, expander) {
					return	expander.content.slice(
						fragment.border.open, fragment.border.close);
				}
				var fragmentPairs = _.zip(
					originalExpander.fragments, updatedExpander.fragments);
				var OLD = 0;
				var NEW = 1;
				var changedFragmentData = _.map(
					fragmentPairs, function(fragmentPair) {
						console.assert(
							fragmentPair[OLD].toExpanderId  === fragmentPair[NEW].toExpanderId);
						var newFragmentContent = getFragmentContent(
							fragmentPair[NEW], updatedExpander);
						var oldFragmentContent = getFragmentContent(
							fragmentPair[OLD], originalExpander);
						if(newFragmentContent !== oldFragmentContent) {
							return {
								toExpanderId: fragmentPair[NEW].toExpanderId,
								newContent: newFragmentContent
							};
						}
						else {
							return null;
						}
					});
				return _.without(changedFragmentData, null);
			}
			function updateFragmentExpander(changedFragmentData) {
				/*
				 * changes the parentFragment property of the expander that
				 * corresponds to the fragment that has changed
				 */
				Expanders.update(
					changedFragmentData.toExpanderId,
					{$set: {parentFragment: changedFragmentData.newContent}});
			}
			var changedFragments =
					findChangedFragments(originalExpander,  updatedExpander);
			_.each(changedFragments, function(changedFragmentData) {
				// changes parentFragment for the fragment expander
				updateFragmentExpander(changedFragmentData);
			});
		}

	    // if there is fragmentData then we need to adjust the connections
	    // to other expanders
		if (dataFromClient.fragmentData !== undefined) {
			removeAsFragment (updatedExpander);
			addAsFragment (updatedExpander, dataFromClient.fragmentData);
		}
		// if the content has changed within a fragment adjust parentFragment
		// for the expanders that corresponds to those fragments
		var originalExpander = Expanders.findOne(updatedExpander._id);
		adjustIfFragmentsChanged(originalExpander, updatedExpander);
		updatedExpander.lastEditTime = new Date().getTime();
		Expanders.update (updatedExpander._id,
						  {$set: _.omit (updatedExpander, '_id')});
    },
	deleteExpander: function (dataFromClient) {
		function removeFromParentFragments (parentId, expanderId) {
			var parent = Expanders.findOne (parentId);
			var targetFragment = _.find (parent.fragments, function (fragment) {
				return fragment.toExpanderId === expanderId;
			});
			// TODO is there a way to do this without getting the parent first?
			Expanders.update (parentId, {$pull: {fragments: targetFragment}});
		}
		if (dataFromClient.parentId) {
 			removeFromParentFragments (dataFromClient.parentId,
									   dataFromClient.expanderId);
		}
		Expanders.remove (dataFromClient.expanderId);
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
