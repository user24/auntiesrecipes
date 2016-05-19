"use strict"

let request = require('request');
let Parser = require('./parser.js');

request.get({"url": "http://www.bbc.co.uk/food/sitemap.xml"}, (err,res,body) => {
   var parser = new Parser();
   parser.parse(body, (err, doc) => {
      console.log(doc);
   });
});
