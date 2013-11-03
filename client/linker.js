Template.expanderLinker.events({
	'submit form': function (event, template) {
		event.preventDefault();
		var self = this;
		var toExpanderId = template.find('input').value;
		Meteor.call('linkExpanders', {
			fragment: {
				border: self.border,
				id: toExpanderId
			},
			fragmentContent: self.selectionString
		}, function (error, response) {
			if (error) {
				console.log(error.reason);
			}
			else {
				console.log(response);
			}
		});
	}
});
