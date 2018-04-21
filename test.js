var gps = require('./gps.js');
console.log(gps);
gps.on('open', function() {
    console.log('we open');
});
gps.start();