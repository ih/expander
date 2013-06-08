Handlebars.registerHelper('hide', function (condition) {
    return condition ? 'hide' : '';
});

Handlebars.registerHelper('show', function (condition) {
    return condition ? '' : 'hide';
});

// TODO is there a way to access Session variables directly in the template?
Handlebars.registerHelper ('getSelectedFragmentData',  function () {
    return Session.get('fragmentData') ||  {};
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
