var Gpio = require('pigpio').Gpio,
    buzzer = new Gpio(10, {mode: Gpio.OUTPUT});

var state = 0;

var toggleTimer = setInterval(function() {
	state = state === 1 ? 0 : 1;
	buzzer.digitalWrite(state);
}, 500);


setTimeout(function() {
	clearInterval(toggleTimer);
	buzzer.digitalWrite(1);
}, 5000);
