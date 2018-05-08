var gps = require('../drivers/gps.js');

gps.start(
function(lat, lon) {
	console.log(lat, lon);
},
function() {
	console.log('no fix');
});
