/* Pulled from library 
https://github.com/nherment/node-nmea/tree/5bd3f87fad3e087f13e7c0cbb1d42a069d56d15a
 */

var SerialPort = require("serialport"),
	util = require("util"),
	nmea = require('./NMEA.js');

var GPS = (function () {

	var currentSentance = "";

	var portName = '/dev/ttyS0';
	var serialPort = new SerialPort(portName, {
		baudRate: 9600,
		dataBits: 8,
		parity: 'none',
		stopBits: 1,
		flowControl: false
	});


	var eventHandlers = {};

	var gps = {
	};

	gps.start = function (updateHandler, noFixHandler) {
		serialPort.on("open", function () {
			console.log('open');

			if (this.opened) {
				this.opened();
			}

			serialPort.on('data', function (data) {
				for (var ch of data) {
					ch = String.fromCharCode(ch);
					if (ch === '\n') {
						if (currentSentance && currentSentance[0] === '$') {
							try {
								var sentance = nmea.parse(currentSentance);
								switch (sentance.id) {
									case 'GPGSV':

										break;
									case 'GNGGA':
										if (updateHandler && sentance.fix) {
											updateHandler(sentance.latitude, sentance.longitude, sentance.satellites, sentance.hdop);
										}
										else if(noFixHandler && !sentance.fix) {
											noFixHandler();
										}
										break;
								}
							}
							catch (e) { }

						}

						currentSentance = "";
					}
					else {
						currentSentance += ch;
					}

				}
			});
		});
	};

	return gps;
}());

module.exports = GPS;
