Meteor.Router.add ({
    '/':  'welcome',
    '/expanders/:_id':  {
	to:  'expanderViewer',
	    // TODO rename key to id
	and:  function (id) { Session.set ('selectedExpanderKey',  id); }
    }
});
