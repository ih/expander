//TODO (irvin) why is expanders already taken?
Expanders = new Meteor.Collection('expanders');

/* uncomment when autopublish package removed
Meteor.subscribe('expanders');
*/
if (Meteor.is_client){
    Template.expander_keys.getAllExpanders = function () {
        return Expanders.find();
    };

    Template.expander_selector.events({
        'click button': function () {
            var expander_key =  $(event.target.parentElement).find('input').val();
            Session.set('selected_expander_key', expander_key);
        }
    });

    Template.expander_viewer.selected_expander = function () {
        return Expanders.findOne(Session.get("selected_expander_key"));
    };
}

