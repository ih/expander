Meteor.subscribe('expanders');

Template.recentlyEditedExpanders.getRecentlyEditedExpanders = function() {
	return Expanders.find({}, {sort: {lastEditTime: -1}, limit: 10});
};
