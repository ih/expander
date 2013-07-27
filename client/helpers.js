Handlebars.registerHelper('hide', function (condition) {
    return condition ? 'hide' : '';
});

Handlebars.registerHelper('show', function (condition) {
    return condition ? '' : 'hide';
});

Handlebars.registerHelper ('getTitle', function (expanderId) {
	try {
		return Expanders.findOne (expanderId).title;
	} catch (exception) {
		console.warn (exception.name + ':' + exception.message + 
					  'for expander ' + expanderId);
		return '';
	}
});

Handlebars.registerHelper('getParentFragment', function(expanderId) {
	try {
		return Expanders.findOne(expanderId).parentFragment;
	} catch(exception) {
		// TODO factor out exception code
		console.warn (exception.name + ':' + exception.message + 
					  'for expander ' + expanderId);
		return '';
	}
});

// TODO is there a way to access Session variables directly in the template?
Handlebars.registerHelper ('getSelectedFragmentData',  function () {
    return Session.get('fragmentData') ||  {};
});

Handlebars.registerHelper('isEditMode', function() {
	return Session.get('editingExpander');
});

//convenience function for setting object values in the Session
//if this is slow then perhaps "flatten" objects when storing them in
//the Session
Session.setObjectValue = function (objectName, key, value) {
    var sessionObject = Session.get(objectName);
    sessionObject[key] = value;
    Session.set(objectName, sessionObject);
};

Session.getObjectValue = function (objectName, key) {
    try {
        var sessionObject = Session.get(objectName);
        return sessionObject[key];
    }
    catch (error) {
        console.log('error getting object value in session returning empty');
        return {};
    }
};
