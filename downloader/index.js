"use strict"

let request = require('request');
let Parser = require('./parser.js');

function getSiteMap() {
  return new Promise((resolve, reject) => {
     request.get({"url": "http://www.bbc.co.uk/food/sitemap.xml"}, (err,res,body) => {
         var parser = new Parser();
         parser.parse(body, (err, doc) => {
            resolve(doc);
         });
      });
   });
}

getSiteMap()
.then((urls)=> {
   urls.forEach((url) => {
      console.log("Downloading: " + url);
   });
})
.catch((e) => {
   console.error(e);
});
