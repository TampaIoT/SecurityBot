var SerialPort  = require("serialport"),
    util  = require("util"),
    nmea = require('./NMEA.js');

var currentSentance = "";

var portName = '/dev/ttyS0';
var serialPort = new SerialPort(portName, {
   baudRate: 9600,
   dataBits: 8,
   parity: 'none',
   stopBits: 1,
   flowControl: false
});

serialPort.on("open", function () {
  console.log('open');

  serialPort.on('data', function(data) {
    for(var ch of data) {
        ch = String.fromCharCode(ch);
        if(ch === '\n') {
                if(currentSentance && currentSentance[0] === '$') {
                try
                {
                        var sentance = nmea.parse(currentSentance);
                        console.log(sentance.id);
                        switch(sentance.id) {
                                case 'GPGSV':
                                        console.log('Sats',sentance.count);
                                        break;
                                case 'GNGGA':
                                        console.log('Pos', sentance.latitude, sentance.longitude, sentance.satellites, sentance.fix, sentance.hdop);                          $
                                        break;
                        }
                        console.log(sentance.id);
                }
                catch(e) {}

                currentSentance = "";
                }
        }
        else {
                currentSentance += ch;
        }

    }
  });

});
