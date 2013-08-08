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
