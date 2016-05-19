
"use strict"

var htmlparser = require('htmlparser2');

module.exports = class Parser {
  parse(body, done) {
    var items = [];

    var openTag;
    var inItem=false;
    var item; 

    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            if(name == "loc"){
                inItem=true;
            }
            openTag = name;
        },
        ontext: function(text) { 
            if(inItem && text.length > 0) {
                items.push(text)
            }
        },
        onclosetag: function(name) {
            if (name=="loc") {
                inItem=false;
            }
            openTag=null;
        },
        onend: function() {
            done(null, items);
        }
        }, {decodeEntities: true});
    parser.write(body);
    parser.end();
  }
};
