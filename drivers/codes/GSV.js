var Helper = require("../GpsHelper.js");
//TODO: docbloc
exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "GSV";
    this.talker_type_desc = "Global Satellites in View";
    this.parse = function(tokens) {
        var gsv;
        var i;
        var sat;
        if(tokens.length < 7) {
            throw new Error('GSV - not enough tokens (13): '+tokens.length+', tokens: '+tokens);
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for(i=0;i<tokens.length;++i) {
            tokens[i] = tokens[i].trim();
        }

        gsv = {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            msgs: Helper.parseIntX(tokens[1],10),
            mnum: Helper.parseIntX(tokens[2],10),
            count: Helper.parseIntX(tokens[3],10),
            sat:[]
        };

        // extract up to 4 sets of sat data
        for(i=4;i<tokens.length;i+= 4) {
            sat = {
                prn: Helper.parseIntX(tokens[i+0],10),
                el:Helper.parseIntX(tokens[i+1],10),
                az:Helper.parseIntX(tokens[i+2],10),
                ss:Helper.parseIntX(tokens[i+3],10)
            };

            gsv.sat.push(sat);
        }
        return gsv;
    };
};
