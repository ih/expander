Meteor.publish('expanders', function() {
  return Expanders.find();
});
