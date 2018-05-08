var Gpio = require('pigpio').Gpio,
    motionDetector = new Gpio(9, {mode: Gpio.INPUT});

var checkInterval = setInterval(checkForMotion, 100);

function checkForMotion() {
   var motion = motionDetector.digitalRead();
   console.log(motion);
}	

function endApp() {
	clearInterval(checkInterval);
}

setTimeout(endApp, 15000);
