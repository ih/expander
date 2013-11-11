//MOVE TO UTIL FILE
//http://stackoverflow.com/questions/4313841/javascript-how-can-i-insert-a-string-at-a-specific-index
String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

randomColor =  function () {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
};

choose = function(array) {
  return array[Math.floor(Math.random() * array.length)];
};

incrementCounterDictionary = function(counter, key) {
	if(_.has(counter, key)) {
		counter[key] += 1;
	}
	else {
		counter[key] = 1;
	}
};

// TODO find a better place for this?
getFragmentContent = function (fromExpanderId, toExpanderId) {
	var fromExpander = Expanders.findOne(fromExpanderId);
	// change to filter if the case for having multiple links between 
	// expanders comes up a lot
	var targetFragment = _.find(fromExpander.fragments, function (fragment) {
		return fragment.toExpanderId === toExpanderId;
	});
	return fromExpander.content.slice(
		targetFragment.border.open, targetFragment.border.close);
}
