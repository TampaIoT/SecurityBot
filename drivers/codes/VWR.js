
var Helper = require("../GpsHelper.js");

/*

VWR - Relative Wind Speed and Angle
         1  2  3  4  5  6  7  8 9
         |  |  |  |  |  |  |  | |
 $--VWR,x.x,a,x.x,N,x.x,M,x.x,K*hh<CR><LF>
Field Number:

1. Wind direction magnitude in degrees
2. Wind direction Left/Right of bow
3. Speed
4. N = Knots
5. Speed
6. M = Meters Per Second
7. Speed
8. K = Kilometers Per Hour
9. Checksum
 */

exports.Decoder = function (id) {
    this.id = id;
    this.talker_type_id = "VWR";
    this.talker_type_desc = "Relative Wind Speed and Angle";
    this._reference = function(char){
        switch(char){
            case "N" : return "Knots"
            case "M" : return "Meters Per Second"
            case "K" : return "Kilometers Per Hour"
        }  
    };

    this.parse = function (tokens) {
        if (tokens.length < 9) {
            throw new Error('VWR : not enough tokens');
        }

        return {
            id: tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            apparent_wind_angle: Helper.parseFloatX(tokens[1]),
            apparent_wind_off_bow: Helper.parseFloatX(tokens[2]),
            apparent_wind_speed_knots: Helper.parseFloatX(tokens[3]),
            apparent_wind_speed_mps: Helper.parseFloatX(tokens[4]),
            apparent_wind_speed_kph: Helper.parseFloatX(tokens[5])
        }
    };
};
