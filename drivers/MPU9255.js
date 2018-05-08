const i2c = require('i2c');

const address = 0x68;

const mpu9255 = new i2c(address, {device: '/dev/i2c-1'});

console.log('Startup');

mpu9255.scan(function(err, data) {
	console.log('scan completed');
	if(err) {
		console.log(err);
	}
	else {
		for(let addr of data) {
			console.log(addr.toString(16));
		}
	}
});
/*
mpu9255.readByte(function(err, res) {
	if(err) {
		console.log(err);
	}
	else {
		console.log(res);
	}
});
*/
mpu9255.readBytes(117, 1, function(err, res) {
	console.log('read completed');
	if(err) {
		console.log(err);
	}
	else {
		console.log(res[0].toString(16));
	}

});

