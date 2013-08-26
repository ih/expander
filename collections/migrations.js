// database migrations
// http://stackoverflow.com/questions/10365496/meteor-how-to-perform-database-migrations
Migrations = new Meteor.Collection('migrations');

Migrations.allow({
	insert: function(userId, doc) {return true;}
});

Meteor.startup(function () {
	if (!Migrations.findOne({name: "addTitle"})) {
		Expanders.find().forEach(function (expander) {
			if (!expander.title) {
				if (expander.parent) {
					Expanders.update(
						expander._id, {$set: {title: expander.parentFragment}});
				}
				else {
					Expanders.update(
						expander._id, {$set: {title: 'no title'}});
				}
			}
		});
		Migrations.insert({name: "addTitle"});
	}
	if (!Migrations.findOne({name: "addParentExpanderIdToFragment"})) {
		Expanders.find().forEach(function (expander) {
			_.each(expander.fragments, function(fragment) {
				fragment.parentExpanderId = expander._id;
			});
			Expanders.update(
				expander._id, {$set: {fragments: expander.fragments}});
		});
		Migrations.insert({name: "addParentExpanderIdToFragment"});
	}
});
