// database migrations
// http://stackoverflow.com/questions/10365496/meteor-how-to-perform-database-migrations
Migrations = new Meteor.Collection('migrations');

Meteor.startup(function () {
	if (!Migrations.findOne({name: "addTitle"})) {
		Expanders.find().forEach(function (expander) {
			if (!expander.title) {
				if (expander.fromExpanderIds.length > 0) {
					Expanders.update(
						expander._id, {$set: {title: getFragmentContent(
							expander.fromExpanderIds[0], expander._id)}});
				}
				else {
					Expanders.update(
						expander._id, {$set: {title: 'no title'}});
				}
			}
		});
		Migrations.insert({name: "addTitle"});
	}
	/* removed since fragments are subobjects of expander which has id already
	if (!Migrations.findOne({name: "addParentExpanderIdToFragment"})) {
		Expanders.find().forEach(function (expander) {
			_.each(expander.fragments, function (fragment) {
				fragment.parentExpanderId = expander._id;
			});
			Expanders.update(
				expander._id, {$set: {fragments: expander.fragments}});
		});
		Migrations.insert({name: "addParentExpanderIdToFragment"});
	}
	 */
	if (!Migrations.findOne({name: "removeParentExpanderIdFromFragment"})) {
		Expanders.find().forEach(function (expander) {
			_.each(expander.fragments, function (fragment) {
				delete fragment.parentExpanderId;
			});
			Expanders.update(
				expander._id, {$set: {fragments: expander.fragments}});
		});
		Migrations.insert({name: "removeParentExpanderIdFromFragment"});
	}
	if (!Migrations.findOne({name: "changeIdToToExpanderIdinFragment"})) {
		Expanders.find().forEach(function (expander) {
			_.each(expander.fragments, function (fragment) {
				fragment.toExpanderId = fragment.id;
				delete fragment.id;
			});
			Expanders.update(
				expander._id, {$set: {fragments: expander.fragments}});
		});
		Migrations.insert({name: "changeIdToToExpanderIdinFragment"});
	}

	if (!Migrations.findOne({name: 'addLastEditTime'})) {
		Expanders.find().forEach(function (expander) {
			if(!expander.lastEditTime) {
				var currentTime = new Date().getTime();
				Expanders.update(
					expander._id, {$set: {lastEditTime: currentTime}});
			}
		});
		Migrations.insert({name: "addLastEditTime"});
	}
	if (!Migrations.findOne({name: 'renameCreationDate'})) {
		Expanders.find().forEach(function (expander) {
			if (_.has(expander, 'creationDate')) {
				Expanders.update(
					expander._id, {$rename: {'creationDate': 'creationTime'}});
			}
			else {
				var currentTime = new Date().getTime();
				Expanders.update(
					expander._id, {$set: {'creationTime': currentTime}});
			}
		});
		Migrations.insert({name: "renameCreationDate"});
	}

	if (!Migrations.findOne({name: 'parentToFromExpanderIds'})) {
		Expanders.find().forEach(function (expander) {
			var fromExpanderIds = expander.parent ? [expander.parent] : [];
			Expanders.update(expander._id, {
				$set: {'fromExpanderIds': fromExpanderIds},
				$unset: {'parent': ''}
			});
		});
		Migrations.insert({name: "parentToFromExpanderIds"});
	}

	if (!Migrations.findOne({name: 'removeParentFragment'})) {
		Expanders.find().forEach(function (expander) {
			Expanders.update(expander._id, {
				$unset: {'parentFragment': ''}
			});
		});
		Migrations.insert({name: "removeParentFragment"});
	}
});
