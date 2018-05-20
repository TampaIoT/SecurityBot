console.log('------------------(START SCRIPT)------------------');
var port = 3031;
var io = require('../node_modules/socket.io').listen(port);
var mpu9250 = require('../drivers/mpu925x');
 
var mpu = new mpu9250({UpMagneto: true, DEBUG: true, GYRO_FS: 0, ACCEL_FS: 1});
 
var timer = 0;
 
var kalmanX = new mpu.Kalman_filter();
var kalmanY = new mpu.Kalman_filter();
 
if (mpu.initialize()) {
    console.log('MPU VALUE : ', mpu.getMotion9());
    console.log('listen to 0.0.0.0:' + port);
    console.log('Temperature : ' + mpu.getTemperatureCelsius());
    var values = mpu.getMotion9();
    var pitch = mpu.getPitch(values);
    var roll = mpu.getRoll(values);
    var yaw = mpu.getYaw(values);
    console.log('pitch value : ', pitch);
    console.log('roll value : ', roll);
    console.log('yaw value : ', yaw);
    kalmanX.setAngle(roll);
    kalmanY.setAngle(pitch);
 
    var micros = function() {
        return new Date().getTime();
    };
    var dt = 0;
 
    timer = micros();
 
    var interval;
 
    var kalAngleX = 0,
        kalAngleY = 0,
        kalAngleZ = 0,
        gyroXangle = roll,
        gyroYangle = pitch,
        gyroZangle = yaw,
        gyroXrate = 0,
        gyroYrate = 0,
        gyroZrate = 0,
        compAngleX = roll,
        compAngleY = pitch,
        compAngleZ = yaw;
 
    io.on('connection', function(socket) {
        var intervalTemp;
 
        socket.on('disconnect', function() {
            if (interval) {
                console.log('client is dead !');
                clearInterval(interval);
            }
            if (intervalTemp) {
                clearInterval(intervalTemp);
            }
        });
 
        socket.on('stop_data', function (data) {
            console.log('stop send data');
            if (interval) {
                clearInterval(interval);
            }
        });
 
        socket.on('send_data', function(data) {
            interval = setInterval(function() {
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
 
                gyroXangle += gyroXrate * dt;
                gyroYangle += gyroYrate * dt;
                compAngleX = 0.93 * (compAngleX + gyroXrate * dt) + 0.07 * roll;
                compAngleY = 0.93 * (compAngleY + gyroYrate * dt) + 0.07 * pitch;
 
                if (gyroXangle < -180 || gyroXangle > 180) gyroXangle = kalAngleX;
                if (gyroYangle < -180 || gyroYangle > 180) gyroYangle = kalAngleY;
 
                var accel = {
                    pitch: compAngleY,
                    roll: compAngleX
                };
 
                var magneto = mpu.getCompass(values[6], values[7], values[8]);
                console.log(values[6] + ' ' + values[7] + ' ' + values[8]);
                console.log(magneto);
                socket.emit('accel_data', {accel: accel, magneto: magneto});
            }, 1);
        });
 
        intervalTemp = setInterval(function() {
            socket.emit('temperature', {temperature: mpu.getTemperatureCelsiusDigital()});
        }, 300);
    });
}
else {
	console.log('did not initialize MPU 9255');
}
