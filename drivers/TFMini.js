var SerialPort = require('serialport');

var LiDAR = (function () {
	const TFMINI_BAUDRATE = 115200;

	const TFMINI_FRAME_SIZE = 7;

	const TFMINI_MAXBYTESBEFOREHEADER = 30;
	const TFMINI_MAX_MEASUREMENT_ATTEMPTS = 10;

	const READY = 0;
	const ERROR_SERIAL_NO_HEADER = 1;
	const ERROR_SERIAL_BADCHECKSUM = 2;
	const ERROR_SERIAL_TOOMANYTRIES = 3;
	const MEASUREMENT_OK = 10;

	const TFMINI_DEBUGMODE = 1;

	var lidar = {};

	lidar.start = function (updateHandler, erorHandler) {
		var portName = '/dev/ttyS0';
		var lastCh = 0x00;
		var numbChRead = 0;
		var serialPort = new SerialPort(portName, {

			baudRate: TFMINI_BAUDRATE,
			dataBits: 8,
			parity: 'none',
			stopBits: 1,
			flowControl: false
		});

		serialPort.on("open", function () {
			console.log('lidar port open');
			const init = [0x42, 0x57, 0x02, 0x00, 0x00, 0x00, 0x01, 0x06];

			if (this.opened) {
				this.opened();
			}

			serialPort.on('data', function (data) {
				numbChRead = 0;
				if (data[0] == 0x59 &&
					data[1] == 0x59 &&
					data.length == TFMINI_FRAME_SIZE + 2) {

					var cs = 0x00;

					for (var idx = 0; idx < TFMINI_FRAME_SIZE + 1; ++idx) {
						const ch = data[idx];
						cs += data[idx];
						cs = cs & 0xFF;
					}

					if (cs !== data[TFMINI_FRAME_SIZE + 1]) {
						console.log('mismatch', cs, data[TFMINI_FRAME_SIZE + 1]);
					}

					const frame = [];
					for (var idx = 0; idx < TFMINI_FRAME_SIZE; ++idx) {
						frame[idx] = data[idx + 2];
					}

					const dist = (frame[1] << 8) + frame[0];
					const st = (frame[3] << 8) + frame[2];
					const signalQuality = frame[5];

					updateHandler(dist, st, signalQuality);
				}
			});
		});
	};

	return lidar;
}());

module.exports = LiDAR;
