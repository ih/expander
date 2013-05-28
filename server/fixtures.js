    // fake data created if there is no data in the server
if (Expanders.find().count() ===  0) {
    Expanders.insert ({
	content:  'Training a deep belief network can be done by incrementally' + 
	    'creating stacks of restricted boltzman machines', 
	fragments:  []
    });
}
