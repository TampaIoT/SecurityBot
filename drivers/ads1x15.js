var ads1x15 = require('../node_modules/node-ads1x15');
var adc = new ads1x15(1); // set to 0 for ads1015

console.log('Test Started');

const timer = setInterval(function() {
    if(!adc.busy){
      adc.readADCSingleEnded(0, '4096', '250', function(err, data){ //channel, gain, samples
        if(!err){          
          voltage = 2*parseFloat(data)/1000;
          console.log("ADC: ", voltage);
        }
	else {
		console.log(err);
	}
      });
    }
    else {
	console.log('busy');
    }
}, 250);

setTimeout(function() {
	clearInterval(timer);	
}, 5000);

console.log('Test Finished');

