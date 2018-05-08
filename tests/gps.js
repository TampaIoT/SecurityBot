var gps = require('../drivers/gps.js');

gps.start(function(val) {
	console.log(val);
});
