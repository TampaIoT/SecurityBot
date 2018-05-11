//============================================================================================
// MPU9255 device I2C library code for Node.js is placed under the MIT license
// Copyright (c) 2018 Kevin D. Wolf
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// =============================================================================================

const i2c = require('../node_modules/i2c');

function MPU9255(device, address) {
  this.device = device || '/dev/i2c-1';
  this.address = address || MPU9255.DEFAULT_ADDRESS;
}

MPU9255.ADDRESS_AD0_LOW = 0x68;
MPU9255.ADDRESS_AD0_HIGH = 0x69;
MPU9255.DEFAULT_ADDRESS = MPU9255.ADDRESS_AD0_LOW;

MPU9255.prototype.init = function(callback) {
  this.i2c = new i2c(this.address, {device: this.device});
  
}

MPU9255.WHO_AM_I = 117;
MPU9255.WHO_I_AM = 0x73;

MPU9255.prototype.testConnection = function(callback) {
  this.readBytes(MPU9255.WHO_AM_I, 1, function (err, data) {
    if(err) {
      return callback(err);
    }

    callback(null, data == MPU9255.WHO_I_AM);
  });
};

MPU9255.prototype.writeRegister = function(register, value) {
  this.i2c.readBytes(register, 1, function(err, data) {
    if(err) {
      throw err;
    }
    this.i2c.writeBytes(register, [value], function(err) {
      if(err) {
        throw err;
      }
    });
  });
});

const address = 0x68;

const mpu9255 = new i2c(address, {device: '/dev/i2c-1'});

mpu9255.readByte(0x0A, 0b00000010, function(err, res) {
	if(err) {
		console.log("Could not initialize magnometer");
	}
});

mpu9255.writeByte(0x0A, 0b00000010, function(err, res) {
	if(err) {
		console.log("Could not initialize magnometer");
	}
});

const timer = setInterval(function() {
	mpu9255.readBytes( 0x03, 6, function(err, accData) {
		if(err) {
			console.log(err);
		}
		else {
			console.log(accData) 
			const accX = accData[0] << 8 | accData[1];
			console.log(accX);
		}

	});

}, 250);

setTimeout(function() {
	clearInterval(timer);
}, 5000);
