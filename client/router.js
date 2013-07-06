Meteor.Router.add ({
    '/':  'welcome',
    '/expanders/:_id':  {
		// TODO change to use expander template directly and change template
		// so that it takes an expander key
	to:  'expanderViewer',
	    // TODO rename key to id
	and:  function (id) { Session.set ('selectedExpanderKey',  id); }
    }
});
