/*
 * GPS/Compass Module
 * http://www.radiolink.com.cn/doce/product-detail-115.html
 *
 * HMC5893 Data Sheet
 * https://aerocontent.honeywell.com/aero/common/documents/myaerospacecatalog-documents/Defense_Brochures-documents/HMC5983_3_Axis_Compass_IC.pdf
 * 
 * MPU925X Library 
 * https://github.com/miniben-90/mpu9250
 * Compass Module
 * https://github.com/psiphi75/compass-hmc5883l
 */
var app = require('express')();
var HMC5883L = require('compass-hmc5883l');

var request = require('request')
	, JSONStream = require('JSONStream')
	, es = require('event-stream');

var fs = require('fs');

var http = require('http').Server(app);
var io = require('socket.io')(http);
var exec = require('child_process').exec, child;
var port = process.env.PORT || 3000;
var ads1x15 = require('node-ads1x15');
var adc = new ads1x15(1); // set to 0 for ads1015
var i2c = require('i2c');
var mpu925x = require('./drivers/mpu925x');
var tfmini = require('./drivers/TFMini');
//var mqtt = require('mqtt');


/* With stick driver it's looking for wrong WHOAMI on MPU */
var mpu = new mpu925x({ UpMagneto: true, DEBUG: true, GYRO_FS: 0, ACCEL_FS: 1 });

//var compass = new HMC5883L(1);

var kalAngleX = 0,
	mpuInitialized = false,
	kalAngleY = 0,
	kalAngleZ = 0,
	gyroXangle = 0,
	gyroYangle = 0,
	gyroZangle = 0,
	gyroXrate = 0,
	gyroYrate = 0,
	gyroZrate = 0,
	compAngleX = 0,
	compAngleY = 0,
	compAngleZ = 0;

var lidarDist = 0,
	lidarSt = 0,
	lidarSignalQuality = 0;

var micros = function () {
	return new Date().getTime();
};

timer = micros();

var kalmanX = new mpu.Kalman_filter();
var kalmanY = new mpu.Kalman_filter();
var kalmanZ = new mpu.Kalman_filter();

if (mpu.initialize()) {
	mpuInitialized = true;
	var values = mpu.getMotion9();
	gyroXangle = mpu.getPitch(values);
	gyroYAngle = mpu.getRoll(values);
	gyroZAngle = mpu.getYaw(values);

	compAngleX = mpu.getPitch(values);
	compAngleY = mpu.getRoll(values);
	compAngleZ = mpu.getYaw(values);
}

tfmini.start(function (dist, st, quality) {
	lidarDist = dist;
	lidarSt = st;
	lidarSignalQuality = quality;
}, function (err) {

});

var Gpio = require('pigpio').Gpio,
	A1 = new Gpio(27, { mode: Gpio.OUTPUT }),
	A2 = new Gpio(17, { mode: Gpio.OUTPUT }),
	B1 = new Gpio(4, { mode: Gpio.OUTPUT }),
	B2 = new Gpio(18, { mode: Gpio.OUTPUT });
BUZZER = new Gpio(10, { mode: Gpio.OUTPUT }),
	LED = new Gpio(22, { mode: Gpio.OUTPUT });

app.get('/', function (req, res) {
	res.sendfile('./pages/Touch.html');
	console.log('HTML sent to client');
});

BUZZER.digitalWrite(1);

child = exec("sudo bash start_stream.sh", function (error, stdout, stderr) { });
/*
var mqttClient = mqtt.connect('mqtt://mqtt-dev.nuviot.com', {
	username:'nuviot',
	password:'Test1234'
});
mqttClient.on('connect', function() {
	console.log('hi');
})
*/

//compass.setOffsetMatrix(0, 0, 0);
//compass.setScaleMatrix(1, 1, 1);
//compass.initialize();

/*
gps.start(function(lat, lon, satCount, fix, hdop) {
	console.log("Position Detected", lat, lon, satCount, fix, hdop); 

	io.emit('fix',fix);
	if(fix === 1) {
		io.emit('lat',parseFloat(lat));
		io.emit('lon',parseFloat(lon));
	}
	else  {
		io.emit('lat',-1);
		io.emit('lon',-1);
	}
});
*/
if (!mpu.initialize()) {
	console.log('ERROR - MPU925X Not Online');
}
else {
	console.log('MPU925X Online');
}

//Whenever someone connects this gets executed
io.on('connection', function (socket) {
	console.log('A user connected');

	socket.on('pos', function (msx, msy) {
		msx = Math.min(Math.max(parseInt(msx), -255), 255);
		msy = Math.min(Math.max(parseInt(msy), -255), 255);

		if (msx > 0) {
			A1.pwmWrite(msx);
			A2.pwmWrite(0);
		} else {
			A1.pwmWrite(0);
			A2.pwmWrite(Math.abs(msx));
		}

		if (msy > 0) {
			B1.pwmWrite(msy);
			B2.pwmWrite(0);
		} else {
			B1.pwmWrite(0);
			B2.pwmWrite(Math.abs(msy));
		}
	});

	socket.on('horn', function (toggle) {
		console.log('horn click');
		BUZZER.digitalWrite(0);
		setTimeout(function () {
			BUZZER.digitalWrite(1);
		}, 500);
	});

	socket.on('light', function (toggle) {
		console.log('Toggle Light', toggle);
		LED.digitalWrite(toggle);
	});

	socket.on('cam', function (toggle) {
		var numPics = 0;
		console.log('Taking a picture.');
		//Count jpg files in directory to prevent overwriting
		child = exec("find -type f -name '*.jpg' | wc -l", function (error, stdout, stderr) {
			numPics = parseInt(stdout) + 1;
			// Turn off streamer, take photo, restart streamer
			var command = 'sudo killall mjpg_streamer ; raspistill -o cam' + numPics + '.jpg -n && sudo bash start_stream.sh';
			//console.log("command: ", command);
			child = exec(command, function (error, stdout, stderr) {
				console.log('Picture taken.');

				var fileName = `cam${numPics}.jpg`;

				var postOptions = {
					hostname: 'swamp.lidskc.iothost.net',
					path: '/sensor/securitybot002/media',
					port: 8050,
					method: 'POST',
					header: {
						'Content-Type': 'image/jpeg'
					}
				}

				var req = request.post('http://swamp.lidskc.iothost.net:8050/sensor/securitybot002/media', function (err, resp, body) {
					if (err) {
						console.log('Error!');
					} else {
						console.log('URL: ' + body);
					}
				});

				data = fs.readFileSync(fileName);
				console.log('Length is: ' + data.length);

				var crlf = "\r\n",
					boundaryKey = Math.random().toString(16),
					boundary = `--${boundaryKey}`,
					delimeter = `${crlf}--${boundary}`,
					headers = [
						'Content-Disposition: form-data; name="file"; filename="file.jpg;"' + crlf
					],
					closeDelimeter = `${delimeter}--`,
					multipartBody;
  
					/*
				multipartBody = Buffer.concat([
					new Buffer(delimeter + crlf + headers.join('') + crlf),
					data,
					new Buffer(closeDelimeter)]
				);*/

				req.setHeader('Content-Type', 'image/jpg');
				req.setHeader('Content-Length', data.length);

				req.write(data);
				req.end();

				io.emit('cam', 1);
			});
		});

	});

	socket.on('power', function (toggle) {
		child = exec("sudo poweroff");
	});

	//Whenever someone disconnects this piece of code is executed
	socket.on('disconnect', function () {
		console.log('A user disconnected');
	});

	setInterval(function () { // send temperature every 5 sec
		console.log("Timer Fired");

		child = exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
			if (error !== null) {
				console.log('exec error: ' + error);
			} else {
				var temp = parseFloat(stdout) / 1000;
				io.emit('temp', temp);
				console.log('temp', temp);
			}
		});

		io.emit('lidar', { dist: lidarDist, st: lidarDist, signalQuality: lidarSignalQuality });

		if (mpuInitialized) {
			var values = mpu.getMotion9();

			var dt = (micros() - timer) / 1000000;
			timer = micros();

			pitch = mpu.getPitch(values);
			roll = mpu.getRoll(values);
			yaw = mpu.getYaw(values);

			var gyroXrate = values[3] / 131.0;
			var gyroYrate = values[4] / 131.0;
			var gyroZrate = values[5] / 131.0;

			if ((roll < -90 && kalAngleX > 90) || (roll > 90 && kalAngleX < -90)) {
				kalmanX.setAngle(roll);
				compAngleX = roll;
				kalAngleX = roll;
				gyroXangle = roll;
			} else {
				kalAngleX = kalmanX.getAngle(roll, gyroXrate, dt);
			}

			if (Math.abs(kalAngleX) > 90) {
				gyroYrate = -gyroYrate;
			}
			kalAngleY = kalmanY.getAngle(pitch, gyroYrate, dt);
			kalAngleZ = kalmanZ.getAngle(yaw, gyroZrate, dt);

			gyroXangle += gyroXrate * dt;
			gyroYangle += gyroYrate * dt;
			gyroZangle += gyroZrate * dt;

			compAngleX = 0.93 * (compAngleX + gyroXrate * dt) + 0.07 * roll;
			compAngleY = 0.93 * (compAngleY + gyroYrate * dt) + 0.07 * pitch;
			compAngleZ = 0.93 * (compAngleZ + gyroZrate * dt) + 0.07 * yaw;

			if (gyroXangle < -180 || gyroXangle > 180) gyroXangle = kalAngleX;
			if (gyroYangle < -180 || gyroYangle > 180) gyroYangle = kalAngleY;
			if (gyroZangle < -180 || gyroZangle > 180) gyroZangle = kalAngleZ;

			var accel = {
				pitch: compAngleY,
				roll: compAngleX,
				yaw: compAngleZ
			};

			//				var magneto = mpu.getCompass(values[6], values[7], values[8]);
			//				console.log(values[6] + ' ' + values[7] + ' ' + values[8]);
			//				console.log(magneto);
			var magneto = { 'x': values[6], 'y': values[7], 'z': values[8] };
			io.emit('accel_data', { accel: accel, magneto: magneto });
		}

		//	compass.getHeadingDegrees('x','y', function(err, heading) {
		//		console.log(heading* 180 / Math.PI);
		//	});

		/*
			compass.getRawValues(function(err, vals) {
				if(err) {
					console.log(err);
				}
				else {
					console.log(vals);
				}
			});*/

		if (!adc.busy) {
			adc.readADCSingleEnded(0, '4096', '250', function (err, data) { //channel, gain, samples
				if (!err) {
					voltage = 2 * parseFloat(data) / 1000;
					console.log("ADC: ", voltage);
					io.emit('volt', voltage);
				}
			});
		}
	}, 1000);

});

http.listen(port, function () {
	console.log('listening on *:' + port);
});
