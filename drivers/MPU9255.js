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


I2cDev.prototype = Object.create(i2c.prototype, {
  bitMask: function (bit, bitLength) {
    return ((1 << bitLength) - 1) << (1 + bit - bitLength);
  },

  readBits: function (func, bit, bitLength, callback) {
    var mask = this.bitMask(bit, bitLength);

    this.readBytes(func, 1, function (err, buf) {
      var bits = (buf[0] & mask) >> (1 + bit - bitLength);
      callback(err, bits);
    });
  },

  readBit: function (func, bit, bitLength, callback) {
    this.readBits(func, bit, 1, callback);
  },

  writeBits: function (func, bit, bitLength, value) {
    var self = this;
    self.readBytes(func, 1, function (err, oldValue) {
      var mask = self.bitMask(bit, bitLength);
      var newValue = oldValue ^ ((oldValue ^ (value << bit)) & mask);
      self.writeBytes(func, [newValue], function (err) {
        if (err) {
          throw err;
        }
      });
    });
  },

  writeRegister: function (register, value) {
    this.i2c.readBytes(register, 1, function (err, data) {
      if (err) {
        throw err;
      }
      this.i2c.writeBytes(register, [value], function (err) {
        if (err) {
          throw err;
        }
      });
    });
  },

  writeBit: function (func, bit, value) {
    this.writeBits(func, bit, 1, value);
  }
});

MPU255.prototype = {
  WHO_AM_I: 117,
  WHO_I_AM: 0x73,

  ADDRESS_AD0_LOW: 0x68,
  ADDRESS_AD0_HIGH: 0x69,
  DEFAULT_ADDRESS: MPU9255.ADDRESS_AD0_LOW,

  MAG_WHO_AM_I: 0x00,
  MAG_WHO_I_AM: 0x48,

  MAG_DEFAULT_ADDRESS: 0x0C,  

  MAG_STATUS_01: 0x02,

  MAG_X_HIGH: 0x03,
  MAG_X_HIGH: 0x04,

  MAG_Y_HIGH: 0x05,
  MAG_Y_HIGH: 0x06,

  MAG_Z_HIGH: 0x07,
  MAG_Z_HIGH: 0x08,

  MAG_STATUS_02: 0x09,
   
  MAG_CNTL_1: 0x0A,
  MAG_CNTL_2: 0x0B,

  MAG_SAX: 0x10,
  MAG_SAY: 0x10,
  MAG_SAZ: 0x10,
  
  calibrating: 0,

  _maxX: 0,
  _maxY: 0,
  _maxZ: 0,
  _minX: 0xFFFF,
  _minY: 0xFFFF,
  _minZ: 0xFFFF,

  init: function () {
    this.i2c = new I2cDev(this.address, { device: this.device });
    this.initAcc();
    this.initGyro();
    this.initMagnetometer();
  },

  testConnection: function (callback) {
    this.i2c.readBytes(MPU9255.WHO_AM_I, 1, function (err, data) {
      if (err) {
        return callback(err);
      }

      callback(null, data == MPU9255.WHO_I_AM);
    });
  },

  initGyro: function () {
    this.i2c.writeRegister(5, 5);
  },

  initAcc: function () {

  },

  initMagnetometer: function () {

  },

  /**
   * Read the accelerometer
   * @param callback
   */
  readAcc: function (cb) {

  },

  readGyro: function (cb) {

  },

  readMagnetometer: function (cb) {
  
  },

  startCalibration: function (cb) {
    this._minX = 0xFFFF;
    this._minY = 0xFFFF;
    this._minY = 0xFFFF;

    this._maxX = 0;
    this._maxY = 0;
    this._maxY = 0;
  },

  finishCalibration: function (cb) {

  },

  cancelCompassCalibration: function () {

  },

  update: function () {

  }
}

function MPU9255(device, address) {
  this.device = device || '/dev/i2c-1';
  this.address = address || MPU9255.DEFAULT_ADDRESS;
}
